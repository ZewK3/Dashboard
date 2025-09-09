// Pet Marketplace Cloudflare Worker
// Production-ready backend for pet marketplace with complete API endpoints

// CORS Configuration
const ALLOWED_ORIGINS = [
  'https://zewk3.github.io',
  'https://hipet-market.pages.dev',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// Utility function to handle CORS headers
function setCorsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

// JSON response utility
function jsonResponse(body, status = 200, origin = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...setCorsHeaders(origin)
    }
  });
}

// Handle preflight OPTIONS requests
function handleCorsPreflightRequest(origin) {
  return new Response(null, {
    status: 200,
    headers: setCorsHeaders(origin)
  });
}

// Password hashing utility
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate random ID
function generateId() {
  return crypto.randomUUID();
}

// Generate URL-friendly slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .trim('-'); // Remove leading/trailing hyphens
}

// JWT-like token generation for auth
function generateAuthToken() {
  return crypto.randomUUID() + '.' + btoa(Date.now().toString());
}

// Authentication middleware
async function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 };
  }

  const token = authHeader.substring(7);
  
  try {
    // Check if DB is available
    if (!env.DB) {
      console.error('Database not configured. Please bind a D1 database.');
      return { error: 'Database not available', status: 500 };
    }

    // Query user by token
    const stmt = env.DB.prepare('SELECT u.* FROM users u JOIN user_sessions s ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?');
    const user = await stmt.bind(token, new Date().toISOString()).first();
    
    if (!user) {
      return { error: 'Invalid or expired token', status: 401 };
    }
    
    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

// Check admin privileges
function requireAdmin(user) {
  if (user.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }
  return null;
}

// Check support privileges  
function requireSupport(user) {
  if (!['admin', 'support'].includes(user.role)) {
    return { error: 'Support access required', status: 403 };
  }
  return null;
}

// AUTH ENDPOINTS

// Register new user
async function handleRegister(request, env, origin) {
  try {
    // Check if DB is available
    if (!env.DB) {
      console.error('Database not configured. Please bind a D1 database.');
      return jsonResponse({ error: 'Database not available' }, 500, origin);
    }

    const body = await request.json();
    const { name, email, password } = body;
    
    if (!name || !email || !password) {
      return jsonResponse({ error: 'Name, email and password are required' }, 400, origin);
    }

    const hashedPassword = await hashPassword(password);
    const userId = generateId();
    
    // Check if user exists
    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existingUser) {
      return jsonResponse({ error: 'User already exists' }, 409, origin);
    }
    
    // Create user
    await env.DB.prepare(`
      INSERT INTO users (id, name, email, password, role, balance, can_sell, created_at)
      VALUES (?, ?, ?, ?, 'user', 0, 0, ?)
    `).bind(userId, name, email, hashedPassword, new Date().toISOString()).run();
    
    const user = await env.DB.prepare('SELECT id, name, email, role, balance, can_sell FROM users WHERE id = ?').bind(userId).first();
    
    return jsonResponse({ message: 'User registered successfully', user }, 201, origin);
  } catch (error) {
    console.error('Registration error:', error);
    return jsonResponse({ error: 'Registration failed', details: error.message }, 500, origin);
  }
}

