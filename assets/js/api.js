/**
 * Production API Helper Module for Pet Marketplace
 * Handles all HTTP requests to the Cloudflare Workers backend
 */

import { storage, sessionStorage } from './utils.js';

// Configuration
const CONFIG = {
  BASE_URL: 'https://hipet-market-api.tocotoco.workers.dev', // Production URL
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  USE_DEMO_MODE: false // Disable demo mode - use real API
};

// API state
const apiState = {
  currentUser: null,
  authToken: null
};

/**
 * Generic HTTP request function with error handling and retry logic
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${CONFIG.BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    timeout: CONFIG.TIMEOUT
  };

  // Add auth token if available
  const token = storage.get('authToken');
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  const requestOptions = { ...defaultOptions, ...options };

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error) {
      console.warn(`API request attempt ${attempt} failed:`, error.message);

      if (attempt === CONFIG.MAX_RETRIES) {
        return { 
          success: false, 
          error: error.message,
          code: error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR'
        };
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * attempt));
    }
  }
}

/**
 * Error handling utility
 */
function handleApiError(error, showFullError = true) {
  console.error('API Error:', error);
  
  if (error.name === 'AbortError') {
    return 'Yêu cầu đã bị hủy do timeout';
  }
  
  if (!navigator.onLine) {
    return 'Không có kết nối internet';
  }
  
  if (error.message) {
    return showFullError ? error.message : 'Có lỗi xảy ra, vui lòng thử lại';
  }
  
  return 'Có lỗi xảy ra, vui lòng thử lại';
}

/**
 * Pet API endpoints
 */
const authAPI = {
  async register(userData) {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async login(emailOrData, password) {
    // Support both login(email, password) and login({email, password}) formats
    let loginData;
    if (typeof emailOrData === 'object' && emailOrData.email) {
      loginData = { email: emailOrData.email, password: emailOrData.password };
    } else {
      loginData = { email: emailOrData, password: password };
    }

    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData)
    });

    if (result.success && result.data.token) {
      storage.set('authToken', result.data.token);
      apiState.authToken = result.data.token;
      apiState.currentUser = result.data.user;
    }

    return result;
  },

  async logout() {
    const result = await apiRequest('/auth/logout', { method: 'POST' });
    
    storage.remove('authToken');
    apiState.authToken = null;
    apiState.currentUser = null;
    
    return result;
  },

  async me() {
    return await apiRequest('/auth/profile');
  },

  async getProfile() {
    return await apiRequest('/auth/profile');
  }
};

// Pet listings API
const petsAPI = {
  async getPets(filters = {}) {
    const params = new URLSearchParams(filters);
    return await apiRequest(`/pets?${params}`);
  },

  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    return await apiRequest(`/pets?${params}`);
  },

  async getById(id) {
    return await apiRequest(`/pets/${id}`);
  },

  async createPet(petData) {
    return await apiRequest('/pets', {
      method: 'POST',
      body: JSON.stringify(petData)
    });
  },

  async create(petData) {
    return await apiRequest('/pets', {
      method: 'POST',
      body: JSON.stringify(petData)
    });
  },

  // Update and delete operations not supported by backend
  async update(id, petData) {
    console.warn('Pet update operation not supported by backend');
    return { success: false, error: 'Update operation not supported' };
  },

  async delete(id) {
    console.warn('Pet delete operation not supported by backend');
    return { success: false, error: 'Delete operation not supported' };
  },

  async search(query, filters = {}) {
    const params = new URLSearchParams({ query, ...filters });
    return await apiRequest(`/pets/search?${params}`);
  }

};

// Sellers API
const sellersAPI = {
  async getStats() {
    return await apiRequest('/seller/stats');
  },

  async getListings(filters = {}) {
    const params = new URLSearchParams(filters);
    return await apiRequest(`/seller/listings?${params}`);
  },

  // Use pets API for creating listings
  async createListing(petData) {
    return await petsAPI.create(petData);
  },

  // Update and delete operations not supported by backend
  async updateListing(id, petData) {
    console.warn('Pet update operation not supported by backend');
    return { success: false, error: 'Update operation not supported. Please contact admin.' };
  },

  async deleteListing(id) {
    console.warn('Pet delete operation not supported by backend');
    return { success: false, error: 'Delete operation not supported. Please contact admin.' };
  }
};

