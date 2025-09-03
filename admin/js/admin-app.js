// Admin Authentication and App Management
class AdminApp {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.currentSection = 'dashboard';
    this.isInitialized = false;
    this.init();
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Check if user is already authenticated
      await this.checkAdminAuth();
      
      if (this.isAuthenticated) {
        this.showAdminInterface();
        await this.loadInitialData();
      } else {
        this.showAdminLogin();
      }
      
      this.setupEventListeners();
      this.isInitialized = true;
      
      console.log('Admin App initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize admin app:', error);
      this.showError('Không thể khởi tạo ứng dụng quản trị. Vui lòng tải lại trang!');
    }
  }

  async checkAdminAuth() {
    try {
      const token = localStorage.getItem('admin_token');
      const userInfo = JSON.parse(localStorage.getItem('admin_user') || '{}');

      if (!token) {
        return false;
      }

      // Check token expiry
      if (userInfo.expiresAt && new Date() > new Date(userInfo.expiresAt)) {
        this.clearAuth();
        return false;
      }

      // Verify with server
      const response = await fetch(`${APP_CONFIG.API.BASE_URL}?action=verifyAdmin&token=${token}`);
      const data = await response.json();

      if (data.success && data.user) {
        this.currentUser = data.user;
        this.isAuthenticated = true;
        return true;
      } else {
        this.clearAuth();
        return false;
      }

    } catch (error) {
      console.error('Admin auth check failed:', error);
      return false;
    }
  }

  showAdminLogin() {
    document.body.innerHTML = `
      <div class="admin-login-container">
        <div class="admin-login-box">
          <div class="admin-login-header">
            <div class="logo">
              <i class="fas fa-coffee"></i>
              <h1>TocoToco Admin</h1>
            </div>
            <p>Đăng nhập để quản trị hệ thống</p>
          </div>
          
          <form id="admin-login-form" class="admin-login-form">
            <div class="form-group">
              <label class="form-label" for="admin-email">Email</label>
              <input type="email" id="admin-email" class="form-control" placeholder="Nhập email quản trị" required>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="admin-password">Mật khẩu</label>
              <input type="password" id="admin-password" class="form-control" placeholder="Nhập mật khẩu" required>
            </div>
            
            <button type="submit" class="btn btn-primary btn-lg">
              <i class="fas fa-sign-in-alt"></i> Đăng nhập
            </button>
          </form>
          
          <div class="admin-login-footer">
            <a href="../src/index.html" class="btn btn-ghost">
              <i class="fas fa-arrow-left"></i> Về trang chủ
            </a>
          </div>
        </div>
      </div>
    `;

    // Add styles for login page
    this.addLoginStyles();
    
    // Setup login form
    const form = document.getElementById('admin-login-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleLogin(e));
    }
  }

  addLoginStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .admin-login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
      }
      
      .admin-login-box {
        background: white;
        border-radius: 16px;
        padding: 40px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        animation: slideInUp 0.5s ease;
      }
      
      .admin-login-header {
        text-align: center;
        margin-bottom: 30px;
      }
      
      .admin-login-header .logo {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 10px;
      }
      
      .admin-login-header .logo i {
        font-size: 2rem;
        color: #667eea;
      }
      
      .admin-login-header h1 {
        color: #667eea;
        margin: 0;
        font-size: 1.8rem;
      }
      
      .admin-login-header p {
        color: #6c757d;
        margin: 0;
      }
      
      .admin-login-form .form-group {
        margin-bottom: 20px;
      }
      
      .admin-login-form .btn {
        width: 100%;
        margin-top: 10px;
      }
      
      .admin-login-footer {
        text-align: center;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e9ecef;
      }
      
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  async handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';
      
      const email = document.getElementById('admin-email').value.trim();
      const password = document.getElementById('admin-password').value;
      
      if (!email || !password) {
        throw new Error('Vui lòng nhập đầy đủ thông tin!');
      }
      
      const response = await fetch(`${APP_CONFIG.API.BASE_URL}?action=adminLogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        // Save auth data
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        
        this.currentUser = data.user;
        this.isAuthenticated = true;
        
        // Redirect to admin interface
        window.location.reload();
        
      } else {
        throw new Error(data.message || 'Đăng nhập thất bại!');
      }
      
    } catch (error) {
      console.error('Admin login error:', error);
      this.showNotification(error.message || 'Có lỗi xảy ra. Vui lòng thử lại!', 'error');
      
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  showAdminInterface() {
    // The interface is already loaded via HTML, just need to update user info
    this.updateAdminUserInfo();
  }

  updateAdminUserInfo() {
    const adminName = document.getElementById('admin-name');
    if (adminName && this.currentUser) {
      adminName.textContent = this.currentUser.name || 'Admin';
    }
  }

  async loadInitialData() {
    try {
      // Load dashboard data
      await this.loadDashboardData();
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.showNotification('Không thể tải dữ liệu ban đầu!', 'error');
    }
  }

  async loadDashboardData() {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      // Load basic stats
      const response = await fetch(`${APP_CONFIG.API.BASE_URL}?action=getAdminStats&token=${token}`);
      const data = await response.json();

      if (data.success) {
        this.updateDashboardStats(data.stats);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  updateDashboardStats(stats) {
    // Update stat cards
    const totalOrders = document.getElementById('total-orders');
    const totalRevenue = document.getElementById('total-revenue');
    const totalCustomers = document.getElementById('total-customers');
    const totalProducts = document.getElementById('total-products');

    if (totalOrders) totalOrders.textContent = stats.totalOrders || 0;
    if (totalRevenue) totalRevenue.textContent = this.formatCurrency(stats.totalRevenue || 0);
    if (totalCustomers) totalCustomers.textContent = stats.totalCustomers || 0;
    if (totalProducts) totalProducts.textContent = stats.totalProducts || 0;
  }

  setupEventListeners() {
    // Handle logout
    const logoutBtn = document.querySelector('[onclick="adminLogout()"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Handle section navigation
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (navItem) {
        e.preventDefault();
        const section = navItem.getAttribute('href')?.replace('#', '');
        if (section) {
          this.showSection(section);
        }
      }
    });
  }

  showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
      section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });

    const activeNavItem = document.querySelector(`.nav-item[href="#${sectionName}"]`);
    if (activeNavItem) {
      activeNavItem.classList.add('active');
    }

    this.currentSection = sectionName;

    // Load section data if needed
    this.loadSectionData(sectionName);
  }

  async loadSectionData(section) {
    switch (section) {
      case 'orders':
        await this.loadOrdersData();
        break;
      case 'products':
        await this.loadProductsData();
        break;
      case 'users':
        await this.loadUsersData();
        break;
      case 'analytics':
        await this.loadAnalyticsData();
        break;
    }
  }

  async loadOrdersData() {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${APP_CONFIG.API.BASE_URL}?action=getAdminOrders&token=${token}`);
      const data = await response.json();

      if (data.success && data.orders) {
        this.renderOrdersTable(data.orders);
      }

    } catch (error) {
      console.error('Error loading orders:', error);
      this.showNotification('Không thể tải danh sách đơn hàng!', 'error');
    }
  }

  renderOrdersTable(orders) {
    const tbody = document.querySelector('#orders-table tbody');
    if (!tbody) return;

    tbody.innerHTML = orders.map(order => `
      <tr>
        <td>${order.orderId}</td>
        <td>${order.customerName || 'N/A'}</td>
        <td>${order.items?.length || 0} sản phẩm</td>
        <td>${this.formatCurrency(order.total)}</td>
        <td>${order.deliveryAddress || 'N/A'}</td>
        <td><span class="status-badge ${order.status}">${this.getStatusText(order.status)}</span></td>
        <td>${new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="admin.viewOrderDetails('${order.orderId}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-primary" onclick="admin.updateOrderStatus('${order.orderId}')">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  logout() {
    this.clearAuth();
    window.location.reload();
  }

  clearAuth() {
    this.isAuthenticated = false;
    this.currentUser = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount).replace('₫', ' VNĐ');
  }

  getStatusText(status) {
    const statusMap = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang chuẩn bị',
      delivering: 'Đang giao',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return statusMap[status] || status;
  }

  showNotification(message, type = 'info') {
    // Simple notification system for admin
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type} show`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-message">${message}</div>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  showError(message) {
    document.body.innerHTML = `
      <div class="admin-error-container">
        <div class="admin-error-box">
          <div class="admin-error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h2>Lỗi hệ thống</h2>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="window.location.reload()">
            <i class="fas fa-redo"></i> Tải lại trang
          </button>
        </div>
      </div>
    `;
  }
}

// Global functions for backward compatibility
function showSection(section) {
  if (window.admin) {
    window.admin.showSection(section);
  }
}

function adminLogout() {
  if (window.admin) {
    window.admin.logout();
  }
}

// Initialize admin app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.admin = new AdminApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminApp;
}