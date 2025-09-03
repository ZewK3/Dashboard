// API Utility Class
class APIManager {
  constructor() {
    this.baseUrl = APP_CONFIG.API.BASE_URL;
    this.endpoints = APP_CONFIG.API.ENDPOINTS;
    this.isOnline = navigator.onLine;
    this.requestQueue = [];
    this.setupEventListeners();
  }

  init() {
    console.log('API Manager initialized');
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueuedRequests();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async request(endpoint, options = {}) {
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add token if available and not already present
    const token = Storage.get(APP_CONFIG.STORAGE.TOKEN);
    if (token && !config.params?.token && !config.headers.Authorization) {
      if (config.method === 'GET') {
        const url = new URL(`${this.baseUrl}?action=${endpoint}`);
        url.searchParams.append('token', token);
        config.url = url.toString();
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Build URL
    const url = config.url || this.buildUrl(endpoint, config.params);

    if (!this.isOnline) {
      return this.handleOfflineRequest(url, config);
    }

    try {
      const response = await fetch(url, {
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: this.createTimeoutSignal(options.timeout || 10000)
      });

      return await this.handleResponse(response);
    } catch (error) {
      return this.handleError(error, url, config);
    }
  }

  buildUrl(endpoint, params = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.append('action', endpoint);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    return url.toString();
  }

  createTimeoutSignal(timeout) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }

  async handleResponse(response) {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      // Handle API error responses
      if (data.error || (data.success === false && data.message)) {
        throw new Error(data.message || data.error || 'API Error');
      }
      
      return data;
    }

    return await response.text();
  }

  handleError(error, url, config) {
    console.error('API Request failed:', { error, url, config });

    // Handle different types of errors
    if (error.name === 'AbortError') {
      throw new Error(APP_CONFIG.ERRORS.NETWORK);
    }

    if (error.message.includes('Failed to fetch')) {
      if (this.isOnline) {
        throw new Error(APP_CONFIG.ERRORS.SERVER);
      } else {
        throw new Error(APP_CONFIG.ERRORS.NETWORK);
      }
    }

    if (error.message.includes('HTTP 401')) {
      this.handleUnauthorized();
      throw new Error(APP_CONFIG.ERRORS.UNAUTHORIZED);
    }

    if (error.message.includes('HTTP 403')) {
      throw new Error(APP_CONFIG.ERRORS.FORBIDDEN);
    }

    if (error.message.includes('HTTP 404')) {
      throw new Error(APP_CONFIG.ERRORS.NOT_FOUND);
    }

    if (error.message.includes('HTTP 400')) {
      throw new Error(APP_CONFIG.ERRORS.VALIDATION);
    }

    throw new Error(error.message || APP_CONFIG.ERRORS.UNKNOWN);
  }

  handleOfflineRequest(url, config) {
    // Queue the request for later processing
    this.requestQueue.push({ url, config, timestamp: Date.now() });
    
    // Try to return cached data for GET requests
    if (config.method === 'GET') {
      const cached = this.getCachedData(url);
      if (cached) {
        return Promise.resolve(cached);
      }
    }

    throw new Error(APP_CONFIG.ERRORS.NETWORK);
  }

  handleUnauthorized() {
    // Clear stored auth data
    Storage.remove(APP_CONFIG.STORAGE.TOKEN);
    Storage.remove(APP_CONFIG.STORAGE.USER_INFO);
    
    // Redirect to login or refresh page
    if (window.Auth) {
      window.Auth.logout();
    }
  }

  async processQueuedRequests() {
    if (this.requestQueue.length === 0) return;

    console.log(`Processing ${this.requestQueue.length} queued requests`);

    const requests = [...this.requestQueue];
    this.requestQueue = [];

    for (const { url, config } of requests) {
      try {
        await this.request(url, config);
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  }

  getCachedData(url) {
    try {
      const cacheKey = `api_cache_${btoa(url)}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        if (Date.now() - timestamp < maxAge) {
          return data;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    
    return null;
  }

  setCachedData(url, data) {
    try {
      const cacheKey = `api_cache_${btoa(url)}`;
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  // Authentication APIs
  async login(email, password) {
    return this.request(this.endpoints.LOGIN, {
      method: 'POST',
      body: { email, password }
    });
  }

  async register(name, email, password) {
    return this.request(this.endpoints.REGISTER, {
      method: 'POST',
      body: { name, email, password }
    });
  }

  async getUserInfo(token) {
    return this.request(this.endpoints.USER_INFO, {
      params: { token }
    });
  }

  // Product APIs
  async getProducts() {
    const url = this.buildUrl(this.endpoints.PRODUCTS);
    
    // Try cache first
    const cached = this.getCachedData(url);
    if (cached) return cached;
    
    const data = await this.request(this.endpoints.PRODUCTS);
    
    // Cache successful response
    this.setCachedData(url, data);
    return data;
  }

  async getProductById(id) {
    return this.request(this.endpoints.PRODUCT_BY_ID, {
      params: { id }
    });
  }

  async addProduct(productData, token) {
    return this.request(this.endpoints.ADD_PRODUCT, {
      method: 'POST',
      body: productData,
      params: { token }
    });
  }

  async updateProduct(id, productData, token) {
    return this.request(this.endpoints.UPDATE_PRODUCT, {
      method: 'PUT',
      body: { ...productData, id },
      params: { token }
    });
  }

  async deleteProduct(id, token) {
    return this.request(this.endpoints.DELETE_PRODUCT, {
      method: 'DELETE',
      params: { id, token }
    });
  }

  async getCategories() {
    return this.request(this.endpoints.CATEGORIES);
  }

  // Order APIs
  async getOrders(token) {
    return this.request(this.endpoints.ORDERS, {
      params: { token }
    });
  }

  async getOrderById(orderId, token) {
    return this.request(this.endpoints.ORDER_BY_ID, {
      params: { orderId, token }
    });
  }

  async saveOrder(orderData, token) {
    return this.request(this.endpoints.SAVE_ORDER, {
      method: 'POST',
      body: orderData,
      params: { token }
    });
  }

  async updateOrderStatus(orderId, status, token) {
    return this.request(this.endpoints.UPDATE_ORDER_STATUS, {
      method: 'PUT',
      params: { orderId, status, token }
    });
  }

  // Store APIs
  async getStores() {
    return this.request(this.endpoints.STORES);
  }

  async getNearestStore(lat, lng) {
    return this.request(this.endpoints.NEAREST_STORE, {
      params: { lat, lng }
    });
  }

  // Transaction APIs
  async checkTransaction(transactionId) {
    return this.request(this.endpoints.CHECK_TRANSACTION, {
      params: { transactionId }
    });
  }

  // Analytics APIs
  async getAnalytics(startDate, endDate, token) {
    return this.request(this.endpoints.ANALYTICS, {
      params: { startDate, endDate, token }
    });
  }

  // Utility methods for legacy code compatibility
  async csvToJson(csvUrl) {
    try {
      const response = await fetch(csvUrl);
      const csv = await response.text();
      return this.parseCSV(csv);
    } catch (error) {
      console.error('Failed to fetch CSV:', error);
      throw error;
    }
  }

  parseCSV(csv) {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
                           .map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length < headers.length) continue;

      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });

      if (obj[headers[0]]) { // Check if first column has value
        result.push(obj);
      }
    }

    return result;
  }

  // Batch request utility
  async batchRequest(requests) {
    const promises = requests.map(({ endpoint, options }) => 
      this.request(endpoint, options).catch(error => ({ error }))
    );

    return Promise.all(promises);
  }

  // File upload utility
  async uploadFile(file, endpoint, token) {
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      params: { token }
    };

    // Remove Content-Type header for file uploads
    delete config.headers['Content-Type'];

    return this.request(endpoint, config);
  }
}

// Create global API instance
const API = new APIManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIManager;
}