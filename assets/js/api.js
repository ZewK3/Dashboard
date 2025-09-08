/**
 * API Helper Module for Pet Marketplace
 * Handles all HTTP requests to the Cloudflare Workers backend
 */

import { storage, sessionStorage } from './utils.js';

// Configuration
const CONFIG = {
  BASE_URL: 'http://localhost:8787', // Development URL - change for production
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  USE_DEMO_MODE: true // Enable demo mode with mock data
};

// Demo data for testing
const DEMO_DATA = {
  users: [
    {
      id: 1,
      email: 'user1@demo.com',
      fullName: 'Nguyễn Văn Hùng',
      role: 'user',
      canSell: 0,
      balance: 10000, // $100.00 in cents
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      phone: '0123456789',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      email: 'user2@demo.com', 
      fullName: 'Trần Thị Linh',
      role: 'user',
      canSell: 1,
      balance: 5000, // $50.00 in cents
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      phone: '0987654321',
      address: '456 Lê Lợi, Quận Hai Bà Trưng, Hà Nội',
      shopName: 'Cửa hàng thú cưng yêu thương',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 3,
      email: 'admin@demo.com',
      fullName: 'Lê Văn Quản',
      role: 'admin',
      canSell: 1,
      balance: 15000, // $150.00 in cents
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      phone: '0111222333',
      address: 'Văn phòng PetMarket',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 4,
      email: 'support@demo.com',
      fullName: 'Phạm Thị Hỗ Trợ',
      role: 'support',
      canSell: 0,
      balance: 2500, // $25.00 in cents
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      phone: '0999888777',
      address: 'Phòng CSKH PetMarket',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 5,
      email: 'user3@demo.com',
      fullName: 'Hoàng Minh Tuấn',
      role: 'user',
      canSell: 1,
      balance: 8000, // $80.00 in cents
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      phone: '0345678901',
      address: '789 Võ Văn Tần, Quận 3, TP.HCM',
      shopName: 'Pet Kingdom',
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: 6,
      email: 'user4@demo.com',
      fullName: 'Vũ Thị Lan',
      role: 'user',
      canSell: 0,
      balance: 12000, // $120.00 in cents
      avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
      phone: '0567890123',
      address: '321 Cách Mạng Tháng 8, Quận 10, TP.HCM',
      createdAt: '2024-02-01T00:00:00Z'
    }
  ],
  pets: [
    {
      id: 1,
      slug: 'cho-golden-retriever-dep-trai',
      title: 'Chó Golden Retriever đẹp trai',
      description: 'Chú Golden Retriever 2 tuổi, rất thông minh và ngoan ngoãn. Đã tiêm phòng đầy đủ, có giấy tờ rõ ràng.',
      price: 15000000,
      species: 'dog',
      breed: 'Golden Retriever',
      age: 24,
      gender: 'male',
      location: 'Hồ Chí Minh',
      images: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&h=400&fit=crop'],
      sellerId: 2,
      status: 'available',
      featured: true,
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: 2,
      slug: 'meo-persian-trang-xinh',
      title: 'Mèo Persian trắng xinh xắn',
      description: 'Mèo Persian trắng muốt, lông dài mượt mà. Rất hiền lành và thân thiện với trẻ em.',
      price: 8000000,
      species: 'cat', 
      breed: 'Persian',
      age: 18,
      gender: 'female',
      location: 'Hà Nội',
      images: ['https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=400&fit=crop'],
      sellerId: 2,
      status: 'available',
      featured: true,
      createdAt: '2024-01-20T00:00:00Z'
    },
    {
      id: 3,
      slug: 'cho-husky-siberian-dep',
      title: 'Chó Husky Siberian năng động',
      description: 'Husky Siberian 1.5 tuổi, rất năng động và thông minh. Thích hợp cho gia đình yêu thể thao.',
      price: 12000000,
      species: 'dog',
      breed: 'Siberian Husky',
      age: 18,
      gender: 'male',
      location: 'Đà Nẵng',
      images: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop'],
      sellerId: 5,
      status: 'available',
      featured: true,
      createdAt: '2024-01-25T00:00:00Z'
    },
    {
      id: 4,
      slug: 'meo-anh-long-ngan-dang-yeu',
      title: 'Mèo Anh lông ngắn đáng yêu',
      description: 'Mèo Anh lông ngắn màu xám xanh, rất dễ thương và dễ chăm sóc. Đã được thiến.',
      price: 5000000,
      species: 'cat',
      breed: 'British Shorthair',
      age: 12,
      gender: 'male',
      location: 'Hồ Chí Minh',
      images: ['https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=600&h=400&fit=crop'],
      sellerId: 2,
      status: 'available',
      featured: true,
      createdAt: '2024-02-01T00:00:00Z'
    },
    {
      id: 5,
      slug: 'cho-poodle-thong-minh',
      title: 'Chó Poodle thông minh',
      description: 'Poodle toy màu trắng, rất thông minh và không rụng lông. Thích hợp cho người bị dị ứng.',
      price: 7000000,
      species: 'dog',
      breed: 'Poodle',
      age: 15,
      gender: 'female',
      location: 'Hà Nội',
      images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop'],
      sellerId: 5,
      status: 'available',
      featured: true,
      createdAt: '2024-02-05T00:00:00Z'
    },
    {
      id: 6,
      slug: 'cho-corgi-chan-ngan',
      title: 'Chó Corgi chân ngắn đáng yêu',
      description: 'Corgi Pembroke 8 tháng tuổi, chân ngắn đáng yêu, rất thân thiện và vui vẻ.',
      price: 18000000,
      species: 'dog',
      breed: 'Corgi',
      age: 8,
      gender: 'female',
      location: 'TP.HCM',
      images: ['https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=600&h=400&fit=crop'],
      sellerId: 2,
      status: 'available',
      createdAt: '2024-02-10T00:00:00Z'
    },
    {
      id: 7,
      slug: 'meo-maine-coon-khong-lo',
      title: 'Mèo Maine Coon khổng lồ',
      description: 'Maine Coon 3 tuổi, giống mèo lớn nhất thế giới. Rất hiền lành và thân thiện.',
      price: 20000000,
      species: 'cat',
      breed: 'Maine Coon',
      age: 36,
      gender: 'male',
      location: 'Hà Nội',
      images: ['https://images.unsplash.com/photo-1559235038-1b0faafa5d2b?w=600&h=400&fit=crop'],
      sellerId: 5,
      status: 'available',
      createdAt: '2024-02-15T00:00:00Z'
    },
    {
      id: 8,
      slug: 'cho-beagle-nang-dong',
      title: 'Chó Beagle năng động',
      description: 'Beagle 1 tuổi, rất năng động và thích khám phá. Giống chó săn thông minh.',
      price: 9000000,
      species: 'dog',
      breed: 'Beagle',
      age: 12,
      gender: 'male',
      location: 'Đà Nẵng',
      images: ['https://images.unsplash.com/photo-1551717743-49959800b1f6?w=600&h=400&fit=crop'],
      sellerId: 2,
      status: 'sold',
      createdAt: '2024-02-20T00:00:00Z'
    }
  ],
  currentUser: null,
  authToken: null
};

