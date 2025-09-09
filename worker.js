/**
 * Pet Marketplace Cloudflare Worker API
 * Full-stack backend with D1, R2, KV, JWT authentication, RBAC, and comprehensive endpoints
 * Pure JavaScript version for direct Cloudflare Dashboard deployment
 */

// Simple router implementation (no external dependencies)
class SimpleRouter {
  constructor() {
    this.routes = [];
  }

  addRoute(method, path, handler) {
    this.routes.push({ method: method.toUpperCase(), path, handler });
  }

  get(path, handler) {
    this.addRoute('GET', path, handler);
  }

  post(path, handler) {
    this.addRoute('POST', path, handler);
  }

  put(path, handler) {
    this.addRoute('PUT', path, handler);
  }

  delete(path, handler) {
    this.addRoute('DELETE', path, handler);
  }

  options(path, handler) {
    this.addRoute('OPTIONS', path, handler);
  }

  all(path, handler) {
    this.addRoute('*', path, handler);
  }

  matchRoute(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== '*' && route.method !== method) continue;
      
      const routeRegex = this.pathToRegex(route.path);
      const match = pathname.match(routeRegex);
      
      if (match) {
        const params = this.extractParams(route.path, pathname);
        return { handler: route.handler, params };
      }
    }
    return null;
  }

  pathToRegex(path) {
    // Convert path like "/api/pets/:id" to regex
    const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('^' + escapedPath.replace(/:\w+/g, '([^/]+)') + '$');
  }

  extractParams(routePath, actualPath) {
    const params = {};
    const routeParts = routePath.split('/');
    const actualParts = actualPath.split('/');
    
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        const paramName = routeParts[i].slice(1);
        params[paramName] = actualParts[i];
      }
    }
    return params;
  }

  async handle(request, env, ctx) {
    const url = new URL(request.url);
    const match = this.matchRoute(request.method, url.pathname);
    
    if (match) {
      // Add params to request object
      request.params = match.params;
      return await match.handler(request, env, ctx);
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Router instance
const router = new SimpleRouter();

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Will be set dynamically based on request origin
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name, Accept-Language, Accept-Encoding',
  'Access-Control-Allow-Credentials': 'false', // Set to false to allow wildcard origin
  'Access-Control-Max-Age': '86400', // 24 hours preflight cache
  'Access-Control-Expose-Headers': 'X-Total-Count, X-Page-Count',
  'Vary': 'Origin', // Important for proper CORS handling
};

// Utility functions
const generateId = () => {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const generateSlug = (title) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const verifyPassword = async (password, hash) => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
};

const generateJWT = async (payload, secret) => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
};

const verifyJWT = async (token, secret) => {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      ),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );
    
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    if (encodedSignature !== expectedSignature) {
      return null;
    }
    
    return JSON.parse(atob(encodedPayload));
  } catch (error) {
    return null;
  }
};

const createSlug = (title) => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

const logAudit = async (env, actorId, action, targetType, targetId, metadata = {}, ip = '', ua = '') => {
  try {
    await env.PET_DB.prepare(`
      INSERT INTO audit_logs (id, actorId, action, targetType, targetId, metadata, ip, ua)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      generateId(),
      actorId,
      action,
      targetType,
      targetId,
      JSON.stringify(metadata),
      ip,
      ua
    ).run();
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};

const trackAnalytics = async (env, sessionId, userId, event, properties = {}, ip = '', ua = '', referer = '') => {
  try {
    await env.PET_DB.prepare(`
      INSERT INTO analytics_events (id, sessionId, userId, event, properties, ip, ua, referer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      generateId(),
      sessionId,
      userId,
      event,
      JSON.stringify(properties),
      ip,
      ua,
      referer
    ).run();
  } catch (error) {
    console.error('Failed to track analytics:', error);
  }
};

// Authentication middleware
const requireAuth = async (request, env) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || 
                request.headers.get('X-Auth-Token') ||
                getCookieValue(request.headers.get('Cookie'), 'auth_token');

  if (!token) {
    return { error: 'Authentication required', status: 401 };
  }

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) {
    return { error: 'Invalid token', status: 401 };
  }

  // Check if session exists and is not expired
  const session = await env.PET_DB.prepare(`
    SELECT * FROM sessions 
    WHERE token = ? AND expiresAt > datetime('now')
  `).bind(token).first();

  if (!session) {
    return { error: 'Session expired', status: 401 };
  }

  // Get user data
  const user = await env.PET_DB.prepare(`
    SELECT id, fullName, email, phone, role, status, avatarUrl, canSell, balance
    FROM users WHERE id = ? AND status = 'active'
  `).bind(session.userId).first();

  if (!user) {
    return { error: 'User not found or inactive', status: 401 };
  }

  return { user, session };
};

