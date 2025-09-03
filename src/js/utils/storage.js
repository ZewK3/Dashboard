// Storage Utility Class
class StorageManager {
  constructor() {
    this.prefix = 'tocotoco_';
    this.isAvailable = this.checkAvailability();
    this.listeners = new Map();
    this.init();
  }

  init() {
    if (this.isAvailable) {
      this.setupStorageListener();
      console.log('Storage Manager initialized');
    } else {
      console.warn('LocalStorage not available, using fallback');
    }
  }

  checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith(this.prefix)) {
        const key = e.key.replace(this.prefix, '');
        const listeners = this.listeners.get(key);
        
        if (listeners) {
          const newValue = this.parseValue(e.newValue);
          const oldValue = this.parseValue(e.oldValue);
          
          listeners.forEach(callback => {
            try {
              callback(newValue, oldValue, key);
            } catch (error) {
              console.error('Error in storage listener:', error);
            }
          });
        }
      }
    });
  }

  getKey(key) {
    return `${this.prefix}${key}`;
  }

  set(key, value, options = {}) {
    if (!this.isAvailable) {
      console.warn('Storage not available');
      return false;
    }

    try {
      const data = {
        value,
        timestamp: Date.now(),
        ...options
      };

      // Add expiration if specified
      if (options.expiresIn) {
        data.expiresAt = Date.now() + options.expiresIn;
      }

      localStorage.setItem(this.getKey(key), JSON.stringify(data));
      
      // Trigger local listeners
      this.triggerLocalListeners(key, value, this.get(key));
      
      return true;
    } catch (error) {
      console.error('Error setting storage:', error);
      
      // If quota exceeded, try to clear old data
      if (error.name === 'QuotaExceededError') {
        this.cleanup();
        try {
          localStorage.setItem(this.getKey(key), JSON.stringify({ value, timestamp: Date.now() }));
          return true;
        } catch (retryError) {
          console.error('Failed to set storage after cleanup:', retryError);
        }
      }
      
      return false;
    }
  }

  get(key, defaultValue = null) {
    if (!this.isAvailable) {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) {
        return defaultValue;
      }

      const data = JSON.parse(item);
      
      // Check if item has expired
      if (data.expiresAt && Date.now() > data.expiresAt) {
        this.remove(key);
        return defaultValue;
      }

      return data.value !== undefined ? data.value : defaultValue;
    } catch (error) {
      console.error('Error getting storage:', error);
      return defaultValue;
    }
  }

  remove(key) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const oldValue = this.get(key);
      localStorage.removeItem(this.getKey(key));
      
      // Trigger local listeners
      this.triggerLocalListeners(key, null, oldValue);
      
      return true;
    } catch (error) {
      console.error('Error removing storage:', error);
      return false;
    }
  }

  clear() {
    if (!this.isAvailable) {
      return false;
    }

    try {
      // Get all keys with our prefix
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.replace(this.prefix, ''));
        }
      }

      // Remove all our keys
      keys.forEach(key => {
        localStorage.removeItem(this.getKey(key));
      });

      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  exists(key) {
    return this.get(key) !== null;
  }

  keys() {
    if (!this.isAvailable) {
      return [];
    }

    const keys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.replace(this.prefix, ''));
        }
      }
    } catch (error) {
      console.error('Error getting storage keys:', error);
    }

    return keys;
  }

  size() {
    return this.keys().length;
  }

  // Get storage usage in bytes (approximate)
  getStorageSize() {
    if (!this.isAvailable) {
      return 0;
    }

    let total = 0;
    try {
      for (let key in localStorage) {
        if (key.startsWith(this.prefix)) {
          total += key.length + localStorage[key].length;
        }
      }
    } catch (error) {
      console.error('Error calculating storage size:', error);
    }

    return total;
  }

  // Clean up expired items
  cleanup() {
    if (!this.isAvailable) {
      return 0;
    }

    const keys = this.keys();
    let cleaned = 0;

    keys.forEach(key => {
      try {
        const item = localStorage.getItem(this.getKey(key));
        if (item) {
          const data = JSON.parse(item);
          if (data.expiresAt && Date.now() > data.expiresAt) {
            this.remove(key);
            cleaned++;
          }
        }
      } catch (error) {
        // Remove corrupted items
        this.remove(key);
        cleaned++;
      }
    });

    console.log(`Cleaned ${cleaned} expired storage items`);
    return cleaned;
  }

  // Add listener for storage changes
  addListener(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
  }

  // Remove listener
  removeListener(key, callback) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(key);
      }
    }
  }

  // Trigger local listeners (for same-tab changes)
  triggerLocalListeners(key, newValue, oldValue) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error('Error in storage listener:', error);
        }
      });
    }
  }

  parseValue(value) {
    if (value === null) return null;
    try {
      const data = JSON.parse(value);
      return data.value !== undefined ? data.value : null;
    } catch (error) {
      return null;
    }
  }

  // Convenience methods for common data types
  setObject(key, obj, options = {}) {
    return this.set(key, obj, options);
  }

  getObject(key, defaultValue = {}) {
    return this.get(key, defaultValue);
  }

  setArray(key, arr, options = {}) {
    return this.set(key, arr, options);
  }

  getArray(key, defaultValue = []) {
    return this.get(key, defaultValue);
  }

  setNumber(key, num, options = {}) {
    return this.set(key, Number(num), options);
  }

  getNumber(key, defaultValue = 0) {
    const value = this.get(key, defaultValue);
    return Number(value) || defaultValue;
  }

  setBoolean(key, bool, options = {}) {
    return this.set(key, Boolean(bool), options);
  }

  getBoolean(key, defaultValue = false) {
    const value = this.get(key, defaultValue);
    return Boolean(value);
  }

  // Session storage (expires when browser closes)
  setSession(key, value) {
    try {
      sessionStorage.setItem(this.getKey(key), JSON.stringify({ value, timestamp: Date.now() }));
      return true;
    } catch (error) {
      console.error('Error setting session storage:', error);
      return false;
    }
  }

  getSession(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(this.getKey(key));
      if (item === null) {
        return defaultValue;
      }
      const data = JSON.parse(item);
      return data.value !== undefined ? data.value : defaultValue;
    } catch (error) {
      console.error('Error getting session storage:', error);
      return defaultValue;
    }
  }

  removeSession(key) {
    try {
      sessionStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Error removing session storage:', error);
      return false;
    }
  }

  // Cache with TTL (time to live)
  setCache(key, value, ttlSeconds = 3600) {
    return this.set(key, value, {
      expiresIn: ttlSeconds * 1000,
      isCache: true
    });
  }

  getCache(key, defaultValue = null) {
    return this.get(key, defaultValue);
  }

  // Import/Export functionality
  export() {
    const data = {};
    const keys = this.keys();
    
    keys.forEach(key => {
      data[key] = this.get(key);
    });
    
    return data;
  }

  import(data, overwrite = false) {
    let imported = 0;
    
    Object.entries(data).forEach(([key, value]) => {
      if (overwrite || !this.exists(key)) {
        if (this.set(key, value)) {
          imported++;
        }
      }
    });
    
    return imported;
  }

  // Backup and restore
  backup() {
    const backup = {
      timestamp: Date.now(),
      data: this.export()
    };
    
    return JSON.stringify(backup);
  }

  restore(backupString, overwrite = false) {
    try {
      const backup = JSON.parse(backupString);
      if (backup.data) {
        return this.import(backup.data, overwrite);
      }
      return 0;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return 0;
    }
  }
}

// Create global storage instance
const Storage = new StorageManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}