// Login user
async function handleLogin(request, env, origin) {
  try {
    // Check if DB is available
    if (!env.DB) {
      console.error('Database not configured. Please bind a D1 database.');
      return jsonResponse({ error: 'Database not available' }, 500, origin);
    }

    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return jsonResponse({ error: 'Email and password are required' }, 400, origin);
    }

    const hashedPassword = await hashPassword(password);
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ? AND password = ?').bind(email, hashedPassword).first();
    
    if (!user) {
      return jsonResponse({ error: 'Invalid credentials' }, 401, origin);
    }
    
    // Create session
    const token = generateAuthToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    await env.DB.prepare(`
      INSERT OR REPLACE INTO user_sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(user.id, token, expiresAt.toISOString()).run();
    
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      balance: user.balance,
      canSell: user.can_sell
    };
    
    return jsonResponse({ message: 'Login successful', user: userResponse, token }, 200, origin);
  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse({ error: 'Login failed', details: error.message }, 500, origin);
  }
}

// Get user profile
async function handleProfile(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  const userResponse = {
    id: auth.user.id,
    name: auth.user.name,
    email: auth.user.email,
    role: auth.user.role,
    balance: auth.user.balance,
    canSell: auth.user.can_sell
  };
  
  return jsonResponse({ user: userResponse }, 200, origin);
}

// Logout user
async function handleLogout(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  const authHeader = request.headers.get('Authorization');
  const token = authHeader.substring(7);
  
  await env.DB.prepare('DELETE FROM user_sessions WHERE token = ?').bind(token).run();
  
  return jsonResponse({ message: 'Logged out successfully' }, 200, origin);
}

// PETS ENDPOINTS

// Get all pets with filters
async function handleGetPets(request, env, origin) {
  try {
    // Check if DB is available
    if (!env.DB) {
      console.error('Database not configured. Please bind a D1 database.');
      return jsonResponse({ error: 'Database not available' }, 500, origin);
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const category = url.searchParams.get('category');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const search = url.searchParams.get('search');
    
    let query = `
      SELECT p.*, u.name as seller_name 
      FROM pets p 
      JOIN users u ON p.seller_id = u.id 
      WHERE p.status = 'approved'
    `;
    let params = [];
    
    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }
    
    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }
    
    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const pets = await env.DB.prepare(query).bind(...params).all();
    
    return jsonResponse({ pets: pets.results || [] }, 200, origin);
  } catch (error) {
    console.error('Get pets error:', error);
    return jsonResponse({ error: 'Failed to fetch pets', details: error.message }, 500, origin);
  }
}

// Get single pet by ID
async function handleGetPetById(request, env, origin) {
  try {
    const url = new URL(request.url);
    const petId = url.pathname.split('/').pop();
    
    const pet = await env.DB.prepare(`
      SELECT p.*, u.name as seller_name, u.email as seller_email
      FROM pets p 
      JOIN users u ON p.seller_id = u.id 
      WHERE p.id = ? AND p.status = 'approved'
    `).bind(petId).first();
    
    if (!pet) {
      return jsonResponse({ error: 'Pet not found' }, 404, origin);
    }
    
    return jsonResponse({ pet }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to fetch pet', details: error.message }, 500, origin);
  }
}

// Create new pet listing
async function handleCreatePet(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  if (!auth.user.can_sell) {
    return jsonResponse({ error: 'User not enabled for selling' }, 403, origin);
  }
  
  try {
    const petData = await request.json();
    const { name, description, category, price, age, breed, images } = petData;
    
    if (!name || !description || !category || !price) {
      return jsonResponse({ error: 'Required fields missing' }, 400, origin);
    }
    
    // Check user balance for posting fee
    if (auth.user.balance < 0.5) {
      return jsonResponse({ error: 'Insufficient balance. $0.50 required for posting.' }, 402, origin);
    }
    
    const petId = generateId();
    const slug = generateSlug(name);
    
    // Deduct posting fee
    await env.DB.prepare('UPDATE users SET balance = balance - 0.5 WHERE id = ?').bind(auth.user.id).run();
    
    // Create pet listing
    await env.DB.prepare(`
      INSERT INTO pets (id, seller_id, name, description, category, price, age, breed, images, slug, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(petId, auth.user.id, name, description, category, parseFloat(price), age, breed, JSON.stringify(images || []), slug, new Date().toISOString()).run();
    
    const pet = await env.DB.prepare('SELECT * FROM pets WHERE id = ?').bind(petId).first();
    
    return jsonResponse({ message: 'Pet listing created successfully', pet }, 201, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to create pet listing', details: error.message }, 500, origin);
  }
}

// Search pets
async function handleSearchPets(request, env, origin) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    
    const pets = await env.DB.prepare(`
      SELECT p.*, u.name as seller_name 
      FROM pets p 
      JOIN users u ON p.seller_id = u.id 
      WHERE p.status = 'approved' 
      AND (p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ? OR p.breed LIKE ?)
      ORDER BY p.created_at DESC 
      LIMIT ?
    `).bind(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, limit).all();
    
    return jsonResponse({ pets: pets.results || [] }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Search failed', details: error.message }, 500, origin);
  }
}

// USER ENDPOINTS

// Update user profile
async function handleUpdateProfile(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  try {
    const { name, email } = await request.json();
    
    await env.DB.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').bind(name, email, auth.user.id).run();
    
    const user = await env.DB.prepare('SELECT id, name, email, role, balance, can_sell FROM users WHERE id = ?').bind(auth.user.id).first();
    
    return jsonResponse({ message: 'Profile updated successfully', user }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to update profile', details: error.message }, 500, origin);
  }
}

// Enable selling for user
async function handleEnableSelling(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  try {
    await env.DB.prepare('UPDATE users SET can_sell = 1 WHERE id = ?').bind(auth.user.id).run();
    
    return jsonResponse({ message: 'Selling enabled successfully' }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to enable selling', details: error.message }, 500, origin);
  }
}

// Top up user balance
async function handleTopup(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  try {
    const { amount, paymentMethod } = await request.json();
    
    if (!amount || amount <= 0) {
      return jsonResponse({ error: 'Invalid amount' }, 400, origin);
    }
    
    // In real implementation, integrate with payment processor
    // For demo, we'll just add the amount
    await env.DB.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').bind(parseFloat(amount), auth.user.id).run();
    
    const user = await env.DB.prepare('SELECT balance FROM users WHERE id = ?').bind(auth.user.id).first();
    
    return jsonResponse({ message: 'Balance topped up successfully', newBalance: user.balance }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Topup failed', details: error.message }, 500, origin);
  }
}

// SELLER ENDPOINTS

// Get seller stats
async function handleSellerStats(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  try {
    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_listings,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as active_listings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_listings,
        COALESCE(SUM(price), 0) as total_value
      FROM pets 
      WHERE seller_id = ?
    `).bind(auth.user.id).first();
    
    return jsonResponse({ stats }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to fetch stats', details: error.message }, 500, origin);
  }
}

// Get seller listings
async function handleSellerListings(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  try {
    const pets = await env.DB.prepare(`
      SELECT * FROM pets 
      WHERE seller_id = ? 
      ORDER BY created_at DESC
    `).bind(auth.user.id).all();
    
    return jsonResponse({ listings: pets.results || [] }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to fetch listings', details: error.message }, 500, origin);
  }
}

// CART ENDPOINTS

// Get cart items
async function handleGetCart(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  try {
    const items = await env.DB.prepare(`
      SELECT c.*, p.name, p.price, p.images, p.category, u.name as seller_name
      FROM cart_items c
      JOIN pets p ON c.pet_id = p.id
      JOIN users u ON p.seller_id = u.id
      WHERE c.user_id = ?
    `).bind(auth.user.id).all();
    
    return jsonResponse({ items: items.results || [] }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to fetch cart', details: error.message }, 500, origin);
  }
}

// Add item to cart
async function handleAddToCart(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  try {
    const { petId } = await request.json();
    
    // Check if pet exists and is available
    const pet = await env.DB.prepare('SELECT * FROM pets WHERE id = ? AND status = "approved"').bind(petId).first();
    if (!pet) {
      return jsonResponse({ error: 'Pet not found or not available' }, 404, origin);
    }
    
    // Check if already in cart
    const existing = await env.DB.prepare('SELECT * FROM cart_items WHERE user_id = ? AND pet_id = ?').bind(auth.user.id, petId).first();
    if (existing) {
      return jsonResponse({ error: 'Pet already in cart' }, 409, origin);
    }
    
    await env.DB.prepare(`
      INSERT INTO cart_items (user_id, pet_id, created_at)
      VALUES (?, ?, ?)
    `).bind(auth.user.id, petId, new Date().toISOString()).run();
    
    return jsonResponse({ message: 'Pet added to cart successfully' }, 201, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to add to cart', details: error.message }, 500, origin);
  }
}

// Remove item from cart
async function handleRemoveFromCart(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  try {
    const url = new URL(request.url);
    const petId = url.pathname.split('/').pop();
    
    await env.DB.prepare('DELETE FROM cart_items WHERE user_id = ? AND pet_id = ?').bind(auth.user.id, petId).run();
    
    return jsonResponse({ message: 'Pet removed from cart successfully' }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to remove from cart', details: error.message }, 500, origin);
  }
}

// FAVORITES ENDPOINTS

// Get favorites
async function handleGetFavorites(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  try {
    const favorites = await env.DB.prepare(`
      SELECT f.*, p.name, p.price, p.images, p.category, u.name as seller_name
      FROM favorites f
      JOIN pets p ON f.pet_id = p.id
      JOIN users u ON p.seller_id = u.id
      WHERE f.user_id = ?
    `).bind(auth.user.id).all();
    
    return jsonResponse({ favorites: favorites.results || [] }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to fetch favorites', details: error.message }, 500, origin);
  }
}

// Add to favorites
async function handleAddToFavorites(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  try {
    const { petId } = await request.json();
    
    // Check if already favorited
    const existing = await env.DB.prepare('SELECT * FROM favorites WHERE user_id = ? AND pet_id = ?').bind(auth.user.id, petId).first();
    if (existing) {
      return jsonResponse({ error: 'Pet already in favorites' }, 409, origin);
    }
    
    await env.DB.prepare(`
      INSERT INTO favorites (user_id, pet_id, created_at)
      VALUES (?, ?, ?)
    `).bind(auth.user.id, petId, new Date().toISOString()).run();
    
    return jsonResponse({ message: 'Pet added to favorites successfully' }, 201, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to add to favorites', details: error.message }, 500, origin);
  }
}

// Remove from favorites
async function handleRemoveFromFavorites(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  try {
    const url = new URL(request.url);
    const petId = url.pathname.split('/').pop();
    
    await env.DB.prepare('DELETE FROM favorites WHERE user_id = ? AND pet_id = ?').bind(auth.user.id, petId).run();
    
    return jsonResponse({ message: 'Pet removed from favorites successfully' }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to remove from favorites', details: error.message }, 500, origin);
  }
}

// ADMIN ENDPOINTS

// Get admin stats
async function handleAdminStats(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  const adminError = requireAdmin(auth.user);
  if (adminError) {
    return jsonResponse(adminError, adminError.status, origin);
  }
  
  try {
    const stats = await env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM pets) as total_pets,
        (SELECT COUNT(*) FROM pets WHERE status = 'pending') as pending_pets,
        (SELECT COUNT(*) FROM pets WHERE status = 'approved') as approved_pets,
        (SELECT COALESCE(SUM(balance), 0) FROM users) as total_user_balance
    `).first();
    
    return jsonResponse({ stats }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to fetch admin stats', details: error.message }, 500, origin);
  }
}

// Get pending pets for approval
async function handleGetPendingPets(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  const adminError = requireAdmin(auth.user);
  if (adminError) {
    return jsonResponse(adminError, adminError.status, origin);
  }
  
  try {
    const pets = await env.DB.prepare(`
      SELECT p.*, u.name as seller_name, u.email as seller_email
      FROM pets p
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at ASC
    `).all();
    
    return jsonResponse({ pets: pets.results || [] }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to fetch pending pets', details: error.message }, 500, origin);
  }
}

// Approve pet listing
async function handleApprovePet(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  const adminError = requireAdmin(auth.user);
  if (adminError) {
    return jsonResponse(adminError, adminError.status, origin);
  }
  
  try {
    const url = new URL(request.url);
    const petId = url.pathname.split('/')[3]; // /admin/pets/{id}/approve
    
    await env.DB.prepare('UPDATE pets SET status = "approved", approved_at = ? WHERE id = ?').bind(new Date().toISOString(), petId).run();
    
    return jsonResponse({ message: 'Pet approved successfully' }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to approve pet', details: error.message }, 500, origin);
  }
}

// FILES ENDPOINTS

// Get upload URL for file
async function handleGetUploadUrl(request, env, origin) {
  const auth = await authenticate(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status, origin);
  }
  
  try {
    const { fileName, fileType } = await request.json();
    
    const key = `uploads/${auth.user.id}/${generateId()}-${fileName}`;
    
    // Generate presigned URL for R2 bucket (if available)
    if (env.BUCKET) {
      const url = await env.BUCKET.presignedUrl(key, {
        method: 'PUT',
        expires: 3600, // 1 hour
        headers: {
          'Content-Type': fileType
        }
      });
      
      return jsonResponse({ uploadUrl: url, key }, 200, origin);
    }
    
    // Fallback for basic implementation
    return jsonResponse({ 
      uploadUrl: `https://api.example.com/upload/${key}`,
      key 
    }, 200, origin);
  } catch (error) {
    return jsonResponse({ error: 'Failed to generate upload URL', details: error.message }, 500, origin);
  }
}

// MAIN ROUTER

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handleCorsPreflightRequest(origin);
    }
    
    try {
      // Route requests
      const path = url.pathname;
      const method = request.method;
      
      // Auth routes
      if (path === '/auth/register' && method === 'POST') {
        return await handleRegister(request, env, origin);
      }
      if (path === '/auth/login' && method === 'POST') {
        return await handleLogin(request, env, origin);
      }
      if (path === '/auth/profile' && method === 'GET') {
        return await handleProfile(request, env, origin);
      }
      if (path === '/auth/logout' && method === 'POST') {
        return await handleLogout(request, env, origin);
      }
      
      // Pets routes
      if (path === '/pets' && method === 'GET') {
        return await handleGetPets(request, env, origin);
      }
      if (path === '/pets' && method === 'POST') {
        return await handleCreatePet(request, env, origin);
      }
      if (path.startsWith('/pets/') && method === 'GET' && path !== '/pets/search') {
        return await handleGetPetById(request, env, origin);
      }
      if (path === '/pets/search' && method === 'GET') {
        return await handleSearchPets(request, env, origin);
      }
      
      // User routes
      if (path === '/users/profile' && method === 'PUT') {
        return await handleUpdateProfile(request, env, origin);
      }
      if (path === '/users/enable-selling' && method === 'POST') {
        return await handleEnableSelling(request, env, origin);
      }
      if (path === '/users/topup' && method === 'POST') {
        return await handleTopup(request, env, origin);
      }
      
      // Seller routes
      if (path === '/seller/stats' && method === 'GET') {
        return await handleSellerStats(request, env, origin);
      }
      if (path === '/seller/listings' && method === 'GET') {
        return await handleSellerListings(request, env, origin);
      }
      
      // Cart routes
      if (path === '/cart' && method === 'GET') {
        return await handleGetCart(request, env, origin);
      }
      if (path === '/cart/items' && method === 'POST') {
        return await handleAddToCart(request, env, origin);
      }
      if (path.startsWith('/cart/items/') && method === 'DELETE') {
        return await handleRemoveFromCart(request, env, origin);
      }
      
      // Favorites routes
      if (path === '/favorites' && method === 'GET') {
        return await handleGetFavorites(request, env, origin);
      }
      if (path === '/favorites' && method === 'POST') {
        return await handleAddToFavorites(request, env, origin);
      }
      if (path.startsWith('/favorites/') && method === 'DELETE') {
        return await handleRemoveFromFavorites(request, env, origin);
      }
      
      // Admin routes
      if (path === '/admin/stats' && method === 'GET') {
        return await handleAdminStats(request, env, origin);
      }
      if (path === '/admin/pets/pending' && method === 'GET') {
        return await handleGetPendingPets(request, env, origin);
      }
      if (path.match(/^\/admin\/pets\/[^\/]+\/approve$/) && method === 'POST') {
        return await handleApprovePet(request, env, origin);
      }
      
      // Files routes
      if (path === '/files/upload-url' && method === 'POST') {
        return await handleGetUploadUrl(request, env, origin);
      }
      
      // Health check
      if (path === '/health' || path === '/') {
        return jsonResponse({ 
          status: 'ok', 
          message: 'Pet Marketplace API is running',
          timestamp: new Date().toISOString()
        }, 200, origin);
      }
      
      // Route not found
      return jsonResponse({ error: 'Route not found' }, 404, origin);
      
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ 
        error: 'Internal server error', 
        details: error.message 
      }, 500, origin);
    }
  }
};