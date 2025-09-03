// Store Notifications Module
class StoreNotifications {
  constructor() {
    this.notifications = [];
    this.isOpen = false;
    this.unreadCount = 0;
    
    // Generate some initial notifications
    this.generateInitialNotifications();
  }

  // Generate initial notifications for demo
  generateInitialNotifications() {
    const initialNotifications = [
      {
        id: 'notif_1',
        title: 'Chào mừng!',
        message: 'Bạn đã đăng nhập thành công vào hệ thống quản lý cửa hàng',
        type: 'welcome',
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'notif_2',
        title: 'Cập nhật hệ thống',
        message: 'Hệ thống đã được cập nhật với các tính năng mới',
        type: 'system',
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      }
    ];

    this.notifications = initialNotifications;
    this.updateUnreadCount();
  }

  // Add new notification
  addNotification(notification) {
    const newNotification = {
      id: `notif_${Date.now()}`,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      isRead: false,
      createdAt: new Date().toISOString(),
      orderId: notification.orderId || null,
      ...notification
    };

    this.notifications.unshift(newNotification);
    this.updateUnreadCount();
    this.renderNotifications();

    // Show browser notification if permission granted
    this.showBrowserNotification(newNotification);

    // Play notification sound
    this.playNotificationSound();
  }

  // Update unread count
  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    this.updateBadge();
  }

  // Update notification badge
  updateBadge() {
    const badge = document.getElementById('notification-count');
    if (badge) {
      badge.textContent = this.unreadCount;
      badge.style.display = this.unreadCount > 0 ? 'block' : 'none';
    }
  }

  // Toggle notification panel
  togglePanel() {
    this.isOpen = !this.isOpen;
    const panel = document.getElementById('notification-panel');
    
    if (this.isOpen) {
      panel.classList.add('show');
      this.renderNotifications();
      this.markAllAsRead();
    } else {
      panel.classList.remove('show');
    }
  }

  // Render notifications
  renderNotifications() {
    const notificationList = document.getElementById('notification-list');
    
    if (this.notifications.length === 0) {
      notificationList.innerHTML = `
        <div class="empty-notifications">
          <i class="fas fa-bell-slash"></i>
          <p>Không có thông báo nào</p>
        </div>
      `;
      return;
    }

    notificationList.innerHTML = this.notifications.map(notification => 
      this.renderNotificationItem(notification)
    ).join('');
  }

  // Render individual notification item
  renderNotificationItem(notification) {
    const timeText = this.formatTime(notification.createdAt);
    const unreadClass = notification.isRead ? '' : 'unread';
    const iconClass = this.getNotificationIcon(notification.type);

    return `
      <div class="notification-item ${unreadClass}" onclick="handleNotificationClick('${notification.id}')">
        <div class="notification-icon">
          <i class="fas fa-${iconClass}"></i>
        </div>
        <div class="notification-content">
          <h4>${notification.title}</h4>
          <p>${notification.message}</p>
          <div class="time">${timeText}</div>
        </div>
        ${!notification.isRead ? '<div class="unread-indicator"></div>' : ''}
      </div>
    `;
  }

  // Get notification icon based on type
  getNotificationIcon(type) {
    const iconMap = {
      'new_order': 'shopping-bag',
      'order_update': 'sync-alt',
      'system': 'cog',
      'welcome': 'hand-paper',
      'warning': 'exclamation-triangle',
      'info': 'info-circle',
      'success': 'check-circle',
      'error': 'times-circle'
    };
    return iconMap[type] || 'bell';
  }

  // Format time for notifications
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
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.updateUnreadCount();
      this.renderNotifications();
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    let hasUnread = false;
    this.notifications.forEach(notification => {
      if (!notification.isRead) {
        notification.isRead = true;
        hasUnread = true;
      }
    });

    if (hasUnread) {
      this.updateUnreadCount();
      this.renderNotifications();
    }
  }

  // Handle notification click
  handleNotificationClick(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification) return;

    // Mark as read
    this.markAsRead(notificationId);

    // Handle different notification types
    switch (notification.type) {
      case 'new_order':
      case 'order_update':
        if (notification.orderId) {
          // Close notification panel
          this.togglePanel();
          // Show order details
          showOrderDetails(notification.orderId);
        }
        break;
      case 'system':
        // Could open settings or system info
        showNotification('Thông báo hệ thống đã được xem', 'info');
        break;
      default:
        // Default action - just mark as read
        break;
    }
  }

  // Show browser notification
  showBrowserNotification(notification) {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id
      });

      browserNotification.onclick = () => {
        window.focus();
        this.handleNotificationClick(notification.id);
        browserNotification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showBrowserNotification(notification);
        }
      });
    }
  }

  // Play notification sound
  playNotificationSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCy2Xy/PVii0HG2/A7+OZURE=');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (browser policy)
      });
    } catch (error) {
      // Ignore audio errors
    }
  }

  // Clear all notifications
  clearAll() {
    if (confirm('Bạn có chắc muốn xóa tất cả thông báo?')) {
      this.notifications = [];
      this.updateUnreadCount();
      this.renderNotifications();
      showNotification('Đã xóa tất cả thông báo', 'success');
    }
  }

  // Get notifications for specific order
  getOrderNotifications(orderId) {
    return this.notifications.filter(n => n.orderId === orderId);
  }

  // Remove old notifications (keep last 50)
  cleanupOldNotifications() {
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
      this.updateUnreadCount();
    }
  }

  // Simulate real-time notifications (for demo)
  startSimulation() {
    // Simulate new orders every 2-5 minutes
    setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance
        const orderTypes = [
          { title: 'Đơn hàng mới', message: 'Đơn hàng #ORD12345 từ Nguyễn Văn A', type: 'new_order' },
          { title: 'Cập nhật đơn hàng', message: 'Đơn hàng #ORD12344 đã được thanh toán', type: 'order_update' },
          { title: 'Đơn hàng ưu tiên', message: 'Đơn hàng #ORD12346 cần xử lý gấp', type: 'new_order' }
        ];
        
        const randomNotification = orderTypes[Math.floor(Math.random() * orderTypes.length)];
        this.addNotification(randomNotification);
      }
    }, Math.random() * 3 * 60 * 1000 + 2 * 60 * 1000); // 2-5 minutes

    // Cleanup old notifications every hour
    setInterval(() => {
      this.cleanupOldNotifications();
    }, 60 * 60 * 1000); // 1 hour
  }
}

