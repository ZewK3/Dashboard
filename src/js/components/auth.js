// Authentication Management Class
class AuthManager {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.sessionCheckInterval = null;
    this.listeners = new Set();
    this.init();
  }

  init() {
    this.setupEventListeners();
    console.log('Auth Manager initialized');
  }

  setupEventListeners() {
    // Listen for storage changes (logout from other tabs)
    Storage.addListener(APP_CONFIG.STORAGE.TOKEN, (token) => {
      if (!token && this.isAuthenticated) {
        this.handleLogout(false); // Don't clear storage again
      }
    });

    // Listen for user info changes
    Storage.addListener(APP_CONFIG.STORAGE.USER_INFO, (userInfo) => {
      if (userInfo && this.isAuthenticated) {
        this.currentUser = userInfo;
        this.updateUI();
      }
    });
  }

  async checkSession() {
    const token = Storage.get(APP_CONFIG.STORAGE.TOKEN);
    const userInfo = Storage.getObject(APP_CONFIG.STORAGE.USER_INFO);

    if (!token) {
      this.handleLogout(false);
      return false;
    }

    // Check token expiry if available
    if (userInfo?.expiresAt) {
      const expiryDate = new Date(userInfo.expiresAt);
      if (new Date() > expiryDate) {
        Notifications.warning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        this.handleLogout(true);
        return false;
      }
    }

    // If we have cached user info, use it immediately
    if (userInfo?.name) {
      this.handleLoginSuccess({
        ...userInfo,
        token
      }, false); // Don't save to storage again
    }

    // Verify token with server in background
    try {
      const userData = await API.getUserInfo(token);
      
      if (userData?.name) {
        this.handleLoginSuccess({
          ...userData,
          token
        }, true); // Update storage with fresh data
        
        return true;
      } else {
        throw new Error('Invalid user data');
      }
      
    } catch (error) {
      console.error('Session check failed:', error);
      
      // If we had cached user info, keep using it temporarily
      if (userInfo?.name) {
        console.warn('Using cached user info, server verification failed');
        return true;
      }
      
      // Otherwise logout
      this.handleLogout(true);
      return false;
    }
  }

  async login(email, password) {
    try {
      // Validate input
      if (!this.validateEmail(email)) {
        throw new Error('Email hoặc số điện thoại không hợp lệ!');
      }

      if (!password || password.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự!');
      }

      const response = await API.login(email, password);
      
      if (response?.token) {
        this.handleLoginSuccess(response, true);
        return response;
      } else {
        throw new Error(response?.message || 'Đăng nhập thất bại!');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(name, email, password) {
    try {
      // Validate input
      if (!name || name.trim().length < 2) {
        throw new Error('Tên phải có ít nhất 2 ký tự!');
      }

      if (!this.validateEmail(email)) {
        throw new Error('Email hoặc số điện thoại không hợp lệ!');
      }

      if (!password || password.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự!');
      }

      const response = await API.register(name.trim(), email, password);
      
      if (response?.token) {
        this.handleLoginSuccess(response, true);
        return response;
      } else {
        throw new Error(response?.message || 'Đăng ký thất bại!');
      }
      
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  logout() {
    this.handleLogout(true);
    Notifications.success(APP_CONFIG.SUCCESS.LOGOUT);
  }

  handleLoginSuccess(userData, saveToStorage = true) {
    this.isAuthenticated = true;
    this.currentUser = {
      name: userData.name || 'Khách',
      email: userData.email || '',
      exp: userData.exp || 0,
      rank: userData.rank || 'Bronze',
      avatar: userData.avatar || APP_CONFIG.USER.DEFAULT_AVATAR,
      expiresAt: userData.expiresAt || null
    };

    if (saveToStorage) {
      // Save token
      Storage.set(APP_CONFIG.STORAGE.TOKEN, userData.token);
      
      // Save user info
      Storage.setObject(APP_CONFIG.STORAGE.USER_INFO, this.currentUser);
    }

    this.updateUI();
    this.startSessionCheck();
    this.notifyListeners('login', this.currentUser);
  }

  handleLogout(clearStorage = true) {
    this.isAuthenticated = false;
    this.currentUser = null;

    if (clearStorage) {
      Storage.remove(APP_CONFIG.STORAGE.TOKEN);
      Storage.remove(APP_CONFIG.STORAGE.USER_INFO);
    }

    this.stopSessionCheck();
    this.updateUI();
    this.notifyListeners('logout');
    
    // Clear cart on logout
    if (window.Cart) {
      Cart.clear();
    }
  }

  updateUI() {
    const userInfo = document.getElementById('user-info');
    const authControl = document.getElementById('auth-control');
    
    if (this.isAuthenticated && this.currentUser) {
      // Show user info
      if (userInfo) {
        userInfo.style.display = 'flex';
        
        const nameDisplay = document.getElementById('user-name-display');
        const pointsDisplay = document.getElementById('user-points');
        const rankIcon = document.getElementById('rank-icon');
        const expFill = document.getElementById('exp-fill');
        
        if (nameDisplay) nameDisplay.textContent = this.currentUser.name;
        if (pointsDisplay) pointsDisplay.textContent = `${this.currentUser.exp} Points`;
        
        if (rankIcon) {
          rankIcon.className = `rank-icon rank-${this.currentUser.rank.toLowerCase()}`;
          rankIcon.setAttribute('aria-label', `Hạng ${this.currentUser.rank}`);
        }
        
        if (expFill) {
          const expPercentage = this.calculateExpPercentage(this.currentUser.exp, this.currentUser.rank);
          expFill.style.width = `${expPercentage}%`;
        }
      }
      
      // Hide login/register buttons, show logout
      if (authControl) {
        const loginBtn = document.getElementById('login-button');
        const registerBtn = document.getElementById('register-button');
        const logoutBtn = document.getElementById('logout-button');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
      }
      
    } else {
      // Hide user info
      if (userInfo) {
        userInfo.style.display = 'none';
      }
      
      // Show login/register buttons, hide logout
      if (authControl) {
        const loginBtn = document.getElementById('login-button');
        const registerBtn = document.getElementById('register-button');
        const logoutBtn = document.getElementById('logout-button');
        
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
      }
    }
  }

  calculateExpPercentage(exp, rank) {
    const ranks = APP_CONFIG.USER.RANKS;
    const currentRank = ranks[rank.toUpperCase()] || ranks.BRONZE;
    const nextRankKey = Object.keys(ranks).find(key => 
      ranks[key].threshold > currentRank.threshold
    );
    
    if (!nextRankKey) {
      return 100; // Max rank
    }
    
    const nextThreshold = ranks[nextRankKey].threshold;
    const progress = ((exp - currentRank.threshold) / (nextThreshold - currentRank.threshold)) * 100;
    
    return Math.min(100, Math.max(0, progress));
  }

  showLoginModal(isRegister = false) {
    const modal = Modals.create('auth-modal', isRegister ? 'Đăng ký' : 'Đăng nhập', '', {
      size: 'medium',
      showFooter: false
    });

    modal.body.innerHTML = `
      <form id="auth-form" class="auth-form">
        ${isRegister ? `
          <div class="form-group">
            <label class="form-label" for="auth-name">Tên của bạn</label>
            <input type="text" id="auth-name" class="form-control" placeholder="Nhập tên của bạn" required>
          </div>
        ` : ''}
        
        <div class="form-group">
          <label class="form-label" for="auth-email">Email hoặc số điện thoại</label>
          <input type="text" id="auth-email" class="form-control" placeholder="Nhập email hoặc số điện thoại" required>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="auth-password">Mật khẩu</label>
          <input type="password" id="auth-password" class="form-control" placeholder="Nhập mật khẩu" required>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-lg">
            <i class="fas fa-${isRegister ? 'user-plus' : 'sign-in-alt'}"></i>
            ${isRegister ? 'Đăng ký' : 'Đăng nhập'}
          </button>
          
          <div class="auth-switch">
            ${isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            <button type="button" class="btn btn-ghost" onclick="Auth.toggleAuthMode()">
              ${isRegister ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          </div>
        </div>
      </form>
    `;

    // Store current mode
    modal.isRegister = isRegister;
    
    // Set up form submission
    const form = modal.body.querySelector('#auth-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleAuthSubmit(e, isRegister));
    }

    modal.show();
  }

  toggleAuthMode() {
    const modal = Modals.get('auth-modal');
    if (modal) {
      modal.hide();
      this.showLoginModal(!modal.isRegister);
    }
  }

  async handleAuthSubmit(event, isRegister) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
      // Disable form
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
      
      // Get form data
      const formData = new FormData(form);
      const email = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      
      let result;
      
      if (isRegister) {
        const name = document.getElementById('auth-name').value.trim();
        result = await this.register(name, email, password);
        Notifications.success(APP_CONFIG.SUCCESS.REGISTER);
      } else {
        result = await this.login(email, password);
        Notifications.success(APP_CONFIG.SUCCESS.LOGIN);
      }
      
      // Close modal on success
      Modals.closeAll();
      
    } catch (error) {
      console.error('Auth error:', error);
      Notifications.error(error.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
      
    } finally {
      // Re-enable form
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,11}$/;
    return emailRegex.test(email) || phoneRegex.test(email);
  }

  startSessionCheck() {
    this.stopSessionCheck();
    
    // Check session every 30 minutes
    this.sessionCheckInterval = setInterval(() => {
      this.checkSession();
    }, 30 * 60 * 1000);
  }

  stopSessionCheck() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  // User info updates
  updateUserInfo(updates) {
    if (!this.isAuthenticated || !this.currentUser) return false;
    
    Object.assign(this.currentUser, updates);
    Storage.setObject(APP_CONFIG.STORAGE.USER_INFO, this.currentUser);
    this.updateUI();
    this.notifyListeners('user_updated', this.currentUser);
    
    return true;
  }

  // Getters
  getUser() {
    return this.currentUser;
  }

  getToken() {
    return Storage.get(APP_CONFIG.STORAGE.TOKEN);
  }

  isLoggedIn() {
    return this.isAuthenticated;
  }

  hasRole(role) {
    if (!this.currentUser) return false;
    return this.currentUser.role === role || this.currentUser.roles?.includes(role);
  }

  // Event listeners
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  // Admin authentication
  async loginAdmin(email, password) {
    try {
      const response = await this.login(email, password);
      
      if (response && this.hasRole('admin')) {
        return response;
      } else {
        throw new Error('Tài khoản không có quyền quản trị!');
      }
      
    } catch (error) {
      throw error;
    }
  }

  requireAuth() {
    if (!this.isAuthenticated) {
      Notifications.warning('Vui lòng đăng nhập để tiếp tục!');
      this.showLoginModal(false);
      return false;
    }
    return true;
  }

  requireAdmin() {
    if (!this.requireAuth()) return false;
    
    if (!this.hasRole('admin')) {
      Notifications.error('Bạn không có quyền truy cập tính năng này!');
      return false;
    }
    
    return true;
  }

  // Password reset (to be implemented)
  async requestPasswordReset(email) {
    try {
      // This would call an API endpoint for password reset
      throw new Error('Tính năng đặt lại mật khẩu chưa được triển khai');
    } catch (error) {
      throw error;
    }
  }

  // Social login (to be implemented)
  async loginWithGoogle() {
    try {
      throw new Error('Đăng nhập Google chưa được triển khai');
    } catch (error) {
      throw error;
    }
  }

  async loginWithFacebook() {
    try {
      throw new Error('Đăng nhập Facebook chưa được triển khai');
    } catch (error) {
      throw error;
    }
  }

  // Profile management
  async updateProfile(profileData) {
    try {
      if (!this.requireAuth()) return false;
      
      const token = this.getToken();
      // This would call an API endpoint to update profile
      
      // Update local user info
      this.updateUserInfo(profileData);
      
      Notifications.success('Cập nhật thông tin thành công!');
      return true;
      
    } catch (error) {
      console.error('Profile update error:', error);
      Notifications.error('Không thể cập nhật thông tin!');
      return false;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      if (!this.requireAuth()) return false;
      
      if (newPassword.length < 6) {
        throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      }
      
      const token = this.getToken();
      // This would call an API endpoint to change password
      
      Notifications.success('Đổi mật khẩu thành công!');
      return true;
      
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  // Cleanup
  destroy() {
    this.stopSessionCheck();
    this.listeners.clear();
    Storage.removeListener(APP_CONFIG.STORAGE.TOKEN);
    Storage.removeListener(APP_CONFIG.STORAGE.USER_INFO);
  }
}

// Create global auth instance
const Auth = new AuthManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthManager;
}