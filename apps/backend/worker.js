/**
 * Pet Marketplace Cloudflare Worker API
 * Full-stack backend with D1, R2, KV, JWT authentication, RBAC, and comprehensive endpoints
 */

import { Router } from 'itty-router';

// Router instance
const router = Router();

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Will be replaced with env.ALLOWED_ORIGIN in production
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
  'Access-Control-Allow-Credentials': 'true',
};

// Utility functions
const generateId = () => {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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
    SELECT id, fullName, email, phone, role, status, avatarUrl
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

// CORS preflight handler
router.options('*', () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
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
    const { fullName, email, phone, password, role = 'buyer' } = await request.json();
    
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

    // Create user
    await env.PET_DB.prepare(`
      INSERT INTO users (id, fullName, email, phone, passwordHash, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, fullName, email, phone || null, passwordHash, role, 'active').run();

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
      SELECT id, fullName, email, phone, role, status, avatarUrl, createdAt
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
      SELECT id, fullName, email, phone, passwordHash, role, status, avatarUrl, createdAt
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
      params.push(priceMin);
    }

    if (priceMax < 999999999) {
      whereConditions.push('price <= ?');
      params.push(priceMax);
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
      // Set CORS origin from environment
      corsHeaders['Access-Control-Allow-Origin'] = env.ALLOWED_ORIGIN || '*';

      // Rate limiting
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const rateLimitResult = await rateLimit(env, `rate_limit_${ip}`, 1000, 3600); // 1000 requests per hour
      
      if (rateLimitResult.error) {
        return new Response(JSON.stringify(rateLimitResult), {
          status: rateLimitResult.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return router.handle(request, env, ctx);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};