// Mock API delay to simulate network
const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
const mockAPI = {
  // Auth endpoints
  auth: {
    register: async (userData) => {
      await mockDelay();
      const newUser = {
        id: DEMO_DATA.users.length + 1,
        ...userData,
        role: 'user',
        canSell: 0,
        balance: 1000, // $10.00 starting balance
        avatar: null,
        createdAt: new Date().toISOString()
      };
      DEMO_DATA.users.push(newUser);
      const token = `demo_token_${newUser.id}`;
      DEMO_DATA.authToken = token;
      DEMO_DATA.currentUser = newUser;
      return { success: true, user: newUser, token };
    },
    
    login: async (credentials) => {
      await mockDelay();
      const user = DEMO_DATA.users.find(u => u.email === credentials.email);
      if (!user) {
        throw new Error('Email hoặc mật khẩu không đúng');
      }
      const token = `demo_token_${user.id}`;
      DEMO_DATA.authToken = token;
      DEMO_DATA.currentUser = user;
      return { success: true, user, token };
    },
    
    logout: async () => {
      await mockDelay(200);
      DEMO_DATA.authToken = null;
      DEMO_DATA.currentUser = null;
      return { success: true };
    },
    
    me: async () => {
      await mockDelay(300);
      if (!DEMO_DATA.authToken || !DEMO_DATA.currentUser) {
        throw new Error('Chưa đăng nhập');
      }
      return { success: true, user: DEMO_DATA.currentUser };
    }
  },
  
  // Pets endpoints
  pets: {
    getPets: async (filters = {}) => {
      await mockDelay();
      let pets = [...DEMO_DATA.pets];
      
      if (filters.species) {
        pets = pets.filter(p => p.species === filters.species);
      }
      if (filters.search) {
        pets = pets.filter(p => 
          p.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          p.description.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      return {
        success: true,
        pets,
        total: pets.length,
        page: 1,
        limit: 20
      };
    },
    
    getPet: async (slug) => {
      await mockDelay();
      const pet = DEMO_DATA.pets.find(p => p.slug === slug);
      if (!pet) {
        throw new Error('Không tìm thấy thú cưng');
      }
      return { success: true, pet };
    },
    
    createPet: async (petData) => {
      await mockDelay(800);
      if (!DEMO_DATA.currentUser || !DEMO_DATA.currentUser.canSell) {
        throw new Error('Bạn cần đăng ký trở thành người bán để có thể đăng tin');
      }
      const newPet = {
        id: DEMO_DATA.pets.length + 1,
        slug: petData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        ...petData,
        sellerId: DEMO_DATA.currentUser.id,
        status: 'available',
        createdAt: new Date().toISOString()
      };
      DEMO_DATA.pets.push(newPet);
      return { success: true, pet: newPet };
    }
  }
};

// Request interceptors
const requestInterceptors = [];
const responseInterceptors = [];

// Add request interceptor
export const addRequestInterceptor = (interceptor) => {
  requestInterceptors.push(interceptor);
};

// Add response interceptor
export const addResponseInterceptor = (interceptor) => {
  responseInterceptors.push(interceptor);
};

// Get auth token from storage
const getAuthToken = () => {
  return storage.get('auth_token') || sessionStorage.get('auth_token');
};

// Set auth token
export const setAuthToken = (token) => {
  storage.set('auth_token', token);
  sessionStorage.set('auth_token', token);
};

// Remove auth token
export const removeAuthToken = () => {
  storage.remove('auth_token');
  sessionStorage.remove('auth_token');
};

// Get CSRF token
const getCsrfToken = () => {
  return storage.get('csrf_token') || sessionStorage.get('csrf_token');
};

// Set CSRF token
export const setCsrfToken = (token) => {
  storage.set('csrf_token', token);
  sessionStorage.set('csrf_token', token);
};

// Create request headers
const createHeaders = (additionalHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Auth-Token'] = token;
  }

  // Add CSRF token if available
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
};

// Request wrapper with timeout and retry logic
const makeRequest = async (url, options = {}, retryCount = 0) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    // Apply request interceptors
    let processedOptions = { ...options };
    for (const interceptor of requestInterceptors) {
      processedOptions = await interceptor(processedOptions);
    }

    const response = await fetch(url, {
      ...processedOptions,
      signal: controller.signal,
      headers: createHeaders(processedOptions.headers)
    });

    clearTimeout(timeoutId);

    // Apply response interceptors
    let processedResponse = response;
    for (const interceptor of responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }

    return processedResponse;

  } catch (error) {
    clearTimeout(timeoutId);

    // Retry on network errors
    if (retryCount < CONFIG.MAX_RETRIES && 
        (error.name === 'AbortError' || error.name === 'TypeError')) {
      
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (retryCount + 1)));
      return makeRequest(url, options, retryCount + 1);
    }

    throw error;
  }
};

