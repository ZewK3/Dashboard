// Notifications Utility Class
class NotificationManager {
  constructor() {
    this.container = null;
    this.notifications = new Map();
    this.defaultDuration = APP_CONFIG.UI.NOTIFICATION_DURATION;
    this.maxNotifications = 5;
    this.init();
  }

  init() {
    this.createContainer();
    console.log('Notification Manager initialized');
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = null, options = {}) {
    const id = this.generateId();
    const notification = this.createNotification(id, message, type, duration, options);
    
    // Remove oldest notification if we have too many
    if (this.notifications.size >= this.maxNotifications) {
      this.removeOldest();
    }
    
    this.container.appendChild(notification.element);
    this.notifications.set(id, notification);
    
    // Trigger animation
    requestAnimationFrame(() => {
      notification.element.classList.add('show');
    });
    
    // Auto remove if duration is set
    if (notification.duration > 0) {
      notification.timeout = setTimeout(() => {
        this.remove(id);
      }, notification.duration);
    }
    
    return id;
  }

  createNotification(id, message, type, duration, options) {
    const element = document.createElement('div');
    element.className = `notification ${type}`;
    element.setAttribute('role', 'alert');
    element.setAttribute('data-notification-id', id);
    
    const icon = this.getIcon(type);
    const title = options.title || this.getTitle(type);
    
    element.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          <i class="${icon}"></i>
        </div>
        <div class="notification-body">
          ${title ? `<div class="notification-title">${title}</div>` : ''}
          <div class="notification-message">${message}</div>
        </div>
      </div>
      ${!options.persistent ? '<button class="notification-close" aria-label="Đóng"><i class="fas fa-times"></i></button>' : ''}
    `;
    
    // Add click handlers
    const closeBtn = element.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.remove(id));
    }
    
    // Add click handler for the entire notification if specified
    if (options.onClick) {
      element.style.cursor = 'pointer';
      element.addEventListener('click', (e) => {
        if (!e.target.closest('.notification-close')) {
          options.onClick(id);
        }
      });
    }
    
    return {
      id,
      element,
      type,
      message,
      duration: duration !== null ? duration : (options.persistent ? 0 : this.defaultDuration),
      timeout: null,
      createdAt: Date.now()
    };
  }

  remove(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;
    
    // Clear timeout
    if (notification.timeout) {
      clearTimeout(notification.timeout);
    }
    
    // Animate out
    notification.element.classList.remove('show');
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
      this.notifications.delete(id);
    }, 300);
  }

  removeOldest() {
    if (this.notifications.size === 0) return;
    
    let oldest = null;
    let oldestTime = Date.now();
    
    for (const notification of this.notifications.values()) {
      if (notification.createdAt < oldestTime) {
        oldest = notification;
        oldestTime = notification.createdAt;
      }
    }
    
    if (oldest) {
      this.remove(oldest.id);
    }
  }

  clear() {
    for (const id of this.notifications.keys()) {
      this.remove(id);
    }
  }

  update(id, message, type = null) {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    const messageElement = notification.element.querySelector('.notification-message');
    if (messageElement) {
      messageElement.textContent = message;
    }
    
    if (type && type !== notification.type) {
      notification.element.className = `notification ${type} show`;
      notification.type = type;
      
      const iconElement = notification.element.querySelector('.notification-icon i');
      if (iconElement) {
        iconElement.className = this.getIcon(type);
      }
    }
    
    return true;
  }

  getIcon(type) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    
    return icons[type] || icons.info;
  }

  getTitle(type) {
    const titles = {
      success: 'Thành công',
      error: 'Lỗi',
      warning: 'Cảnh báo',
      info: 'Thông báo'
    };
    
    return titles[type] || '';
  }

  generateId() {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convenience methods
  success(message, duration = null, options = {}) {
    return this.show(message, 'success', duration, options);
  }

  error(message, duration = null, options = {}) {
    return this.show(message, 'error', duration, options);
  }

  warning(message, duration = null, options = {}) {
    return this.show(message, 'warning', duration, options);
  }

  info(message, duration = null, options = {}) {
    return this.show(message, 'info', duration, options);
  }

  // Show persistent notification that requires user action
  persistent(message, type = 'info', options = {}) {
    return this.show(message, type, 0, { ...options, persistent: true });
  }

  // Show notification with action button
  withAction(message, type = 'info', actionText = 'Thao tác', actionCallback = null, options = {}) {
    const notification = this.show(message, type, 0, {
      ...options,
      persistent: true
    });
    
    const notificationElement = this.notifications.get(notification)?.element;
    if (notificationElement && actionCallback) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'notification-action btn btn-sm btn-primary';
      actionBtn.textContent = actionText;
      actionBtn.addEventListener('click', () => {
        actionCallback(notification);
        this.remove(notification);
      });
      
      const body = notificationElement.querySelector('.notification-body');
      if (body) {
        body.appendChild(actionBtn);
      }
    }
    
    return notification;
  }

  // Show loading notification
  loading(message = 'Đang tải...', options = {}) {
    const id = this.show(message, 'info', 0, {
      ...options,
      persistent: true,
      title: ''
    });
    
    const notificationElement = this.notifications.get(id)?.element;
    if (notificationElement) {
      const icon = notificationElement.querySelector('.notification-icon i');
      if (icon) {
        icon.className = 'fas fa-spinner fa-spin';
      }
    }
    
    return id;
  }

  // Show progress notification
  progress(message, progress = 0, options = {}) {
    const id = this.show(message, 'info', 0, {
      ...options,
      persistent: true
    });
    
    const notificationElement = this.notifications.get(id)?.element;
    if (notificationElement) {
      const progressBar = document.createElement('div');
      progressBar.className = 'notification-progress';
      progressBar.innerHTML = `
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <span class="progress-text">${progress}%</span>
      `;
      
      const body = notificationElement.querySelector('.notification-body');
      if (body) {
        body.appendChild(progressBar);
      }
    }
    
    return id;
  }

  updateProgress(id, progress, message = null) {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    const progressFill = notification.element.querySelector('.progress-fill');
    const progressText = notification.element.querySelector('.progress-text');
    
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${progress}%`;
    }
    
