// Cart Management Class
class CartManager {
  constructor() {
    this.items = [];
    this.isVisible = false;
    this.currentTab = 'cart';
    this.listeners = new Set();
    this.init();
  }

  init() {
    this.loadFromStorage();
    this.setupEventListeners();
    console.log('Cart Manager initialized');
  }

  setupEventListeners() {
    // Listen for storage changes from other tabs
    Storage.addListener(APP_CONFIG.STORAGE.CART, (newValue, oldValue) => {
      if (newValue !== null) {
        this.items = Array.isArray(newValue) ? newValue : [];
        this.updateDisplay();
        this.notifyListeners('storage_update', this.items);
      }
    });

    // Listen for auth changes
    Storage.addListener(APP_CONFIG.STORAGE.TOKEN, (token) => {
      if (!token) {
        // User logged out, clear cart
        this.clear();
      }
    });
  }

  loadFromStorage() {
    const stored = Storage.getArray(APP_CONFIG.STORAGE.CART, []);
    this.items = this.validateItems(stored);
    this.updateDisplay();
  }

  saveToStorage() {
    Storage.setArray(APP_CONFIG.STORAGE.CART, this.items);
  }

  validateItems(items) {
    return items.filter(item => {
      return item && 
             item.id && 
             item.name && 
             typeof item.price === 'number' && 
             typeof item.quantity === 'number' && 
             item.quantity > 0;
    });
  }

  addItem(product, options = {}) {
    const {
      size = 'M',
      toppings = [],
      sugar = '100%',
      ice = 'Thường',
      quantity = 1,
      note = ''
    } = options;

    // Create cart item
    const cartItem = {
      id: this.generateItemId(product, options),
      productId: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.image,
      size,
      toppings: Array.isArray(toppings) ? toppings : [],
      sugar,
      ice,
      quantity: Math.max(1, parseInt(quantity)),
      note: note.trim(),
      addedAt: Date.now()
    };

    // Calculate total price including toppings
    cartItem.totalPrice = this.calculateItemTotal(cartItem);

    // Check if similar item exists
    const existingIndex = this.findSimilarItem(cartItem);
    
    if (existingIndex !== -1) {
      // Update existing item quantity
      this.items[existingIndex].quantity += cartItem.quantity;
      this.items[existingIndex].totalPrice = this.calculateItemTotal(this.items[existingIndex]);
    } else {
      // Add new item
      this.items.push(cartItem);
    }

    this.saveToStorage();
    this.updateDisplay();
    this.notifyListeners('item_added', cartItem);

    return cartItem;
  }

  generateItemId(product, options) {
    const components = [
      product.id,
      options.size || 'M',
      options.sugar || '100%',
      options.ice || 'Thường',
      JSON.stringify(options.toppings || []),
      (options.note || '').trim()
    ];
    
    return btoa(components.join('|')).replace(/[+/=]/g, '');
  }

  findSimilarItem(newItem) {
    return this.items.findIndex(item => 
      item.productId === newItem.productId &&
      item.size === newItem.size &&
      item.sugar === newItem.sugar &&
      item.ice === newItem.ice &&
      item.note === newItem.note &&
      JSON.stringify(item.toppings) === JSON.stringify(newItem.toppings)
    );
  }

  calculateItemTotal(item) {
    let total = item.price;
    
    // Add topping prices
    if (item.toppings && Array.isArray(item.toppings)) {
      total += item.toppings.reduce((sum, topping) => {
        return sum + (topping.price || 0);
      }, 0);
    }
    
    // Size adjustment
    if (item.size === 'L') {
      total += 5000; // 5k VND for Large size
    }
    
    return total * item.quantity;
  }

  updateItem(itemId, updates) {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index === -1) return false;

    const item = this.items[index];
    
    // Update properties
    Object.assign(item, updates);
    
    // Ensure quantity is valid
    item.quantity = Math.max(1, parseInt(item.quantity));
    
    // Recalculate total
    item.totalPrice = this.calculateItemTotal(item);
    
    this.saveToStorage();
    this.updateDisplay();
    this.notifyListeners('item_updated', item);
    
