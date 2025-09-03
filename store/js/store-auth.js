// Store Authentication Module
class StoreAuth {
  constructor() {
    this.currentStore = null;
    this.isAuthenticated = false;
    this.authToken = null;
    this.stores = this.loadStores();
  }

  // Load store data (in production, this would come from API)
  loadStores() {
    return {
      'LLQ001': {
        code: 'LLQ001',
        name: 'TocoToco Lạc Long Quân',
        address: '123 Lạc Long Quân, Quận 11, TP.HCM',
        password: 'toco123',
        coordinates: { lat: 10.7769, lng: 106.6969 },
        manager: 'Nguyễn Văn A',
        phone: '0901234567'
      },
      'NTT001': {
        code: 'NTT001', 
        name: 'TocoToco Nguyễn Thái Học',
        address: '456 Nguyễn Thái Học, Quận 1, TP.HCM',
        password: 'toco456',
        coordinates: { lat: 10.7829, lng: 106.6953 },
        manager: 'Trần Thị B',
        phone: '0901234568'
      },
      'VVK001': {
        code: 'VVK001',
        name: 'TocoToco Võ Văn Kiệt',
        address: '789 Võ Văn Kiệt, Quận 5, TP.HCM', 
        password: 'toco789',
        coordinates: { lat: 10.7549, lng: 106.6677 },
        manager: 'Lê Văn C',
        phone: '0901234569'
      },
      'PMH001': {
        code: 'PMH001',
        name: 'TocoToco Phú Mỹ Hưng',
        address: '321 Nguyễn Lương Bằng, Quận 7, TP.HCM',
        password: 'toco321',
        coordinates: { lat: 10.7285, lng: 106.7317 },
        manager: 'Phạm Thị D',
        phone: '0901234570'
      },
      'THD001': {
        code: 'THD001',
        name: 'TocoToco Thủ Đức',
        address: '654 Võ Văn Ngân, TP Thủ Đức, TP.HCM',
        password: 'toco654',
        coordinates: { lat: 10.8505, lng: 106.7717 },
        manager: 'Hoàng Văn E',
        phone: '0901234571'
      }
    };
  }

  // Login store
  async login(storeCode, password) {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const store = this.stores[storeCode.toUpperCase()];
      
      if (!store) {
        throw new Error('Mã cửa hàng không tồn tại');
      }

      if (store.password !== password) {
        throw new Error('Mật khẩu không chính xác');
      }

      // Generate auth token (in production, this would come from server)
      this.authToken = this.generateToken(store);
      this.currentStore = store;
      this.isAuthenticated = true;

      // Save to localStorage
      localStorage.setItem('store_auth_token', this.authToken);
      localStorage.setItem('current_store', JSON.stringify(store));

      return {
        success: true,
        store: store,
        token: this.authToken
      };

    } catch (error) {
      throw error;
    }
  }

  // Generate auth token
  generateToken(store) {
    const payload = {
      storeCode: store.code,
      timestamp: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    // In production, this would be a proper JWT token from server
    return btoa(JSON.stringify(payload));
  }

  // Verify auth token
  verifyToken(token) {
    try {
      const payload = JSON.parse(atob(token));
      
      if (payload.expires < Date.now()) {
        return false; // Token expired
      }

      const store = this.stores[payload.storeCode];
      if (!store) {
        return false; // Store doesn't exist
      }

      this.currentStore = store;
      this.isAuthenticated = true;
      this.authToken = token;

      return true;
    } catch (error) {
      return false;
    }
  }

  // Check if user is authenticated
  checkAuth() {
    const token = localStorage.getItem('store_auth_token');
    const storeData = localStorage.getItem('current_store');

    if (!token || !storeData) {
      return false;
    }

    try {
      this.currentStore = JSON.parse(storeData);
      return this.verifyToken(token);
    } catch (error) {
      this.logout();
      return false;
    }
  }

  // Logout
  logout() {
    this.currentStore = null;
    this.isAuthenticated = false;
    this.authToken = null;
    
    localStorage.removeItem('store_auth_token');
    localStorage.removeItem('current_store');
    
    // Redirect to login
    this.showLogin();
  }

  // Show login screen
  showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
  }

  // Show main app
  showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    
    // Update store info in header
    this.updateStoreInfo();
  }

  // Update store info in header
  updateStoreInfo() {
    if (this.currentStore) {
      document.getElementById('store-name').textContent = this.currentStore.name;
      document.getElementById('store-location').textContent = this.currentStore.address;
    }
  }

  // Get current store
  getCurrentStore() {
    return this.currentStore;
  }

  // Get auth token
  getAuthToken() {
    return this.authToken;
  }

  // Check if authenticated
  isAuth() {
    return this.isAuthenticated;
  }

  // Get API headers with auth
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
      'Store-Code': this.currentStore?.code
    };
  }
}

// Initialize store auth
const storeAuth = new StoreAuth();

// Toggle password visibility
function togglePassword() {
  const passwordInput = document.getElementById('store-password');
  const eyeIcon = document.getElementById('eye-icon');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeIcon.className = 'fas fa-eye-slash';
  } else {
    passwordInput.type = 'password';
    eyeIcon.className = 'fas fa-eye';
  }
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('store-login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const storeCode = document.getElementById('store-code').value.trim();
      const password = document.getElementById('store-password').value;
      const submitBtn = loginForm.querySelector('.login-btn');
      
      if (!storeCode || !password) {
        showNotification('Vui lòng nhập đầy đủ thông tin', 'error');
        return;
      }

      // Show loading state
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';
      submitBtn.disabled = true;

      try {
        const result = await storeAuth.login(storeCode, password);
        
        if (result.success) {
          showNotification(`Đăng nhập thành công! Chào mừng ${result.store.name}`, 'success');
          
          // Clear form
          loginForm.reset();
          
          // Show main app after a short delay
          setTimeout(() => {
            storeAuth.showApp();
            
            // Initialize app modules
            if (typeof initializeStoreApp === 'function') {
              initializeStoreApp();
            }
          }, 1000);
        }
      } catch (error) {
        showNotification(error.message, 'error');
      } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Check if already authenticated
  if (storeAuth.checkAuth()) {
    storeAuth.showApp();
    
    // Initialize app modules
    if (typeof initializeStoreApp === 'function') {
      initializeStoreApp();
    }
  }
});

// Notification function
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Add styles if not already added
  if (!document.querySelector('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px;
        max-width: 400px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        animation: slideInNotification 0.3s ease;
      }
      
      @keyframes slideInNotification {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      .notification-success { border-left: 4px solid #27ae60; }
      .notification-error { border-left: 4px solid #e74c3c; }
      .notification-info { border-left: 4px solid #3498db; }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }
      
      .notification-success i { color: #27ae60; }
      .notification-error i { color: #e74c3c; }
      .notification-info i { color: #3498db; }
      
      .notification-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #7f8c8d;
        padding: 4px;
        border-radius: 4px;
      }
      
      .notification-close:hover {
        background: #f8f9fa;
        color: #2c3e50;
      }
    `;
    document.head.appendChild(styles);
  }

  // Add to page
  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideInNotification 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StoreAuth, storeAuth };
}