const requireRole = (roles) => {
  return async (request, env) => {
    const authResult = await requireAuth(request, env);
    if (authResult.error) return authResult;

    const { user } = authResult;
    if (!roles.includes(user.role)) {
      return { error: 'Insufficient permissions', status: 403 };
    }

    return authResult;
  };
};

const getCookieValue = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

// Rate limiting middleware
const rateLimit = async (env, key, limit = 100, window = 3600) => {
  try {
    const count = await env.RATELIMIT_KV.get(key);
    const currentCount = count ? parseInt(count) : 0;
    
    if (currentCount >= limit) {
      return { error: 'Rate limit exceeded', status: 429 };
    }
    
    await env.RATELIMIT_KV.put(key, (currentCount + 1).toString(), { expirationTtl: window });
    return { success: true };
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { success: true }; // Fail open
  }
};

// Helper function to set CORS headers dynamically
const setCorsHeaders = (request, env) => {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080', 
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080',
    'https://hipet-market.pages.dev',
    'https://petmarket.tocotoco.workers.dev',
    'https://zewk3.github.io', // Add GitHub Pages origin
    env.ALLOWED_ORIGIN
  ].filter(Boolean);

  const headers = { ...corsHeaders };
  
  // Set specific origin if it's in allowed list, otherwise use wildcard
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else {
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Credentials'] = 'false';
  }
  
  return headers;
};

// CORS preflight handler with enhanced headers
router.options('*', (request, env) => {
  try {
    const dynamicCorsHeaders = setCorsHeaders(request, env);
    return new Response(null, {
      status: 200, // HTTP 200 required for successful preflight
      headers: {
        ...dynamicCorsHeaders,
        'Content-Length': '0'
      }
    });
  } catch (error) {
    console.error('CORS preflight error:', error);
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Length': '0'
      }
    });
  }
});

