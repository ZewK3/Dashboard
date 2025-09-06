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
  RETRY_DELAY: 1000 // 1 second
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
    const response = await api.post('/api/auth/register', userData);
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      removeAuthToken();
    }
  },

  // Get current user
  me: async () => {
    return api.get('/api/auth/me');
  },

  // Update profile
  updateProfile: async (profileData) => {
    return api.put('/api/auth/profile', profileData);
  },

  // Change password
  changePassword: async (passwordData) => {
    return api.put('/api/auth/password', passwordData);
  }
};

// Pets API endpoints
export const petsAPI = {
  // Get pets with filters
  getPets: async (filters = {}) => {
    return api.get('/api/pets', filters);
  },

  // Get pet by slug
  getPet: async (slug) => {
    return api.get(`/api/pets/${slug}`);
  },

  // Create new pet listing (seller only)
  createPet: async (petData) => {
    return api.post('/api/seller/pets', petData);
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