/**
 * Production API Helper Module for Pet Marketplace
 * Handles all HTTP requests to the Cloudflare Workers backend
 */

import { storage, sessionStorage } from './utils.js';

// Configuration
const CONFIG = {
  BASE_URL: 'https://your-worker.your-subdomain.workers.dev', // Production URL
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
 * Pet API endpoints
 */
export const petsAPI = {
  // Authentication
  auth: {
    async register(userData) {
      return await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },

    async login(email, password) {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
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

    async getProfile() {
      return await apiRequest('/auth/profile');
    }
  },

  // Pet listings
  pets: {
    async getAll(filters = {}) {
      const params = new URLSearchParams(filters);
      return await apiRequest(`/pets?${params}`);
    },

    async getById(id) {
      return await apiRequest(`/pets/${id}`);
    },

    async create(petData) {
      return await apiRequest('/pets', {
        method: 'POST',
        body: JSON.stringify(petData)
      });
    },

    async update(id, petData) {
      return await apiRequest(`/pets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(petData)
      });
    },

    async delete(id) {
      return await apiRequest(`/pets/${id}`, {
        method: 'DELETE'
      });
    },

    async search(query, filters = {}) {
      const params = new URLSearchParams({ query, ...filters });
      return await apiRequest(`/pets/search?${params}`);
    }
  },

  // User management
  users: {
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
  },

  // Shopping cart
  cart: {
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

    async clear() {
      return await apiRequest('/cart', {
        method: 'DELETE'
      });
    }
  },

  // Favorites
  favorites: {
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
  },

  // Chat system
  chat: {
    async getThreads() {
      return await apiRequest('/chat/threads');
    },

    async getMessages(threadId) {
      return await apiRequest(`/chat/threads/${threadId}/messages`);
    },

    async sendMessage(threadId, message) {
      return await apiRequest(`/chat/threads/${threadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    },

    async createThread(recipientId, subject) {
      return await apiRequest('/chat/threads', {
        method: 'POST',
        body: JSON.stringify({ recipientId, subject })
      });
    }
  },

  // File upload
  files: {
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
  },

  // Admin functions (role-based access)
  admin: {
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

    async rejectPet(petId, reason) {
      return await apiRequest(`/admin/pets/${petId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
    },

    async getUsers(filters = {}) {
      const params = new URLSearchParams(filters);
      return await apiRequest(`/admin/users?${params}`);
    },

    async updateUser(userId, userData) {
      return await apiRequest(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
    }
  },

  // Support functions
  support: {
    async getTickets() {
      return await apiRequest('/support/tickets');
    },

    async getTicket(ticketId) {
      return await apiRequest(`/support/tickets/${ticketId}`);
    },

    async replyToTicket(ticketId, message) {
      return await apiRequest(`/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    },

    async closeTicket(ticketId) {
      return await apiRequest(`/support/tickets/${ticketId}/close`, {
        method: 'POST'
      });
    }
  }
};

// Initialize auth state from localStorage
const token = storage.get('authToken');
if (token) {
  apiState.authToken = token;
  // Get user profile to restore session
  petsAPI.auth.getProfile().then(result => {
    if (result.success) {
      apiState.currentUser = result.data.user;
    } else {
      // Invalid token, clear it
      storage.remove('authToken');
      apiState.authToken = null;
    }
  });
}

export { apiState };
export default petsAPI;