    if (message) {
      this.update(id, message);
    }
    
    return true;
  }

  // Show confirmation notification
  confirm(message, onConfirm = null, onCancel = null, options = {}) {
    const id = this.show(message, 'warning', 0, {
      ...options,
      persistent: true,
      title: options.title || 'Xác nhận'
    });
    
    const notificationElement = this.notifications.get(id)?.element;
    if (notificationElement) {
      const actions = document.createElement('div');
      actions.className = 'notification-actions';
      actions.innerHTML = `
        <button class="btn btn-sm btn-primary confirm-btn">Xác nhận</button>
        <button class="btn btn-sm btn-outline cancel-btn">Hủy</button>
      `;
      
      const confirmBtn = actions.querySelector('.confirm-btn');
      const cancelBtn = actions.querySelector('.cancel-btn');
      
      confirmBtn.addEventListener('click', () => {
        if (onConfirm) onConfirm();
        this.remove(id);
      });
      
      cancelBtn.addEventListener('click', () => {
        if (onCancel) onCancel();
        this.remove(id);
      });
      
      const body = notificationElement.querySelector('.notification-body');
      if (body) {
        body.appendChild(actions);
      }
    }
    
    return id;
  }

  // Handle API errors with appropriate messages
  handleApiError(error, context = '') {
    let message = error.message || APP_CONFIG.ERRORS.UNKNOWN;
    
    // Add context if provided
    if (context) {
      message = `${context}: ${message}`;
    }
    
    return this.error(message, 5000);
  }

  // Show offline notification
  showOffline() {
    return this.persistent(
      'Bạn đang offline. Một số tính năng có thể không khả dụng.',
      'warning',
      { title: 'Không có kết nối' }
    );
  }

  // Show online notification
  showOnline() {
    return this.success(
      'Kết nối đã được khôi phục!',
      3000
    );
  }
}

// Create global notifications instance
const Notifications = new NotificationManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationManager;
}