// Parse response
const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } else {
    if (!response.ok) {
      const text = await response.text();
      const error = new Error(text || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    
    return response;
  }
};

// Base API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${CONFIG.BASE_URL}${endpoint}`;
  
  try {
    const response = await makeRequest(url, options);
    return await parseResponse(response);
  } catch (error) {
    console.error(`API Request failed: ${endpoint}`, error);
    
    // Handle auth errors
    if (error.status === 401) {
      removeAuthToken();
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    
    throw error;
  }
};

// HTTP methods
export const api = {
  // GET request
  get: async (endpoint, params = {}) => {
    const url = new URL(endpoint, CONFIG.BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.append(key, value);
      }
    });
    
    return apiRequest(url.pathname + url.search);
  },

  // POST request
  post: async (endpoint, data = {}) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // PUT request
  put: async (endpoint, data = {}) => {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // PATCH request
  patch: async (endpoint, data = {}) => {
    return apiRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // DELETE request
  delete: async (endpoint) => {
    return apiRequest(endpoint, {
      method: 'DELETE'
    });
  },

  // Upload file
  upload: async (endpoint, file, additionalData = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return apiRequest(endpoint, {
      method: 'POST',
      body: formData,
      headers: {} // Don't set Content-Type for FormData
    });
  }
};

// Auth API endpoints
export const authAPI = {
  // Register new user
  register: async (userData) => {
    if (CONFIG.USE_DEMO_MODE) {
      return mockAPI.auth.register(userData);
    }
    
    const response = await api.post('/api/auth/register', userData);
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  // Login user
  login: async (credentials) => {
    if (CONFIG.USE_DEMO_MODE) {
      return mockAPI.auth.login(credentials);
    }
    
    const response = await api.post('/api/auth/login', credentials);
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  // Logout user
  logout: async () => {
    if (CONFIG.USE_DEMO_MODE) {
      return mockAPI.auth.logout();
    }
    
    try {
      await api.post('/api/auth/logout');
    } finally {
      removeAuthToken();
    }
  },

  // Get current user
  me: async () => {
    if (CONFIG.USE_DEMO_MODE) {
      return mockAPI.auth.me();
    }
    
    return api.get('/api/auth/me');
  },

  // Update profile
  updateProfile: async (profileData) => {
    if (CONFIG.USE_DEMO_MODE) {
      await mockDelay();
      DEMO_DATA.currentUser = { ...DEMO_DATA.currentUser, ...profileData };
      return { success: true, user: DEMO_DATA.currentUser };
    }
    
    return api.put('/api/auth/profile', profileData);
  },

  // Change password
  changePassword: async (passwordData) => {
    if (CONFIG.USE_DEMO_MODE) {
      await mockDelay();
      return { success: true, message: 'Mật khẩu đã được thay đổi' };
    }
    
    return api.put('/api/auth/password', passwordData);
  },

  // Enable selling capability
  enableSelling: async () => {
    if (CONFIG.USE_DEMO_MODE) {
      await mockDelay();
      if (DEMO_DATA.currentUser) {
        DEMO_DATA.currentUser.canSell = 1;
        return { success: true, user: DEMO_DATA.currentUser, message: 'Đã kích hoạt quyền bán hàng!' };
      }
      return { error: 'Not logged in' };
    }
    
    return api.post('/api/users/enable-selling');
  },

  // Top up user balance
  topUp: async (amount, paymentMethod = 'demo') => {
    if (CONFIG.USE_DEMO_MODE) {
      await mockDelay();
      if (DEMO_DATA.currentUser) {
        const amountCents = Math.round(amount * 100);
        DEMO_DATA.currentUser.balance += amountCents;
        return { 
          success: true, 
          user: DEMO_DATA.currentUser, 
          message: `Đã nạp thành công $${amount.toFixed(2)}!` 
        };
      }
      return { error: 'Not logged in' };
    }
    
    return api.post('/api/users/topup', { amount, paymentMethod });
  }
};

// Pets API endpoints
export const petsAPI = {
  // Get pets with filters
  getPets: async (filters = {}) => {
    if (CONFIG.USE_DEMO_MODE) {
      return mockAPI.pets.getPets(filters);
    }
    
    return api.get('/api/pets', filters);
  },

  // Get pet by slug
  getPet: async (slug) => {
    if (CONFIG.USE_DEMO_MODE) {
      return mockAPI.pets.getPet(slug);
    }
    
    return api.get(`/api/pets/${slug}`);
  },

  // Create new pet listing (seller only)
  createPet: async (petData) => {
    if (CONFIG.USE_DEMO_MODE) {
      return mockAPI.pets.createPet(petData);
    }
    
    return api.post('/api/seller/pets', petData);
  },

  // Update pet listing (seller only)
  updatePet: async (petId, petData) => {
    if (CONFIG.USE_DEMO_MODE) {
      await mockDelay();
      const petIndex = DEMO_DATA.pets.findIndex(p => p.id === petId);
      if (petIndex === -1) {
        throw new Error('Không tìm thấy thú cưng');
      }
      DEMO_DATA.pets[petIndex] = { ...DEMO_DATA.pets[petIndex], ...petData };
      return { success: true, pet: DEMO_DATA.pets[petIndex] };
    }
    
    return api.put(`/api/seller/pets/${petId}`, petData);
  },

  // Delete pet listing (seller only)
  deletePet: async (petId) => {
    if (CONFIG.USE_DEMO_MODE) {
      await mockDelay();
      const petIndex = DEMO_DATA.pets.findIndex(p => p.id === petId);
      if (petIndex === -1) {
        throw new Error('Không tìm thấy thú cưng');
      }
      DEMO_DATA.pets.splice(petIndex, 1);
      return { success: true };
    }
    
    return api.delete(`/api/seller/pets/${petId}`);
  },

  // Search pets
  searchPets: async (query, filters = {}) => {
    if (CONFIG.USE_DEMO_MODE) {
      return mockAPI.pets.getPets({ ...filters, search: query });
    }
    
    return api.get('/api/pets/search', { q: query, ...filters });
  },

  // Add to favorites
  addFavorite: async (petId) => {
    if (CONFIG.USE_DEMO_MODE) {
      await mockDelay();
      return { success: true, message: 'Đã thêm vào yêu thích' };
    }
    
    return api.post(`/api/pets/${petId}/favorite`);
  },

  // Remove from favorites
  removeFavorite: async (petId) => {
    if (CONFIG.USE_DEMO_MODE) {
      await mockDelay();
      return { success: true, message: 'Đã xóa khỏi yêu thích' };
    }
    
    return api.delete(`/api/pets/${petId}/favorite`);
  },

  // Update pet listing (seller only)
  updatePet: async (petId, petData) => {
    return api.put(`/api/seller/pets/${petId}`, petData);
  },

  // Delete pet listing (seller only)
  deletePet: async (petId) => {
    return api.delete(`/api/seller/pets/${petId}`);
  },

  // Get seller's pets
  getSellerPets: async (filters = {}) => {
    return api.get('/api/seller/pets', filters);
  },

  // Get pets for admin moderation
  getAdminPets: async (filters = {}) => {
    return api.get('/api/admin/pets', filters);
  },

  // Moderate pet listing (admin only)
  moderatePet: async (petId, action) => {
    return api.put(`/api/admin/pets/${petId}`, { action });
  }
};

// Favorites API endpoints
export const favoritesAPI = {
  // Get user's favorites
  getFavorites: async () => {
    return api.get('/api/favorites');
  },

  // Add to favorites
  addFavorite: async (petId) => {
    return api.post(`/api/favorites/${petId}`);
  },

  // Remove from favorites
  removeFavorite: async (petId) => {
    return api.delete(`/api/favorites/${petId}`);
  }
};

// Cart API endpoints
export const cartAPI = {
  // Get cart
  getCart: async () => {
    return api.get('/api/cart');
  },

  // Add item to cart
  addToCart: async (petId, quantity = 1) => {
    return api.post('/api/cart/items', { petId, qty: quantity });
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    return api.delete(`/api/cart/items/${itemId}`);
  },

  // Clear cart
  clearCart: async () => {
    return api.delete('/api/cart');
  }
};

// Orders API endpoints
export const ordersAPI = {
  // Create order
  createOrder: async (orderData) => {
    return api.post('/api/orders', orderData);
  },

  // Get orders (buyer or seller view)
  getOrders: async (role = 'buyer', filters = {}) => {
    return api.get('/api/orders', { role, ...filters });
  },

  // Get order details
  getOrder: async (orderId) => {
    return api.get(`/api/orders/${orderId}`);
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    return api.put(`/api/orders/${orderId}`, { status });
  }
};

// Chat API endpoints
export const chatAPI = {
  // Get threads
  getThreads: async (role = 'buyer') => {
    return api.get('/api/threads', { role });
  },

  // Create or get thread
  getOrCreateThread: async (sellerId, petId) => {
    return api.post('/api/threads', { sellerId, petId });
  },

  // Get messages in thread
  getMessages: async (threadId) => {
    return api.get(`/api/threads/${threadId}/messages`);
  },

  // Send message
  sendMessage: async (threadId, content, attachments = []) => {
    return api.post(`/api/threads/${threadId}/messages`, {
      content,
      attachments
    });
  }
};

// Support API endpoints
export const supportAPI = {
  // Get tickets
  getTickets: async (filters = {}) => {
    return api.get('/api/tickets', filters);
  },

  // Create ticket
  createTicket: async (ticketData) => {
    return api.post('/api/tickets', ticketData);
  },

  // Get ticket messages
  getTicketMessages: async (ticketId) => {
    return api.get(`/api/tickets/${ticketId}/messages`);
  },

  // Reply to ticket
  replyToTicket: async (ticketId, content, attachments = []) => {
    return api.post(`/api/tickets/${ticketId}/messages`, {
      content,
      attachments
    });
  },

  // Update ticket (support/admin only)
  updateTicket: async (ticketId, updateData) => {
    return api.put(`/api/support/tickets/${ticketId}`, updateData);
  },

  // Get support stats (support/admin only)
  getStats: async () => {
    return api.get('/api/support/stats');
  }
};

// Reviews API endpoints
export const reviewsAPI = {
  // Create review
  createReview: async (reviewData) => {
    return api.post('/api/reviews', reviewData);
  },

  // Get reviews for user
  getReviews: async (targetUserId) => {
    return api.get('/api/reviews', { targetUserId });
  }
};

// Reports API endpoints
export const reportsAPI = {
  // Create report
  createReport: async (reportData) => {
    return api.post('/api/reports', reportData);
  },

  // Get reports (admin only)
  getReports: async (filters = {}) => {
    return api.get('/api/admin/reports', filters);
  },

  // Update report status (admin only)
  updateReport: async (reportId, status, actionTaken = '') => {
    return api.put(`/api/admin/reports/${reportId}/status`, {
      status,
      actionTaken
    });
  }
};

// Upload API endpoints
export const uploadAPI = {
  // Get presigned URL for upload
  getPresignedUrl: async (contentType, fileName) => {
    return api.post('/api/upload/presign', {
      contentType,
      fileName
    });
  },

  // Upload file to R2 using presigned URL
  uploadFile: async (file, presignedUrl) => {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response;
  },

  // Complete upload process
  uploadImage: async (file) => {
    // Get presigned URL
    const { uploadUrl, publicUrl, key } = await uploadAPI.getPresignedUrl(
      file.type,
      file.name
    );

    // Upload file
    await uploadAPI.uploadFile(file, uploadUrl);

    return {
      url: publicUrl,
      key
    };
  }
};

// Admin API endpoints
export const adminAPI = {
  // Get moderation queue
  getModerationQueue: async (filters = {}) => {
    return api.get('/api/admin/moderation', filters);
  },

  // Moderate content
  moderateContent: async (entityId, decision, notes = '') => {
    return api.put(`/api/admin/moderation/${entityId}/decision`, {
      decision,
      notes
    });
  },

  // Get dashboard stats
  getStats: async () => {
    return api.get('/api/admin/stats');
  },

  // Get users
  getUsers: async (filters = {}) => {
    return api.get('/api/admin/users', filters);
  },

  // Update user status
  updateUserStatus: async (userId, status) => {
    return api.put(`/api/admin/users/${userId}/status`, { status });
  },

  // Get audit logs
  getAuditLogs: async (filters = {}) => {
    return api.get('/api/admin/audit-logs', filters);
  }
};

// Health check
export const healthCheck = async () => {
  return api.get('/api/health');
};

// Development seed data
export const devSeed = async () => {
  return api.post('/api/dev/seed');
};

// WebSocket connection for real-time features
let wsConnection = null;

export const websocket = {
  connect: (url = 'ws://localhost:8787/ws') => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      return wsConnection;
    }

    wsConnection = new WebSocket(url);
    
    wsConnection.onopen = () => {
      console.log('WebSocket connected');
      
      // Send auth token if available
      const token = getAuthToken();
      if (token) {
        wsConnection.send(JSON.stringify({
          type: 'auth',
          token
        }));
      }
    };

    wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        window.dispatchEvent(new CustomEvent('ws:message', { detail: data }));
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    wsConnection.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => websocket.connect(url), 5000);
    };

    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return wsConnection;
  },

  send: (data) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify(data));
    }
  },

  disconnect: () => {
    if (wsConnection) {
      wsConnection.close();
      wsConnection = null;
    }
  }
};

