// Store Orders Management Module
class StoreOrders {
  constructor() {
    this.orders = [];
    this.filteredOrders = [];
    this.currentFilters = {
      status: 'pending',
      time: 'today',
      search: ''
    };
    this.sortBy = 'newest';
    this.selectedOrder = null;
    
    // Initialize sample orders
    this.generateSampleOrders();
  }

  // Generate sample orders for demo
  generateSampleOrders() {
    const currentStore = storeAuth.getCurrentStore();
    if (!currentStore) return;

    const products = [
      { name: 'Trà sữa truyền thống', price: 35000 },
      { name: 'Trà sữa matcha', price: 42000 },
      { name: 'Trà đào cam sả', price: 38000 },
      { name: 'Cà phê sữa đá', price: 32000 },
      { name: 'Sinh tố bơ', price: 45000 },
      { name: 'Trà chanh mật ong', price: 28000 }
    ];

    const customers = [
      { name: 'Nguyễn Văn A', phone: '0901234567', address: '123 Điện Biên Phủ, Q.1' },
      { name: 'Trần Thị B', phone: '0987654321', address: '456 Lê Lợi, Q.3' },
      { name: 'Lê Hoang C', phone: '0912345678', address: '789 Nguyễn Huệ, Q.1' },
      { name: 'Phạm Thị D', phone: '0934567890', address: '321 Pasteur, Q.3' },
      { name: 'Hoàng Văn E', phone: '0945678901', address: '654 Hai Bà Trưng, Q.1' }
    ];

    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed'];
    
    this.orders = [];
    
    // Generate orders for today
    for (let i = 0; i < 25; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const orderProducts = [];
      const numProducts = Math.floor(Math.random() * 3) + 1;
      
      let total = 0;
      for (let j = 0; j < numProducts; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const productTotal = product.price * quantity;
        total += productTotal;
        
        orderProducts.push({
          ...product,
          quantity,
          total: productTotal,
          options: {
            size: ['M', 'L'][Math.floor(Math.random() * 2)],
            sugar: ['Ít đường', 'Vừa đường', 'Nhiều đường'][Math.floor(Math.random() * 3)],
            ice: ['Ít đá', 'Vừa đá', 'Nhiều đá'][Math.floor(Math.random() * 3)],
            toppings: Math.random() > 0.5 ? ['Trân châu', 'Thạch dừa'][Math.floor(Math.random() * 2)] : null
          }
        });
      }

      const now = new Date();
      const orderTime = new Date(now.getTime() - Math.random() * 12 * 60 * 60 * 1000); // Within last 12 hours
      
      const order = {
        id: `ORD${String(Date.now() + i).slice(-8)}`,
        storeCode: currentStore.code,
        customer: customer,
        products: orderProducts,
        total: total,
        status: i < 8 ? 'pending' : statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: orderTime.toISOString(),
        updatedAt: orderTime.toISOString(),
        deliveryAddress: customer.address,
        deliveryMethod: Math.random() > 0.3 ? 'delivery' : 'pickup',
        paymentMethod: Math.random() > 0.5 ? 'qr' : 'cash',
        paymentStatus: Math.random() > 0.2 ? 'paid' : 'pending',
        notes: Math.random() > 0.7 ? 'Giao hàng nhanh, không gọi chuông' : '',
        estimatedTime: 30,
        priority: Math.random() > 0.9 ? 'high' : 'normal'
      };

      this.orders.push(order);
    }

    // Generate some orders for yesterday
    for (let i = 0; i < 15; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const orderProducts = [];
      const numProducts = Math.floor(Math.random() * 3) + 1;
      
      let total = 0;
      for (let j = 0; j < numProducts; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const productTotal = product.price * quantity;
        total += productTotal;
        
        orderProducts.push({
          ...product,
          quantity,
          total: productTotal
        });
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const orderTime = new Date(yesterday.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      
      const order = {
        id: `ORD${String(Date.now() + i + 1000).slice(-8)}`,
        storeCode: currentStore.code,
        customer: customer,
        products: orderProducts,
        total: total,
        status: ['completed', 'cancelled'][Math.floor(Math.random() * 2)],
        createdAt: orderTime.toISOString(),
        updatedAt: orderTime.toISOString(),
        deliveryAddress: customer.address,
        deliveryMethod: Math.random() > 0.3 ? 'delivery' : 'pickup',
        paymentMethod: Math.random() > 0.5 ? 'qr' : 'cash',
        paymentStatus: 'paid',
        notes: '',
        estimatedTime: 30,
        priority: 'normal'
      };

      this.orders.push(order);
    }

    // Sort by newest first
    this.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply initial filters
    this.applyFilters();
  }

  // Get orders with filters
  applyFilters() {
    let filtered = [...this.orders];

    // Filter by status
    if (this.currentFilters.status) {
      filtered = filtered.filter(order => order.status === this.currentFilters.status);
    }

    // Filter by time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (this.currentFilters.time) {
      case 'today':
        filtered = filtered.filter(order => new Date(order.createdAt) >= today);
        break;
      case 'yesterday':
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= yesterday && orderDate < today;
        });
        break;
      case 'week':
        filtered = filtered.filter(order => new Date(order.createdAt) >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(order => new Date(order.createdAt) >= monthAgo);
        break;
    }

    // Filter by search
    if (this.currentFilters.search) {
      const search = this.currentFilters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(search) ||
        order.customer.name.toLowerCase().includes(search) ||
        order.customer.phone.includes(search)
      );
    }