// User management API
const usersAPI = {
  async updateProfile(profileData) {
    return await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  async enableSelling() {
    return await apiRequest('/users/enable-selling', {
      method: 'POST'
    });
  },

  async topup(amount, paymentMethod) {
    return await apiRequest('/users/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod })
    });
  }
};

// Shopping cart API
const cartAPI = {
  async getItems() {
    return await apiRequest('/cart');
  },

  async addItem(petId) {
    return await apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ petId })
    });
  },

  async removeItem(petId) {
    return await apiRequest(`/cart/items/${petId}`, {
      method: 'DELETE'
    });
  },

  // Clear cart operation not supported by backend
  async clear() {
    console.warn('Cart clear operation not supported by backend');
    return { success: false, error: 'Clear cart operation not supported' };
  }
};

// Favorites API
const favoritesAPI = {
  async getAll() {
    return await apiRequest('/favorites');
  },

  async add(petId) {
    return await apiRequest('/favorites', {
      method: 'POST',
      body: JSON.stringify({ petId })
    });
  },

  async remove(petId) {
    return await apiRequest(`/favorites/${petId}`, {
      method: 'DELETE'
    });
  }
};

// Chat API - Not implemented in backend
const chatAPI = {
  async getThreads() {
    console.warn('Chat API not implemented in backend');
    return { success: false, error: 'Chat functionality not available' };
  },

  async getMessages(threadId) {
    console.warn('Chat API not implemented in backend');
    return { success: false, error: 'Chat functionality not available' };
  },

  async sendMessage(threadId, message) {
    console.warn('Chat API not implemented in backend');
    return { success: false, error: 'Chat functionality not available' };
  },

  async createThread(recipientId, subject) {
    console.warn('Chat API not implemented in backend');
    return { success: false, error: 'Chat functionality not available' };
  }
};

// Files API
const filesAPI = {
  async getUploadUrl(fileName, fileType) {
    return await apiRequest('/files/upload-url', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileType })
    });
  },

  async uploadFile(file, uploadUrl) {
    return await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });
  }
};

// Admin API
const adminAPI = {
  async getStats() {
    return await apiRequest('/admin/stats');
  },

  async getPendingPets() {
    return await apiRequest('/admin/pets/pending');
  },

  async approvePet(petId) {
    return await apiRequest(`/admin/pets/${petId}/approve`, {
      method: 'POST'
    });
  },

  // Reject pet operation not supported by backend
  async rejectPet(petId, reason) {
    console.warn('Pet reject operation not supported by backend');
    return { success: false, error: 'Reject operation not supported' };
  },

  // User management operations not supported by backend
  async getUsers(filters = {}) {
    console.warn('User management not supported by backend');
    return { success: false, error: 'User management not available' };
  },

  async updateUser(userId, userData) {
    console.warn('User management not supported by backend');
    return { success: false, error: 'User management not available' };
  }
};

// Support API - Not implemented in backend  
const supportAPI = {
  async getTickets() {
    console.warn('Support API not implemented in backend');
    return { success: false, error: 'Support functionality not available' };
  },

  async getTicket(ticketId) {
    console.warn('Support API not implemented in backend');
    return { success: false, error: 'Support functionality not available' };
  },

  async replyToTicket(ticketId, message) {
    console.warn('Support API not implemented in backend');
    return { success: false, error: 'Support functionality not available' };
  },

  async closeTicket(ticketId) {
    console.warn('Support API not implemented in backend');
    return { success: false, error: 'Support functionality not available' };
  }
};

// Main API object with all endpoints
const api = {
  authAPI,
  petsAPI,
  sellersAPI,
  usersAPI,
  cartAPI,
  favoritesAPI,
  chatAPI,
  filesAPI,
  adminAPI,
  supportAPI,
  handleApiError
};

// Initialize auth state from localStorage
const token = storage.get('authToken');
if (token) {
  apiState.authToken = token;
  // Get user profile to restore session
  authAPI.getProfile().then(result => {
    if (result.success) {
      apiState.currentUser = result.data.user;
    } else {
      // Invalid token, clear it
      storage.remove('authToken');
      apiState.authToken = null;
    }
  });
}

export { apiState, authAPI, petsAPI, sellersAPI, usersAPI, cartAPI, favoritesAPI, chatAPI, filesAPI, adminAPI, supportAPI, handleApiError };
export default api;