// Error handling for common scenarios
export const handleApiError = (error, showToast = true) => {
  let message = 'Đã xảy ra lỗi không xác định';
  
  if (error.status === 400) {
    message = 'Dữ liệu không hợp lệ';
  } else if (error.status === 401) {
    message = 'Vui lòng đăng nhập để tiếp tục';
  } else if (error.status === 403) {
    message = 'Bạn không có quyền thực hiện hành động này';
  } else if (error.status === 404) {
    message = 'Không tìm thấy dữ liệu';
  } else if (error.status === 429) {
    message = 'Quá nhiều yêu cầu, vui lòng thử lại sau';
  } else if (error.status >= 500) {
    message = 'Lỗi máy chủ, vui lòng thử lại sau';
  } else if (error.message) {
    message = error.message;
  }

  if (showToast && window.showToast) {
    window.showToast(message, 'error');
  }

  return message;
};

// Set base URL for different environments
export const setBaseUrl = (url) => {
  CONFIG.BASE_URL = url;
};

// Export configuration
export { CONFIG };

// Export all APIs as default
export default {
  api,
  authAPI,
  petsAPI,
  favoritesAPI,
  cartAPI,
  ordersAPI,
  chatAPI,
  supportAPI,
  reviewsAPI,
  reportsAPI,
  uploadAPI,
  adminAPI,
  healthCheck,
  devSeed,
  websocket,
  handleApiError,
  setBaseUrl,
  setAuthToken,
  removeAuthToken,
  setCsrfToken
};