// Initialize store notifications
const storeNotifications = new StoreNotifications();

// Global functions for HTML event handlers
function toggleNotifications() {
  storeNotifications.togglePanel();
}

function handleNotificationClick(notificationId) {
  storeNotifications.handleNotificationClick(notificationId);
}

function clearAllNotifications() {
  storeNotifications.clearAll();
}

// Request notification permission on load
document.addEventListener('DOMContentLoaded', function() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // Start notification simulation
  if (typeof storeNotifications !== 'undefined') {
    storeNotifications.startSimulation();
  }
});

// Add CSS for notifications if not already present
if (!document.querySelector('#notification-panel-styles')) {
  const styles = document.createElement('style');
  styles.id = 'notification-panel-styles';
  styles.textContent = `
    .empty-notifications {
      text-align: center;
      padding: 40px 20px;
      color: #7f8c8d;
    }
    
    .empty-notifications i {
      font-size: 2rem;
      margin-bottom: 12px;
      color: #bdc3c7;
    }
    
    .notification-item {
      position: relative;
      transition: all 0.3s ease;
    }
    
    .notification-item.unread {
      background: #e3f2fd !important;
      border-left-color: #3498db !important;
    }
    
    .notification-item .notification-icon {
      position: absolute;
      top: 16px;
      left: 16px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #3498db;
    }
    
    .notification-item .notification-content {
      margin-left: 56px;
    }
    
    .notification-item .unread-indicator {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3498db;
    }
    
    .notification-item:hover .notification-icon {
      background: #3498db;
      color: white;
    }
  `;
  document.head.appendChild(styles);
}