    return true;
  }

  removeItem(itemId) {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index === -1) return false;

    const removedItem = this.items.splice(index, 1)[0];
    
    this.saveToStorage();
    this.updateDisplay();
    this.notifyListeners('item_removed', removedItem);
    
    return true;
  }

  clear() {
    const oldItems = [...this.items];
    this.items = [];
    
    this.saveToStorage();
    this.updateDisplay();
    this.notifyListeners('cart_cleared', oldItems);
  }

  getItems() {
    return [...this.items];
  }

  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalPrice() {
    return this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  isEmpty() {
    return this.items.length === 0;
  }

  updateDisplay() {
    this.updateCartCounts();
    
    if (this.isVisible) {
      this.renderCartItems();
      this.updateCartTotal();
    }
  }

  updateCartCounts() {
    const count = this.getItemCount();
    
    // Update all cart count displays
    document.querySelectorAll('#cart-count, #cart-count-sidebar').forEach(element => {
      element.textContent = count;
      element.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  show() {
    this.isVisible = true;
    this.currentTab = 'cart';
    this.renderModal();
    this.notifyListeners('cart_opened');
  }

  hide() {
    this.isVisible = false;
    Modals.closeAll();
    this.notifyListeners('cart_closed');
  }

  renderModal() {
    const modal = Modals.create('cart-modal', 'Giỏ hàng', '', {
      size: 'large',
      showFooter: false
    });

    modal.body.innerHTML = `
      <div class="cart-tabs">
        <button class="cart-tab ${this.currentTab === 'cart' ? 'active' : ''}" onclick="Cart.showTab('cart')">
          <i class="fas fa-shopping-cart"></i> Giỏ hàng
        </button>
        <button class="cart-tab ${this.currentTab === 'history' ? 'active' : ''}" onclick="Cart.showTab('history')">
          <i class="fas fa-history"></i> Lịch sử đơn hàng
        </button>
      </div>
      
      <div id="cart-content" class="cart-content">
        ${this.currentTab === 'cart' ? this.renderCartContent() : this.renderHistoryContent()}
      </div>
    `;

    modal.show();
  }

  showTab(tab) {
    this.currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.cart-tab').forEach(btn => {
      btn.classList.remove('active');
    });
    
    document.querySelector(`.cart-tab:nth-child(${tab === 'cart' ? '1' : '2'})`).classList.add('active');
    
    // Update content
    const content = document.getElementById('cart-content');
    if (content) {
      content.innerHTML = tab === 'cart' ? this.renderCartContent() : this.renderHistoryContent();
    }
  }

  renderCartContent() {
    if (this.isEmpty()) {
      return `
        <div class="empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <h3>Giỏ hàng trống</h3>
          <p>Hãy thêm một số sản phẩm vào giỏ hàng của bạn!</p>
          <button class="btn btn-primary" onclick="Cart.hide()">
            <i class="fas fa-arrow-left"></i> Tiếp tục mua sắm
          </button>
        </div>
      `;
    }

    return `
      <div class="cart-items">
        ${this.items.map(item => this.renderCartItem(item)).join('')}
      </div>
      
      <div class="cart-summary">
        <div class="cart-total">
          <span>Tổng cộng:</span>
          <span class="total-amount">${this.formatPrice(this.getTotalPrice())}</span>
        </div>
        
        <div class="cart-actions">
          <button class="btn btn-outline" onclick="Cart.clear()">
            <i class="fas fa-trash"></i> Xóa tất cả
          </button>
          <button class="btn btn-primary" onclick="Cart.checkout()">
            <i class="fas fa-credit-card"></i> Đặt hàng
          </button>
        </div>
      </div>
    `;
  }

  renderCartItem(item) {
    const isSimpleProduct = item.category === 'Món thêm' || item.category === 'Kem';
    
    return `
      <div class="cart-item" data-item-id="${item.id}">
        <div class="cart-item-image">
          <img src="${item.image || APP_CONFIG.PRODUCT.DEFAULT_IMAGE}" 
               alt="${item.name}" 
               onerror="this.src='${APP_CONFIG.PRODUCT.DEFAULT_IMAGE}'">
        </div>
        
        <div class="cart-item-info">
          <h4 class="cart-item-name">${item.name}</h4>
          
          ${!isSimpleProduct ? `
            <div class="cart-item-options">
              <span class="cart-item-option">Size: ${item.size}</span>
              <span class="cart-item-option">Đường: ${item.sugar}</span>
              <span class="cart-item-option">Đá: ${item.ice}</span>
              ${item.toppings.length > 0 ? `
                <span class="cart-item-option">Topping: ${item.toppings.map(t => t.name).join(', ')}</span>
              ` : ''}
            </div>
          ` : ''}
          
          ${item.note ? `<div class="cart-item-note">Ghi chú: ${item.note}</div>` : ''}
          
          <div class="cart-item-quantity">
            <button class="btn btn-sm quantity-btn" onclick="Cart.updateQuantity('${item.id}', ${item.quantity - 1})">
              <i class="fas fa-minus"></i>
            </button>
            <input type="number" value="${item.quantity}" min="1" 
                   onchange="Cart.updateQuantity('${item.id}', this.value)"
                   class="quantity-input">
            <button class="btn btn-sm quantity-btn" onclick="Cart.updateQuantity('${item.id}', ${item.quantity + 1})">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          
          <div class="cart-item-price">
            ${this.formatPrice(item.totalPrice)}
          </div>
        </div>
        
        <div class="cart-item-actions">
          <button class="btn btn-sm btn-outline" onclick="Cart.editItem('${item.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline" onclick="Cart.removeItem('${item.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }

  async renderHistoryContent() {
    try {
      const token = Storage.get(APP_CONFIG.STORAGE.TOKEN);
      if (!token) {
        return `
          <div class="auth-required">
            <i class="fas fa-lock"></i>
            <h3>Đăng nhập để xem lịch sử</h3>
            <p>Bạn cần đăng nhập để xem lịch sử đơn hàng của mình.</p>
            <button class="btn btn-primary" onclick="Auth.showLoginModal(false)">
              <i class="fas fa-sign-in-alt"></i> Đăng nhập
            </button>
          </div>
        `;
      }

      // Show loading
      const loadingId = Notifications.loading('Đang tải lịch sử đơn hàng...');
      
      const orders = await API.getOrders(token);
      
      Notifications.remove(loadingId);
      
      if (!orders || orders.length === 0) {
        return `
          <div class="empty-history">
            <i class="fas fa-clipboard-list"></i>
            <h3>Chưa có đơn hàng nào</h3>
            <p>Bạn chưa có đơn hàng nào. Hãy đặt hàng ngay!</p>
          </div>
        `;
      }

      return `
        <div class="order-history">
          ${orders.map(order => this.renderOrderItem(order)).join('')}
        </div>
      `;

    } catch (error) {
      console.error('Error loading order history:', error);
      Notifications.error('Không thể tải lịch sử đơn hàng');
      
      return `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Lỗi tải dữ liệu</h3>
          <p>Không thể tải lịch sử đơn hàng. Vui lòng thử lại!</p>
          <button class="btn btn-primary" onclick="Cart.showTab('history')">
            <i class="fas fa-redo"></i> Thử lại
          </button>
        </div>
      `;
    }
  }

  renderOrderItem(order) {
    const statusClass = order.status || 'pending';
    const statusText = APP_CONFIG.ORDER.STATUSES[statusClass]?.label || order.status;
    
    return `
      <div class="order-item" data-order-id="${order.orderId}">
        <div class="order-header">
          <div class="order-id">
            <strong>#${order.orderId}</strong>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="order-date">
            ${new Date(order.createdAt || order.timestamp).toLocaleDateString('vi-VN')}
          </div>
        </div>
        
        <div class="order-summary">
          <div class="order-total">
            <strong>${this.formatPrice(order.total)}</strong>
          </div>
          <div class="order-items-count">
            ${order.cart?.length || 0} sản phẩm
          </div>
        </div>
        
        <div class="order-actions">
          <button class="btn btn-sm btn-outline" onclick="Cart.viewOrderDetails('${order.orderId}')">
            <i class="fas fa-eye"></i> Chi tiết
          </button>
          ${order.status === 'completed' ? `
            <button class="btn btn-sm btn-primary" onclick="Cart.reorder('${order.orderId}')">
              <i class="fas fa-redo"></i> Đặt lại
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  updateQuantity(itemId, newQuantity) {
    const quantity = Math.max(1, parseInt(newQuantity));
    
    if (this.updateItem(itemId, { quantity })) {
      Notifications.success('Đã cập nhật số lượng!');
    } else {
      Notifications.error('Không thể cập nhật số lượng!');
    }
  }

  editItem(itemId) {
    const item = this.items.find(item => item.id === itemId);
    if (!item) {
      Notifications.error('Không tìm thấy sản phẩm!');
      return;
    }

    const product = Products.getById(item.productId);
    if (!product) {
      Notifications.error('Sản phẩm không còn tồn tại!');
      return;
    }

    // Hide cart modal
    this.hide();
    
    // Show product options modal for editing
    Modals.showProductOptions(product, {
      editMode: true,
      currentItem: item,
      onSave: (updatedItem) => {
        // Remove old item and add updated one
        this.removeItem(itemId);
        this.addItem(product, updatedItem);
        Notifications.success('Đã cập nhật sản phẩm!');
      }
    });
  }

  async checkout() {
    if (this.isEmpty()) {
      Notifications.warning('Giỏ hàng trống!');
      return;
    }

    const token = Storage.get(APP_CONFIG.STORAGE.TOKEN);
    if (!token) {
      Notifications.warning('Vui lòng đăng nhập để đặt hàng!');
      Auth.showLoginModal(false);
      return;
    }

    try {
      // Hide cart modal
      this.hide();
      
      // Show checkout process
      await this.processCheckout();
      
    } catch (error) {
      console.error('Checkout error:', error);
      Notifications.error('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!');
    }
  }

  async processCheckout() {
    // Create pending order
    const order = {
      cart: this.getItems(),
      total: this.getTotalPrice(),
      status: 'pending',
      orderId: `TEMP_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    // Show delivery address selection
    Modals.showDeliveryModal(order, async (orderWithAddress) => {
      try {
        // Show payment modal
        await this.showPaymentModal(orderWithAddress);
        
      } catch (error) {
        console.error('Payment error:', error);
        Notifications.error('Có lỗi xảy ra trong quá trình thanh toán!');
      }
    });
  }

  async showPaymentModal(order) {
    // This will be implemented in the payment component
    if (window.Payment) {
      await Payment.showQRPayment(order);
    } else {
      throw new Error('Payment module not available');
    }
  }

  async viewOrderDetails(orderId) {
    try {
      const token = Storage.get(APP_CONFIG.STORAGE.TOKEN);
      const order = await API.getOrderById(orderId, token);
      
      if (order) {
        Modals.showOrderDetails(order);
      } else {
        Notifications.error('Không tìm thấy chi tiết đơn hàng!');
      }
      
    } catch (error) {
      console.error('Error loading order details:', error);
      Notifications.error('Không thể tải chi tiết đơn hàng!');
    }
  }

  async reorder(orderId) {
    try {
      const token = Storage.get(APP_CONFIG.STORAGE.TOKEN);
      const order = await API.getOrderById(orderId, token);
      
      if (order && order.cart) {
        // Clear current cart
        this.clear();
        
        // Add items from order
        for (const item of order.cart) {
          const product = Products.getById(item.productId);
          if (product) {
            this.addItem(product, {
              size: item.size,
              toppings: item.toppings,
              sugar: item.sugar,
              ice: item.ice,
              quantity: item.quantity,
              note: item.note
            });
          }
        }
        
        Notifications.success('Đã thêm lại các sản phẩm vào giỏ hàng!');
        this.showTab('cart');
        
      } else {
        Notifications.error('Không thể đặt lại đơn hàng này!');
      }
      
    } catch (error) {
      console.error('Error reordering:', error);
      Notifications.error('Không thể đặt lại đơn hàng!');
    }
  }

  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price).replace('₫', ' VNĐ');
  }

  // Event listener management
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in cart listener:', error);
      }
    });
  }

  // Export/import for admin or backup
  export() {
    return {
      items: this.getItems(),
      total: this.getTotalPrice(),
      count: this.getItemCount(),
      timestamp: Date.now()
    };
  }

  import(data) {
    if (data && Array.isArray(data.items)) {
      this.items = this.validateItems(data.items);
      this.saveToStorage();
      this.updateDisplay();
      return true;
    }
    return false;
  }
}

// Create global cart instance
const Cart = new CartManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartManager;
}