    // Sort orders
    switch (this.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'priority':
        filtered.sort((a, b) => {
          if (a.priority === 'high' && b.priority !== 'high') return -1;
          if (a.priority !== 'high' && b.priority === 'high') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        break;
      case 'amount':
        filtered.sort((a, b) => b.total - a.total);
        break;
    }

    this.filteredOrders = filtered;
    this.renderOrders();
    this.updateStats();
  }

  // Render orders list
  renderOrders() {
    const ordersList = document.getElementById('orders-list');
    const emptyState = document.getElementById('empty-state');

    if (this.filteredOrders.length === 0) {
      ordersList.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    ordersList.style.display = 'block';
    emptyState.style.display = 'none';

    ordersList.innerHTML = this.filteredOrders.map(order => this.renderOrderItem(order)).join('');
  }

  // Render individual order item
  renderOrderItem(order) {
    const statusClass = `status-${order.status}`;
    const statusText = this.getStatusText(order.status);
    const timeText = this.formatTime(order.createdAt);
    const totalText = this.formatCurrency(order.total);
    const itemsCount = order.products.reduce((sum, p) => sum + p.quantity, 0);
    
    const actionButtons = this.getActionButtons(order);

    return `
      <div class="order-item" onclick="showOrderDetails('${order.id}')">
        <div class="order-header">
          <div class="order-id">#${order.id}</div>
          <div class="order-time">${timeText}</div>
          <div class="order-status ${statusClass}">${statusText}</div>
        </div>
        <div class="order-info">
          <div class="customer-info">
            <h4>${order.customer.name}</h4>
            <p><i class="fas fa-phone"></i> ${order.customer.phone}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${order.deliveryAddress}</p>
            ${order.priority === 'high' ? '<p><i class="fas fa-exclamation-triangle"></i> <strong>Ưu tiên cao</strong></p>' : ''}
          </div>
          <div class="order-total">
            <div class="amount">${totalText}</div>
            <div class="items">${itemsCount} món</div>
            <div class="payment">
              <i class="fas fa-${order.paymentMethod === 'qr' ? 'qrcode' : 'money-bill-wave'}"></i>
              ${order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </div>
          </div>
          <div class="order-actions" onclick="event.stopPropagation()">
            ${actionButtons}
          </div>
        </div>
      </div>
    `;
  }

  // Get status text
  getStatusText(status) {
    const statusMap = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'preparing': 'Đang chuẩn bị',
      'ready': 'Sẵn sàng',
      'delivering': 'Đang giao',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  }

  // Get action buttons based on order status
  getActionButtons(order) {
    switch (order.status) {
      case 'pending':
        return `
          <button class="action-btn btn-accept" onclick="updateOrderStatus('${order.id}', 'confirmed')">
            <i class="fas fa-check"></i> Xác nhận
          </button>
          <button class="action-btn btn-reject" onclick="updateOrderStatus('${order.id}', 'cancelled')">
            <i class="fas fa-times"></i> Từ chối
          </button>
        `;
      case 'confirmed':
        return `
          <button class="action-btn btn-accept" onclick="updateOrderStatus('${order.id}', 'preparing')">
            <i class="fas fa-play"></i> Bắt đầu
          </button>
        `;
      case 'preparing':
        return `
          <button class="action-btn btn-accept" onclick="updateOrderStatus('${order.id}', 'ready')">
            <i class="fas fa-check-circle"></i> Hoàn thành
          </button>
        `;
      case 'ready':
        return `
          <button class="action-btn btn-accept" onclick="updateOrderStatus('${order.id}', 'delivering')">
            <i class="fas fa-shipping-fast"></i> Giao hàng
          </button>
        `;
      case 'delivering':
        return `
          <button class="action-btn btn-accept" onclick="updateOrderStatus('${order.id}', 'completed')">
            <i class="fas fa-flag-checkered"></i> Đã giao
          </button>
        `;
      default:
        return `
          <button class="action-btn btn-view" onclick="showOrderDetails('${order.id}')">
            <i class="fas fa-eye"></i> Xem
          </button>
        `;
    }
  }

  // Format time
  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  // Update order status
  updateOrderStatus(orderId, newStatus) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();

    // Show notification
    const statusText = this.getStatusText(newStatus);
    showNotification(`Đơn hàng #${orderId} đã được cập nhật: ${statusText}`, 'success');

    // Re-render
    this.applyFilters();

    // Create notification
    storeNotifications.addNotification({
      title: 'Cập nhật đơn hàng',
      message: `Đơn hàng #${orderId} đã chuyển sang trạng thái: ${statusText}`,
      type: 'order_update',
      orderId: orderId
    });
  }

  // Update stats
  updateStats() {
    const pendingCount = this.orders.filter(o => o.status === 'pending').length;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const completedToday = this.orders.filter(o => 
      o.status === 'completed' && new Date(o.updatedAt) >= todayStart
    ).length;

    document.getElementById('pending-orders').textContent = pendingCount;
    document.getElementById('completed-today').textContent = completedToday;
  }

  // Get order by ID
  getOrder(orderId) {
    return this.orders.find(o => o.id === orderId);
  }

  // Set filters
  setFilters(filters) {
    this.currentFilters = { ...this.currentFilters, ...filters };
    this.applyFilters();
  }

  // Set sort order
  setSortOrder(sortBy) {
    this.sortBy = sortBy;
    this.applyFilters();
  }

  // Refresh orders (simulate API call)
  async refreshOrders() {
    try {
      // Show loading state
      document.querySelector('.refresh-btn i').classList.add('fa-spin');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would fetch from API
      // For demo, we'll just re-generate some new pending orders
      const currentStore = storeAuth.getCurrentStore();
      if (currentStore && Math.random() > 0.7) {
        // 30% chance of new order
        this.generateNewOrder();
      }
      
      this.applyFilters();
      showNotification('Đã cập nhật danh sách đơn hàng', 'success');
      
    } catch (error) {
      showNotification('Lỗi khi cập nhật đơn hàng', 'error');
    } finally {
      // Remove loading state
      document.querySelector('.refresh-btn i').classList.remove('fa-spin');
    }
  }

  // Generate a new order (simulate new incoming order)
  generateNewOrder() {
    const customers = [
      { name: 'Khách hàng mới', phone: '0901234567', address: '123 Điện Biên Phủ, Q.1' }
    ];
    
    const products = [
      { name: 'Trà sữa truyền thống', price: 35000, quantity: 1, total: 35000 }
    ];

    const customer = customers[0];
    const total = products.reduce((sum, p) => sum + p.total, 0);

    const order = {
      id: `ORD${String(Date.now()).slice(-8)}`,
      storeCode: storeAuth.getCurrentStore().code,
      customer: customer,
      products: products,
      total: total,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deliveryAddress: customer.address,
      deliveryMethod: 'delivery',
      paymentMethod: 'qr',
      paymentStatus: 'paid',
      notes: '',
      estimatedTime: 30,
      priority: 'high'
    };

    this.orders.unshift(order);

    // Create notification
    storeNotifications.addNotification({
      title: 'Đơn hàng mới',
      message: `Đơn hàng #${order.id} từ ${customer.name}`,
      type: 'new_order',
      orderId: order.id
    });
  }

  // Export orders
  exportOrders() {
    const data = this.filteredOrders.map(order => ({
      'Mã đơn': order.id,
      'Khách hàng': order.customer.name,
      'Điện thoại': order.customer.phone,
      'Địa chỉ': order.deliveryAddress,
      'Tổng tiền': order.total,
      'Trạng thái': this.getStatusText(order.status),
      'Thời gian': new Date(order.createdAt).toLocaleString('vi-VN'),
      'Thanh toán': order.paymentMethod === 'qr' ? 'QR Code' : 'Tiền mặt'
    }));

    const csv = this.convertToCSV(data);
    this.downloadCSV(csv, `orders_${new Date().toISOString().slice(0, 10)}.csv`);
    
    showNotification('Đã xuất báo cáo đơn hàng', 'success');
  }

  // Convert to CSV
  convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(field => `"${row[field]}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }

  // Download CSV
  downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Initialize store orders
const storeOrders = new StoreOrders();