// Health check
router.get('/api/health', () => {
  return new Response(JSON.stringify({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
});

// Development seed endpoint
router.post('/api/dev/seed', async (request, env) => {
  if (env.DEV !== 'true') {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    // Run seed data
    const seedSQL = `
      -- Insert demo users with proper password hashes
      INSERT OR IGNORE INTO users (id, fullName, email, phone, passwordHash, role, status, avatarUrl) VALUES
      ('demo_buyer_001', 'Nguyễn Văn Hùng', 'buyer@demo.com', '0901234567', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'buyer', 'active', 'https://via.placeholder.com/150/0066CC/FFFFFF?text=BU'),
      ('demo_seller_001', 'Trần Thị Linh', 'seller@demo.com', '0912345678', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'seller', 'active', 'https://via.placeholder.com/150/009966/FFFFFF?text=SE'),
      ('demo_admin_001', 'Lê Văn Quản', 'admin@demo.com', '0923456789', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'admin', 'active', 'https://via.placeholder.com/150/CC0000/FFFFFF?text=AD'),
      ('demo_support_001', 'Phạm Thị Hỗ Trợ', 'support@demo.com', '0934567890', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'support', 'active', 'https://via.placeholder.com/150/FF6600/FFFFFF?text=SU');
    `;
    
    await env.PET_DB.exec(seedSQL);
    
    return new Response(JSON.stringify({ 
      message: 'Database seeded successfully',
      accounts: [
        { email: 'buyer@demo.com', password: 'demo123', role: 'buyer' },
        { email: 'seller@demo.com', password: 'demo123', role: 'seller' },
        { email: 'admin@demo.com', password: 'demo123', role: 'admin' },
        { email: 'support@demo.com', password: 'demo123', role: 'support' }
      ]
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Authentication endpoints
router.post('/api/auth/register', async (request, env) => {
  try {
    const { fullName, email, phone, password } = await request.json();
    
    // Validation
    if (!fullName || !email || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Check if email exists
    const existingUser = await env.PET_DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(email).first();

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = generateId();
    const role = 'user'; // Default unified user role
    const canSell = 0; // Default: cannot sell initially
    const balance = 1000; // Default balance: $10.00 (in cents)

    // Create user
    await env.PET_DB.prepare(`
      INSERT INTO users (id, fullName, email, phone, passwordHash, role, status, canSell, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, fullName, email, phone || null, passwordHash, role, 'active', canSell.toString(), balance.toString()).run();

    // Create session
    const sessionId = generateId();
    const token = await generateJWT({ userId, sessionId }, env.JWT_SECRET);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    await env.PET_DB.prepare(`
      INSERT INTO sessions (id, userId, token, ip, ua, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(sessionId, userId, token, request.headers.get('CF-Connecting-IP') || '', request.headers.get('User-Agent') || '', expiresAt).run();

    // Get user data
    const user = await env.PET_DB.prepare(`
      SELECT id, fullName, email, phone, role, status, avatarUrl, canSell, balance, createdAt
      FROM users WHERE id = ?
    `).bind(userId).first();

    // Track analytics
    await trackAnalytics(env, sessionId, userId, 'user_registered', { role }, request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'));

    return new Response(JSON.stringify({ 
      user, 
      token,
      message: 'Registration successful'
    }), {
      headers: { 
        'Content-Type': 'application/json', 
        'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/`,
        ...corsHeaders 
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

router.post('/api/auth/login', async (request, env) => {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Find user
    const user = await env.PET_DB.prepare(`
      SELECT id, fullName, email, phone, passwordHash, role, status, avatarUrl, canSell, balance, createdAt
      FROM users WHERE email = ? AND status = 'active'
    `).bind(email).first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Create session
    const sessionId = generateId();
    const token = await generateJWT({ userId: user.id, sessionId }, env.JWT_SECRET);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    await env.PET_DB.prepare(`
      INSERT INTO sessions (id, userId, token, ip, ua, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(sessionId, user.id, token, request.headers.get('CF-Connecting-IP') || '', request.headers.get('User-Agent') || '', expiresAt).run();

    // Remove password hash from response
    delete user.passwordHash;

    // Track analytics
    await trackAnalytics(env, sessionId, user.id, 'user_login', { role: user.role }, request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'));

    return new Response(JSON.stringify({ 
      user, 
      token,
      message: 'Login successful'
    }), {
      headers: { 
        'Content-Type': 'application/json', 
        'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/`,
        ...corsHeaders 
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

router.post('/api/auth/logout', async (request, env) => {
  try {
    const authResult = await requireAuth(request, env);
    if (authResult.error) {
      return new Response(JSON.stringify(authResult), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { session } = authResult;

    // Delete session
    await env.PET_DB.prepare(`
      DELETE FROM sessions WHERE id = ?
    `).bind(session.id).run();

    return new Response(JSON.stringify({ message: 'Logout successful' }), {
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': 'auth_token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
        ...corsHeaders 
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

router.get('/api/auth/me', async (request, env) => {
  try {
    const authResult = await requireAuth(request, env);
    if (authResult.error) {
      return new Response(JSON.stringify(authResult), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { user } = authResult;
    return new Response(JSON.stringify({ user }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// User management endpoints for unified system
router.post('/api/users/enable-selling', async (request, env) => {
  try {
    const authResult = await requireAuth(request, env);
    if (authResult.error) {
      return new Response(JSON.stringify(authResult), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { user } = authResult;

    // Enable selling capability for the user
    await env.PET_DB.prepare(`
      UPDATE users SET canSell = 1 WHERE id = ?
    `).bind(user.id).run();

    // Log audit trail
    await logAudit(env, user.id, 'user_enabled_selling', 'user', user.id, {}, 
                   request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'));

    // Get updated user data
    const updatedUser = await env.PET_DB.prepare(`
      SELECT id, fullName, email, phone, role, status, avatarUrl, canSell, balance
      FROM users WHERE id = ?
    `).bind(user.id).first();

    return new Response(JSON.stringify({ 
      user: updatedUser,
      message: 'Selling capability enabled successfully'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

router.post('/api/users/topup', async (request, env) => {
  try {
    const authResult = await requireAuth(request, env);
    if (authResult.error) {
      return new Response(JSON.stringify(authResult), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { user } = authResult;
    const { amount, paymentMethod = 'demo' } = await request.json();

    // Validation
    if (!amount || amount <= 0 || amount > 100000) { // Max $1000
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Convert amount to cents
    const amountCents = Math.round(amount * 100);

    // Update user balance
    await env.PET_DB.prepare(`
      UPDATE users SET balance = balance + ? WHERE id = ?
    `).bind(amountCents.toString(), user.id).run();

    // Log audit trail
    await logAudit(env, user.id, 'user_topup', 'user', user.id, 
                   { amount: amountCents, paymentMethod }, 
                   request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'));

    // Track analytics
    await trackAnalytics(env, user.id, user.id, 'balance_topup', 
                        { amount: amountCents, paymentMethod }, 
                        request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'));

    // Get updated user data
    const updatedUser = await env.PET_DB.prepare(`
      SELECT id, fullName, email, phone, role, status, avatarUrl, canSell, balance
      FROM users WHERE id = ?
    `).bind(user.id).first();

    return new Response(JSON.stringify({ 
      user: updatedUser,
      message: `Successfully topped up $${amount.toFixed(2)}`
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Pet listings endpoints
router.get('/api/pets', async (request, env) => {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const species = url.searchParams.get('species') || '';
    const province = url.searchParams.get('province') || '';
    const priceMin = parseInt(url.searchParams.get('priceMin')) || 0;
    const priceMax = parseInt(url.searchParams.get('priceMax')) || 999999999;
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);
    const offset = (page - 1) * limit;

    let whereConditions = ['status IN (?, ?)'];
    let params = ['approved', 'sold'];

    if (search) {
      whereConditions.push('(title LIKE ? OR description LIKE ? OR breed LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (species) {
      whereConditions.push('species = ?');
      params.push(species);
    }

    if (province) {
      whereConditions.push('locationProvince = ?');
      params.push(province);
    }

    if (priceMin > 0) {
      whereConditions.push('price >= ?');
      params.push(priceMin.toString());
    }

    if (priceMax < 999999999) {
      whereConditions.push('price <= ?');
      params.push(priceMax.toString());
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await env.PET_DB.prepare(`
      SELECT COUNT(*) as total FROM pets WHERE ${whereClause}
    `).bind(...params).first();

    // Get pets with seller info
    const pets = await env.PET_DB.prepare(`
      SELECT 
        p.*,
        u.fullName as sellerName,
        u.avatarUrl as sellerAvatar,
        (SELECT AVG(rating) FROM reviews WHERE targetUserId = p.sellerId) as sellerRating,
        (SELECT COUNT(*) FROM reviews WHERE targetUserId = p.sellerId) as sellerReviewCount
      FROM pets p
      JOIN users u ON p.sellerId = u.id
      WHERE ${whereClause}
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    // Parse JSON fields
    const petsWithParsedData = pets.results.map(pet => ({
      ...pet,
      photos: pet.photos ? JSON.parse(pet.photos) : [],
      sellerRating: pet.sellerRating ? parseFloat(pet.sellerRating.toFixed(1)) : null
    }));

    return new Response(JSON.stringify({
      pets: petsWithParsedData,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

router.get('/api/pets/:slug', async (request, env) => {
  try {
    const { slug } = request.params;

    // Get pet with seller info
    const pet = await env.PET_DB.prepare(`
      SELECT 
        p.*,
        u.fullName as sellerName,
        u.email as sellerEmail,
        u.phone as sellerPhone,
        u.avatarUrl as sellerAvatar,
        u.createdAt as sellerJoinedAt,
        (SELECT AVG(rating) FROM reviews WHERE targetUserId = p.sellerId) as sellerRating,
        (SELECT COUNT(*) FROM reviews WHERE targetUserId = p.sellerId) as sellerReviewCount
      FROM pets p
      JOIN users u ON p.sellerId = u.id
      WHERE p.slug = ? AND p.status IN ('approved', 'sold')
    `).bind(slug).first();

    if (!pet) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Increment view count
    await env.PET_DB.prepare(`
      UPDATE pets SET viewCount = viewCount + 1 WHERE id = ?
    `).bind(pet.id).run();

    // Get pet attributes
    const attributes = await env.PET_DB.prepare(`
      SELECT key, value FROM pet_attributes WHERE petId = ?
    `).bind(pet.id).all();

    // Parse JSON fields
    const petData = {
      ...pet,
      photos: pet.photos ? JSON.parse(pet.photos) : [],
      attributes: attributes.results.reduce((acc, attr) => {
        acc[attr.key] = attr.value;
        return acc;
      }, {}),
      sellerRating: pet.sellerRating ? parseFloat(pet.sellerRating.toFixed(1)) : null,
      viewCount: pet.viewCount + 1
    };

    // Track analytics
    const sessionId = generateId();
    await trackAnalytics(env, sessionId, null, 'pet_viewed', { petId: pet.id, species: pet.species }, request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'));

    return new Response(JSON.stringify({ pet: petData }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Upload endpoint for R2
router.post('/api/upload/presign', async (request, env) => {
  try {
    const authResult = await requireRole(['seller', 'admin'])(request, env);
    if (authResult.error) {
      return new Response(JSON.stringify(authResult), {
        status: authResult.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { contentType, fileName } = await request.json();
    
    if (!contentType || !fileName) {
      return new Response(JSON.stringify({ error: 'contentType and fileName required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, and WebP allowed.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const key = `pets/${generateId()}-${fileName}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Generate presigned URL for R2
    const presignedUrl = await env.PET_IMAGES.url(key, {
      method: 'PUT',
      expires: Math.floor(expiresAt.getTime() / 1000),
      headers: {
        'Content-Type': contentType
      }
    });

    const publicUrl = `${env.R2_PUBLIC_BASE}/${key}`;

    return new Response(JSON.stringify({
      uploadUrl: presignedUrl,
      publicUrl,
      key,
      expiresAt: expiresAt.toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// ===== PET MANAGEMENT ENDPOINTS =====

// Create new pet listing
router.post('/api/pets', async (request, env) => {
  const authResult = await requireAuth(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const { user } = authResult;
    
    // Check if user can sell pets
    if (!user.canSell && user.role !== 'admin') {
      return new Response(JSON.stringify({ 
        error: 'You need to enable selling capability first',
        requiresSellerRegistration: true
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const petData = await request.json();
    
    // Validate required fields
    const required = ['title', 'species', 'breed', 'sex', 'ageMonths', 'price', 'description', 'locationProvince'];
    for (const field of required) {
      if (!petData[field]) {
        return new Response(JSON.stringify({ error: `${field} is required` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // Check and deduct posting fee ($0.50 = 50 cents)
    const postingFee = 50; // 50 cents
    if (user.balance < postingFee && user.role !== 'admin') {
      return new Response(JSON.stringify({ 
        error: 'Insufficient balance for posting fee ($0.50)',
        currentBalance: user.balance / 100,
        requiredBalance: postingFee / 100,
        requiresTopUp: true
      }), {
        status: 402, // Payment Required
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const id = generateId();
    const slug = generateSlug(petData.title);
    const photos = JSON.stringify(petData.photos || []);
    const personalityTraits = Array.isArray(petData.personalityTraits) 
      ? petData.personalityTraits.join(',') 
      : petData.personalityTraits || '';

    // Start transaction-like operations
    await env.PET_DB.prepare(`
      INSERT INTO pets (
        id, sellerId, title, slug, species, breed, sex, ageMonths, 
        vaccinated, dewormed, price, description, locationProvince, 
        photos, status, weight, height, color, personalityTraits
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `).bind(
      id, user.id, petData.title, slug, petData.species, petData.breed,
      petData.sex, petData.ageMonths, petData.vaccinated ? 1 : 0,
      petData.dewormed ? 1 : 0, petData.price, petData.description,
      petData.locationProvince, photos, petData.weight || null,
      petData.height || null, petData.color || '', personalityTraits
    ).run();

    // Deduct posting fee (skip for admin)
    if (user.role !== 'admin') {
      await env.PET_DB.prepare(`
        UPDATE users SET balance = balance - ? WHERE id = ?
      `).bind(postingFee.toString(), user.id).run();

      // Log posting fee deduction
      await logAudit(env, user.id, 'posting_fee_deducted', 'user', user.id, 
                     { amount: postingFee, petId: id }, 
                     request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'));
    }

    // Log audit
    await logAudit(env, user.id, 'CREATE', 'pet', id, petData);

    // Track analytics
    await trackAnalytics(env, user.id, user.id, 'pet_listing_created', 
                        { species: petData.species, price: petData.price }, 
                        request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'));

    return new Response(JSON.stringify({ 
      success: true, 
      id, 
      slug,
      postingFeeDeducted: user.role !== 'admin' ? postingFee / 100 : 0,
      message: 'Pet listing created successfully and pending approval' 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Create pet error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create pet listing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Update pet listing
router.put('/api/pets/:id', async (request, env) => {
  const authResult = await requireAuth(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const { user } = authResult;
    const petId = request.params.id;
    const petData = await request.json();

    // Check if pet exists and user owns it (or is admin)
    const pet = await env.PET_DB.prepare(`
      SELECT * FROM pets WHERE id = ?
    `).bind(petId).first();

    if (!pet) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (pet.sellerId !== user.id && user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const updateFields = [];
    const updateValues = [];

    // Build dynamic update query
    const updatableFields = ['title', 'species', 'breed', 'sex', 'ageMonths', 'vaccinated', 'dewormed', 'price', 'description', 'locationProvince', 'weight', 'height', 'color', 'personalityTraits'];
    
    for (const field of updatableFields) {
      if (petData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        if (field === 'vaccinated' || field === 'dewormed') {
          updateValues.push(petData[field] ? 1 : 0);
        } else if (field === 'personalityTraits' && Array.isArray(petData[field])) {
          updateValues.push(petData[field].join(','));
        } else {
          updateValues.push(petData[field]);
        }
      }
    }

    if (petData.photos) {
      updateFields.push('photos = ?');
      updateValues.push(JSON.stringify(petData.photos));
    }

    if (petData.title) {
      updateFields.push('slug = ?');
      updateValues.push(generateSlug(petData.title));
    }

    updateFields.push('updatedAt = ?');
    updateValues.push(new Date().toISOString());

    updateValues.push(petId);

    if (updateFields.length > 1) { // More than just updatedAt
      await env.PET_DB.prepare(`
        UPDATE pets SET ${updateFields.join(', ')} WHERE id = ?
      `).bind(...updateValues).run();

      // Log audit
      await logAudit(env, user.id, 'UPDATE', 'pet', petId, petData);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Pet listing updated successfully' 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Update pet error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update pet listing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Delete pet listing
router.delete('/api/pets/:id', async (request, env) => {
  const authResult = await requireAuth(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const { user } = authResult;
    const petId = request.params.id;

    // Check if pet exists and user owns it (or is admin)
    const pet = await env.PET_DB.prepare(`
      SELECT * FROM pets WHERE id = ?
    `).bind(petId).first();

    if (!pet) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (pet.sellerId !== user.id && user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Soft delete (change status to 'deleted')
    await env.PET_DB.prepare(`
      UPDATE pets SET status = 'deleted', updatedAt = ? WHERE id = ?
    `).bind(new Date().toISOString(), petId).run();

    // Log audit
    await logAudit(env, user.id, 'DELETE', 'pet', petId, { reason: 'User deletion' });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Pet listing deleted successfully' 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Delete pet error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete pet listing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Get seller's pets
router.get('/api/seller/pets', async (request, env) => {
  const authResult = await requireRole(['seller', 'admin'])(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const { user } = authResult;
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 50);
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE sellerId = ?';
    let bindings = [user.id];

    if (status !== 'all') {
      whereClause += ' AND status = ?';
      bindings.push(status);
    }

    const pets = await env.PET_DB.prepare(`
      SELECT p.*, u.fullName as sellerName
      FROM pets p
      LEFT JOIN users u ON p.sellerId = u.id
      ${whereClause}
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all();

    const countResult = await env.PET_DB.prepare(`
      SELECT COUNT(*) as total FROM pets ${whereClause}
    `).bind(...bindings).first();

    return new Response(JSON.stringify({
      pets: pets.results.map(pet => ({
        ...pet,
        photos: JSON.parse(pet.photos || '[]'),
        personalityTraits: pet.personalityTraits ? pet.personalityTraits.split(',') : []
      })),
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Get seller pets error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch pets' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// ===== FAVORITES ENDPOINTS =====

// Add to favorites
router.post('/api/favorites', async (request, env) => {
  const authResult = await requireAuth(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const { user } = authResult;
    const { petId } = await request.json();

    if (!petId) {
      return new Response(JSON.stringify({ error: 'petId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Check if pet exists
    const pet = await env.PET_DB.prepare(`
      SELECT id FROM pets WHERE id = ? AND status = 'approved'
    `).bind(petId).first();

    if (!pet) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Check if already favorited
    const existing = await env.PET_DB.prepare(`
      SELECT id FROM favorites WHERE userId = ? AND petId = ?
    `).bind(user.id, petId).first();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Pet already in favorites' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Add to favorites
    const id = generateId();
    await env.PET_DB.prepare(`
      INSERT INTO favorites (id, userId, petId) VALUES (?, ?, ?)
    `).bind(id, user.id, petId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Added to favorites' 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Add favorite error:', error);
    return new Response(JSON.stringify({ error: 'Failed to add to favorites' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Remove from favorites
router.delete('/api/favorites/:petId', async (request, env) => {
  const authResult = await requireAuth(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const { user } = authResult;
    const petId = request.params.petId;

    await env.PET_DB.prepare(`
      DELETE FROM favorites WHERE userId = ? AND petId = ?
    `).bind(user.id, petId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Removed from favorites' 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Remove favorite error:', error);
    return new Response(JSON.stringify({ error: 'Failed to remove from favorites' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Get user favorites
router.get('/api/favorites', async (request, env) => {
  const authResult = await requireAuth(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const { user } = authResult;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 50);
    const offset = (page - 1) * limit;

    const favorites = await env.PET_DB.prepare(`
      SELECT p.*, u.fullName as sellerName, f.createdAt as favoritedAt
      FROM favorites f
      JOIN pets p ON f.petId = p.id
      LEFT JOIN users u ON p.sellerId = u.id
      WHERE f.userId = ? AND p.status = 'approved'
      ORDER BY f.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();

    const countResult = await env.PET_DB.prepare(`
      SELECT COUNT(*) as total 
      FROM favorites f
      JOIN pets p ON f.petId = p.id
      WHERE f.userId = ? AND p.status = 'approved'
    `).bind(user.id).first();

    return new Response(JSON.stringify({
      favorites: favorites.results.map(pet => ({
        ...pet,
        photos: JSON.parse(pet.photos || '[]'),
        personalityTraits: pet.personalityTraits ? pet.personalityTraits.split(',') : []
      })),
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch favorites' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// ===== CART & ORDERS ENDPOINTS =====

// Add to cart
router.post('/api/cart', async (request, env) => {
  const authResult = await requireAuth(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const { user } = authResult;
    const { petId, quantity = 1 } = await request.json();

    if (!petId) {
      return new Response(JSON.stringify({ error: 'petId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Check if pet exists and is available
    const pet = await env.PET_DB.prepare(`
      SELECT id, price FROM pets WHERE id = ? AND status = 'approved'
    `).bind(petId).first();

    if (!pet) {
      return new Response(JSON.stringify({ error: 'Pet not found or not available' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Get or create cart
    let cart = await env.PET_DB.prepare(`
      SELECT id FROM carts WHERE userId = ? AND status = 'active'
    `).bind(user.id).first();

    if (!cart) {
      const cartId = generateId();
      await env.PET_DB.prepare(`
        INSERT INTO carts (id, userId, status) VALUES (?, ?, 'active')
      `).bind(cartId, user.id).run();
      cart = { id: cartId };
    }

    // Check if item already in cart
    const existingItem = await env.PET_DB.prepare(`
      SELECT id, quantity FROM cart_items WHERE cartId = ? AND petId = ?
    `).bind(cart.id, petId).first();

    if (existingItem) {
      // Update quantity
      await env.PET_DB.prepare(`
        UPDATE cart_items SET quantity = quantity + ? WHERE id = ?
      `).bind(quantity.toString(), existingItem.id).run();
    } else {
      // Add new item
      const itemId = generateId();
      await env.PET_DB.prepare(`
        INSERT INTO cart_items (id, cartId, petId, quantity, price)
        VALUES (?, ?, ?, ?, ?)
      `).bind(itemId, cart.id, petId, quantity.toString(), pet.price.toString()).run();
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Added to cart' 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    return new Response(JSON.stringify({ error: 'Failed to add to cart' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Get cart
router.get('/api/cart', async (request, env) => {
  const authResult = await requireAuth(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const { user } = authResult;

    const cartItems = await env.PET_DB.prepare(`
      SELECT ci.*, p.title, p.photos, p.species, p.breed, u.fullName as sellerName
      FROM cart_items ci
      JOIN carts c ON ci.cartId = c.id
      JOIN pets p ON ci.petId = p.id
      LEFT JOIN users u ON p.sellerId = u.id
      WHERE c.userId = ? AND c.status = 'active' AND p.status = 'approved'
      ORDER BY ci.createdAt DESC
    `).bind(user.id).all();

    const items = cartItems.results.map(item => ({
      ...item,
      photos: JSON.parse(item.photos || '[]')
    }));

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return new Response(JSON.stringify({
      items,
      total,
      itemCount: items.length
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch cart' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// ===== CHAT/MESSAGING ENDPOINTS =====

// Send message
router.post('/api/messages', async (request, env) => {
  const authResult = await requireAuth(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const { user } = authResult;
    const { threadId, content, type = 'text' } = await request.json();

    if (!threadId || !content) {
      return new Response(JSON.stringify({ error: 'threadId and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Check if thread exists and user has access
    const thread = await env.PET_DB.prepare(`
      SELECT * FROM threads WHERE id = ? AND (participant1Id = ? OR participant2Id = ?)
    `).bind(threadId, user.id, user.id).first();

    if (!thread) {
      return new Response(JSON.stringify({ error: 'Thread not found or access denied' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Create message
    const messageId = generateId();
    await env.PET_DB.prepare(`
      INSERT INTO messages (id, threadId, senderId, content, type)
      VALUES (?, ?, ?, ?, ?)
    `).bind(messageId, threadId, user.id, content, type).run();

    // Update thread last activity
    await env.PET_DB.prepare(`
      UPDATE threads SET lastMessageAt = datetime('now') WHERE id = ?
    `).bind(threadId).run();

    return new Response(JSON.stringify({ 
      success: true,
      messageId,
      message: 'Message sent' 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Send message error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Get messages for a thread
router.get('/api/threads/:threadId/messages', async (request, env) => {
  const authResult = await requireAuth(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const { user } = authResult;
    const threadId = request.params.threadId;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
    const offset = (page - 1) * limit;

    // Check if user has access to thread
    const thread = await env.PET_DB.prepare(`
      SELECT * FROM threads WHERE id = ? AND (participant1Id = ? OR participant2Id = ?)
    `).bind(threadId, user.id, user.id).first();

    if (!thread) {
      return new Response(JSON.stringify({ error: 'Thread not found or access denied' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const messages = await env.PET_DB.prepare(`
      SELECT m.*, u.fullName as senderName, u.avatarUrl as senderAvatar
      FROM messages m
      LEFT JOIN users u ON m.senderId = u.id
      WHERE m.threadId = ?
      ORDER BY m.createdAt DESC
      LIMIT ? OFFSET ?
    `).bind(threadId, limit, offset).all();

    return new Response(JSON.stringify({
      messages: messages.results.reverse(), // Reverse for chronological order
      thread,
      pagination: {
        page,
        limit,
        hasMore: messages.results.length === limit
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// ===== ADMIN ENDPOINTS =====

// Get pending pets for approval
router.get('/api/admin/pets/pending', async (request, env) => {
  const authResult = await requireRole(['admin'])(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 50);
    const offset = (page - 1) * limit;

    const pets = await env.PET_DB.prepare(`
      SELECT p.*, u.fullName as sellerName, u.email as sellerEmail
      FROM pets p
      LEFT JOIN users u ON p.sellerId = u.id
      WHERE p.status = 'pending'
      ORDER BY p.createdAt ASC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const countResult = await env.PET_DB.prepare(`
      SELECT COUNT(*) as total FROM pets WHERE status = 'pending'
    `).first();

    return new Response(JSON.stringify({
      pets: pets.results.map(pet => ({
        ...pet,
        photos: JSON.parse(pet.photos || '[]'),
        personalityTraits: pet.personalityTraits ? pet.personalityTraits.split(',') : []
      })),
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Get pending pets error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch pending pets' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Approve/reject pet
router.put('/api/admin/pets/:id/status', async (request, env) => {
  const authResult = await requireRole(['admin'])(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const { user } = authResult;
    const petId = request.params.id;
    const { status, reason } = await request.json();

    if (!['approved', 'rejected'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Update pet status
    await env.PET_DB.prepare(`
      UPDATE pets SET status = ?, updatedAt = ? WHERE id = ?
    `).bind(status, new Date().toISOString(), petId).run();

    // Log audit
    await logAudit(env, user.id, 'MODERATE', 'pet', petId, { status, reason });

    return new Response(JSON.stringify({ 
      success: true,
      message: `Pet ${status} successfully` 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Update pet status error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update pet status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Get platform statistics
router.get('/api/admin/stats', async (request, env) => {
  const authResult = await requireRole(['admin'])(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify(authResult), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const stats = await Promise.all([
      env.PET_DB.prepare(`SELECT COUNT(*) as total FROM users`).first(),
      env.PET_DB.prepare(`SELECT COUNT(*) as total FROM pets WHERE status = 'approved'`).first(),
      env.PET_DB.prepare(`SELECT COUNT(*) as total FROM pets WHERE status = 'pending'`).first(),
      env.PET_DB.prepare(`SELECT COUNT(*) as total FROM orders WHERE status = 'completed'`).first(),
    ]);

    return new Response(JSON.stringify({
      totalUsers: stats[0].total,
      approvedPets: stats[1].total,
      pendingPets: stats[2].total,
      completedOrders: stats[3].total,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch statistics' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// 404 handler
router.all('*', () => {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
});

// Main handler
export default {
  async fetch(request, env, ctx) {
    try {
      // Handle CORS preflight requests immediately
      if (request.method === 'OPTIONS') {
        const dynamicCorsHeaders = setCorsHeaders(request, env);
        return new Response(null, {
          status: 200,
          headers: {
            ...dynamicCorsHeaders,
            'Content-Length': '0'
          }
        });
      }

      // Handle CORS for all requests
      const dynamicCorsHeaders = setCorsHeaders(request, env);
      
      // Override global corsHeaders with dynamic ones
      Object.assign(corsHeaders, dynamicCorsHeaders);

      // Rate limiting
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const rateLimitResult = await rateLimit(env, `rate_limit_${ip}`, 1000, 3600); // 1000 requests per hour
      
      if (rateLimitResult.error) {
        return new Response(JSON.stringify(rateLimitResult), {
          status: rateLimitResult.status,
          headers: { 'Content-Type': 'application/json', ...dynamicCorsHeaders }
        });
      }

      return router.handle(request, env, ctx);
    } catch (error) {
      console.error('Worker error:', error);
      const dynamicCorsHeaders = setCorsHeaders(request, env);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...dynamicCorsHeaders }
      });
    }
  }
};