// Store App Main Module
class StoreApp {
  constructor() {
    this.isInitialized = false;
    this.currentOrderModal = null;
  }

  // Initialize the store app
  initialize() {
    if (this.isInitialized) return;

    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize modules
    this.initializeModules();
    
    // Load initial data
    this.loadInitialData();
    
    this.isInitialized = true;
    console.log('Store app initialized successfully');
  }

  // Setup event listeners
  setupEventListeners() {
    // Filter controls
    const statusFilter = document.getElementById('status-filter');
    const timeFilter = document.getElementById('time-filter');
    const orderSearch = document.getElementById('order-search');
    const sortOptions = document.getElementById('sort-options');

    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        storeOrders.setFilters({ status: statusFilter.value });
      });
    }

    if (timeFilter) {
      timeFilter.addEventListener('change', () => {
        storeOrders.setFilters({ time: timeFilter.value });
      });
    }

    if (orderSearch) {
      orderSearch.addEventListener('input', () => {
        storeOrders.setFilters({ search: orderSearch.value });
      });
    }

    if (sortOptions) {
      sortOptions.addEventListener('change', () => {
        storeOrders.setSortOrder(sortOptions.value);
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + R to refresh orders
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshOrders();
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        closeModal();
        if (storeNotifications.isOpen) {
          toggleNotifications();
        }
      }
    });

    // Click outside to close notifications
    document.addEventListener('click', (e) => {
      const notificationPanel = document.getElementById('notification-panel');
      const notificationBtn = document.querySelector('.notification-btn');
      
      if (storeNotifications.isOpen && 
          !notificationPanel.contains(e.target) && 
          !notificationBtn.contains(e.target)) {
        toggleNotifications();
      }
    });

    // Auto-refresh orders every 30 seconds
    setInterval(() => {
      if (storeAuth.isAuth()) {
        refreshOrders();
      }
    }, 30000);
  }

  // Initialize modules
  initializeModules() {
    // Initialize notifications
    if (typeof storeNotifications !== 'undefined') {
      storeNotifications.updateBadge();
    }

    // Initialize orders
    if (typeof storeOrders !== 'undefined') {
      storeOrders.applyFilters();
    }
  }

  // Load initial data
  loadInitialData() {
    // Load store-specific settings
    this.loadStoreSettings();
    
    // Set initial filter to pending orders
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
      statusFilter.value = 'pending';
    }
  }

  // Load store-specific settings
  loadStoreSettings() {
    const currentStore = storeAuth.getCurrentStore();
    if (!currentStore) return;

    // Load saved preferences from localStorage
    const savedPreferences = localStorage.getItem(`store_preferences_${currentStore.code}`);
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        this.applyPreferences(preferences);
      } catch (error) {
        console.error('Error loading store preferences:', error);
      }
    }
  }

  // Apply user preferences
  applyPreferences(preferences) {
    // Apply filter preferences
    if (preferences.defaultStatus) {
      const statusFilter = document.getElementById('status-filter');
      if (statusFilter) {
        statusFilter.value = preferences.defaultStatus;
      }
    }

    if (preferences.defaultSort) {
      const sortOptions = document.getElementById('sort-options');
      if (sortOptions) {
        sortOptions.value = preferences.defaultSort;
      }
    }
  }

  // Save user preferences
  savePreferences() {
    const currentStore = storeAuth.getCurrentStore();
    if (!currentStore) return;

    const preferences = {
      defaultStatus: document.getElementById('status-filter')?.value || 'pending',
      defaultSort: document.getElementById('sort-options')?.value || 'newest',
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(`store_preferences_${currentStore.code}`, JSON.stringify(preferences));
  }

  // Show order details modal
  showOrderDetails(orderId) {
    const order = storeOrders.getOrder(orderId);
    if (!order) {
      showNotification('Không tìm thấy đơn hàng', 'error');
      return;
    }

    this.currentOrderModal = orderId;
    const modal = document.getElementById('order-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = `Chi tiết đơn hàng #${order.id}`;
    modalBody.innerHTML = this.renderOrderDetails(order);

    modal.classList.add('show');
  }

  // Render order details
  renderOrderDetails(order) {
    const statusText = storeOrders.getStatusText(order.status);
    const totalText = storeOrders.formatCurrency(order.total);
    const timeText = storeOrders.formatTime(order.createdAt);

    const productsHTML = order.products.map(product => `
      <div class="order-product">
        <div class="product-info">
          <h4>${product.name}</h4>
          <p>Số lượng: ${product.quantity}</p>
          ${product.options ? `
            <div class="product-options">
              <p><strong>Tùy chọn:</strong></p>
              <ul>
                ${product.options.size ? `<li>Size: ${product.options.size}</li>` : ''}
                ${product.options.sugar ? `<li>Đường: ${product.options.sugar}</li>` : ''}
                ${product.options.ice ? `<li>Đá: ${product.options.ice}</li>` : ''}
                ${product.options.toppings ? `<li>Topping: ${product.options.toppings}</li>` : ''}
              </ul>
            </div>
          ` : ''}
        </div>
        <div class="product-price">${storeOrders.formatCurrency(product.total)}</div>
      </div>
    `).join('');

    return `
      <div class="order-details">
        <div class="order-summary">
          <div class="summary-row">
            <span>Trạng thái:</span>
            <span class="status status-${order.status}">${statusText}</span>
          </div>
          <div class="summary-row">
            <span>Thời gian đặt:</span>
            <span>${timeText}</span>
          </div>
          <div class="summary-row">
            <span>Phương thức giao:</span>
            <span>${order.deliveryMethod === 'delivery' ? 'Giao hàng' : 'Tự đến lấy'}</span>
          </div>
          <div class="summary-row">
            <span>Thanh toán:</span>
            <span>${order.paymentMethod === 'qr' ? 'QR Code' : 'Tiền mặt'} - ${order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
          </div>
          ${order.priority === 'high' ? '<div class="summary-row priority"><span>Ưu tiên:</span><span>Cao</span></div>' : ''}
        </div>

        <div class="customer-details">
          <h3>Thông tin khách hàng</h3>
          <div class="customer-info">
            <p><strong>Tên:</strong> ${order.customer.name}</p>
            <p><strong>Điện thoại:</strong> ${order.customer.phone}</p>
            <p><strong>Địa chỉ:</strong> ${order.deliveryAddress}</p>
          </div>
        </div>

        <div class="order-products">
          <h3>Sản phẩm đặt hàng</h3>
          ${productsHTML}
        </div>

        ${order.notes ? `
          <div class="order-notes">
            <h3>Ghi chú</h3>
            <p>${order.notes}</p>
          </div>
        ` : ''}

        <div class="order-total">
          <div class="total-row">
            <span>Tổng cộng:</span>
            <span class="total-amount">${totalText}</span>
          </div>
        </div>

        <div class="order-actions">
          ${this.getModalActionButtons(order)}
        </div>
      </div>
    `;
  }

  // Get action buttons for modal
  getModalActionButtons(order) {
    const buttons = [];

    switch (order.status) {
      case 'pending':
        buttons.push(`<button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'confirmed')">Xác nhận đơn hàng</button>`);
        buttons.push(`<button class="btn btn-danger" onclick="updateOrderStatus('${order.id}', 'cancelled')">Từ chối đơn hàng</button>`);
        break;
      case 'confirmed':
        buttons.push(`<button class="btn btn-primary" onclick="updateOrderStatus('${order.id}', 'preparing')">Bắt đầu chuẩn bị</button>`);
        break;
      case 'preparing':
        buttons.push(`<button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'ready')">Hoàn thành chuẩn bị</button>`);
        break;
      case 'ready':
        if (order.deliveryMethod === 'delivery') {
          buttons.push(`<button class="btn btn-info" onclick="updateOrderStatus('${order.id}', 'delivering')">Bắt đầu giao hàng</button>`);
        } else {
          buttons.push(`<button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'completed')">Khách đã nhận</button>`);
        }
        break;
      case 'delivering':
        buttons.push(`<button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'completed')">Đã giao thành công</button>`);
        break;
    }

    buttons.push(`<button class="btn btn-secondary" onclick="closeModal()">Đóng</button>`);
    
    return buttons.join(' ');
  }

  // Close modal
  closeModal() {
    const modal = document.getElementById('order-modal');
    modal.classList.remove('show');
    this.currentOrderModal = null;
  }
}

// Global functions for HTML event handlers
function initializeStoreApp() {
  const app = new StoreApp();
  app.initialize();
  window.storeApp = app;
}

function filterOrders() {
  const statusFilter = document.getElementById('status-filter');
  const timeFilter = document.getElementById('time-filter');
  const orderSearch = document.getElementById('order-search');

  storeOrders.setFilters({
    status: statusFilter.value,
    time: timeFilter.value,
    search: orderSearch.value
  });
}

function sortOrders() {
  const sortOptions = document.getElementById('sort-options');
  storeOrders.setSortOrder(sortOptions.value);
}

function refreshOrders() {
  storeOrders.refreshOrders();
}

function updateOrderStatus(orderId, newStatus) {
  storeOrders.updateOrderStatus(orderId, newStatus);
  
  // Close modal if it's open for this order
  if (window.storeApp && window.storeApp.currentOrderModal === orderId) {
    window.storeApp.closeModal();
  }
}

function showOrderDetails(orderId) {
  if (window.storeApp) {
    window.storeApp.showOrderDetails(orderId);
  }
}

function closeModal() {
  if (window.storeApp) {
    window.storeApp.closeModal();
  }
}

function exportOrders() {
  storeOrders.exportOrders();
}

function logout() {
  if (confirm('Bạn có chắc muốn đăng xuất?')) {
    // Save preferences before logout
    if (window.storeApp) {
      window.storeApp.savePreferences();
    }
    
    storeAuth.logout();
  }
}

// Add CSS for order details modal
if (!document.querySelector('#order-details-styles')) {
  const styles = document.createElement('style');
  styles.id = 'order-details-styles';
  styles.textContent = `
    .order-details {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .order-summary {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }
    
    .summary-row:last-child {
      border-bottom: none;
    }
    
    .summary-row.priority {
      color: #e74c3c;
      font-weight: 600;
    }
    
    .status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
    }
    
    .customer-details, .order-products, .order-notes {
      margin-bottom: 20px;
    }
    
    .customer-details h3, .order-products h3, .order-notes h3 {
      margin-bottom: 12px;
      color: #2c3e50;
      font-size: 1.1rem;
    }
    
    .customer-info p {
      margin: 8px 0;
      color: #5a6c7d;
    }
    
    .order-product {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid #f1f3f4;
    }
    
    .order-product:last-child {
      border-bottom: none;
    }
    
    .product-info h4 {
      margin: 0 0 4px 0;
      color: #2c3e50;
    }
    
    .product-info p {
      margin: 2px 0;
      color: #7f8c8d;
      font-size: 0.9rem;
    }
    
    .product-options {
      margin-top: 8px;
    }
    
    .product-options ul {
      margin: 4px 0 0 0;
      padding-left: 16px;
    }
    
    .product-options li {
      color: #7f8c8d;
      font-size: 0.85rem;
      margin: 2px 0;
    }
    
    .product-price {
      font-weight: 600;
      color: #27ae60;
      font-size: 1rem;
    }
    
    .order-total {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 2px solid #e9ecef;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    .total-amount {
      color: #27ae60;
    }
    
    .order-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .order-actions .btn {
      flex: 1;
      min-width: 120px;
    }
    
    .btn-success { background: #27ae60; color: white; }
    .btn-danger { background: #e74c3c; color: white; }
    .btn-primary { background: #3498db; color: white; }
    .btn-info { background: #17a2b8; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
    
    .btn-success:hover { background: #229954; }
    .btn-danger:hover { background: #c82333; }
    .btn-primary:hover { background: #217dbb; }
    .btn-info:hover { background: #138496; }
    .btn-secondary:hover { background: #545b62; }
    
    @media (max-width: 768px) {
      .order-actions {
        flex-direction: column;
      }
      
      .order-actions .btn {
        min-width: auto;
      }
      
      .summary-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      
      .order-product {
        flex-direction: column;
        gap: 8px;
      }
    }
  `;
  document.head.appendChild(styles);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Auto-initialize if already authenticated
  if (storeAuth.checkAuth()) {
    initializeStoreApp();
  }
});