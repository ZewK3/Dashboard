// Modal Management System
class ModalManager {
  constructor() {
    this.modals = new Map();
    this.container = null;
    this.activeModal = null;
    this.zIndexCounter = 1050;
    this.init();
  }

  init() {
    this.createContainer();
    this.setupEventListeners();
    console.log('Modal Manager initialized');
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'modal-container';
    this.container.className = 'modal-container';
    document.body.appendChild(this.container);
  }

  setupEventListeners() {
    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal.id);
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal') && this.activeModal) {
        this.close(this.activeModal.id);
      }
    });
  }

  create(id, title, content = '', options = {}) {
    const {
      size = 'medium',
      showHeader = true,
      showFooter = true,
      closable = true,
      backdrop = true,
      keyboard = true,
      className = '',
      onShow = null,
      onHide = null,
      onDestroy = null
    } = options;

    // Create modal structure
    const modal = document.createElement('div');
    modal.className = `modal ${className}`;
    modal.id = `modal-${id}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', `modal-title-${id}`);
    modal.setAttribute('aria-hidden', 'true');
    modal.style.zIndex = this.zIndexCounter++;

    const modalContent = document.createElement('div');
    modalContent.className = `modal-content modal-${size}`;

    // Header
    let header = null;
    if (showHeader) {
      header = document.createElement('div');
      header.className = 'modal-header';
      header.innerHTML = `
        <h3 class="modal-title" id="modal-title-${id}">${title}</h3>
        ${closable ? '<button type="button" class="modal-close" aria-label="Đóng"><i class="fas fa-times"></i></button>' : ''}
      `;
      modalContent.appendChild(header);
    }

    // Body
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.innerHTML = content;
    modalContent.appendChild(body);

    // Footer
    let footer = null;
    if (showFooter) {
      footer = document.createElement('div');
      footer.className = 'modal-footer';
      modalContent.appendChild(footer);
    }

    modal.appendChild(modalContent);

    // Store modal data
    const modalData = {
      id,
      element: modal,
      content: modalContent,
      header,
      body,
      footer,
      title,
      options,
      onShow,
      onHide,
      onDestroy,
      isVisible: false
    };

    this.modals.set(id, modalData);
    this.container.appendChild(modal);

    // Set up close button
    if (closable && header) {
      const closeBtn = header.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close(id));
      }
    }

    // Add modal methods
    modalData.show = () => this.show(id);
    modalData.hide = () => this.close(id);
    modalData.destroy = () => this.destroy(id);
    modalData.setTitle = (newTitle) => this.setTitle(id, newTitle);
    modalData.setContent = (newContent) => this.setContent(id, newContent);

    return modalData;
  }

  show(id) {
    const modal = this.modals.get(id);
    if (!modal) return false;

    // Hide current active modal
    if (this.activeModal && this.activeModal.id !== id) {
      this.hide(this.activeModal.id);
    }

    modal.element.style.display = 'flex';
    modal.element.setAttribute('aria-hidden', 'false');
    modal.isVisible = true;
    this.activeModal = modal;

    // Add body class to prevent scrolling
    document.body.classList.add('modal-open');

    // Trigger animation
    requestAnimationFrame(() => {
      modal.element.classList.add('show');
    });

    // Focus management
    this.setFocus(modal);

    // Trigger callback
    if (modal.onShow) {
      try {
        modal.onShow(modal);
      } catch (error) {
        console.error('Error in modal onShow callback:', error);
      }
    }

    return true;
  }

  hide(id) {
    const modal = this.modals.get(id);
    if (!modal || !modal.isVisible) return false;

    modal.element.classList.remove('show');
    modal.isVisible = false;

    // Wait for animation to complete
    setTimeout(() => {
      modal.element.style.display = 'none';
      modal.element.setAttribute('aria-hidden', 'true');
      
      // Remove body class if no other modals are open
      if (!this.hasVisibleModals()) {
        document.body.classList.remove('modal-open');
      }
    }, 300);

    // Clear active modal
    if (this.activeModal?.id === id) {
      this.activeModal = null;
    }

    // Trigger callback
    if (modal.onHide) {
      try {
        modal.onHide(modal);
      } catch (error) {
        console.error('Error in modal onHide callback:', error);
      }
    }

    return true;
  }

  close(id) {
    return this.hide(id);
  }

  destroy(id) {
    const modal = this.modals.get(id);
    if (!modal) return false;

    // Hide first if visible
    if (modal.isVisible) {
      this.hide(id);
    }

    // Trigger callback
    if (modal.onDestroy) {
      try {
        modal.onDestroy(modal);
      } catch (error) {
        console.error('Error in modal onDestroy callback:', error);
      }
    }

    // Remove from DOM
    if (modal.element.parentNode) {
      modal.element.parentNode.removeChild(modal.element);
    }

    // Remove from map
    this.modals.delete(id);

    return true;
  }

  get(id) {
    return this.modals.get(id);
  }

  isOpen(id) {
    const modal = this.modals.get(id);
    return modal ? modal.isVisible : false;
  }

  closeAll() {
    for (const [id, modal] of this.modals) {
      if (modal.isVisible) {
        this.close(id);
      }
    }
  }

  destroyAll() {
    for (const id of this.modals.keys()) {
      this.destroy(id);
    }
  }

  hasVisibleModals() {
    for (const modal of this.modals.values()) {
      if (modal.isVisible) return true;
    }
    return false;
  }

  setTitle(id, title) {
    const modal = this.modals.get(id);
    if (!modal || !modal.header) return false;

    const titleElement = modal.header.querySelector('.modal-title');
    if (titleElement) {
      titleElement.textContent = title;
      modal.title = title;
      return true;
    }
    return false;
  }

  setContent(id, content) {
    const modal = this.modals.get(id);
    if (!modal) return false;

    modal.body.innerHTML = content;
    return true;
  }

  setFocus(modal) {
    // Focus on first focusable element
    const focusableElements = modal.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  // Predefined modal types
  showAlert(title, message, type = 'info', options = {}) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    const modal = this.create('alert', title, `
      <div class="alert-content alert-${type}">
        <div class="alert-icon">
          <i class="${icons[type] || icons.info}"></i>
        </div>
        <div class="alert-message">
          ${message}
        </div>
      </div>
    `, {
      size: 'small',
      showFooter: true,
      ...options
    });

    modal.footer.innerHTML = `
      <button type="button" class="btn btn-primary" onclick="Modals.close('alert')">
        Đóng
      </button>
    `;

    modal.show();
    return modal;
  }

  showConfirm(title, message, onConfirm = null, onCancel = null, options = {}) {
    const modal = this.create('confirm', title, `
      <div class="confirm-content">
        <div class="confirm-icon">
          <i class="fas fa-question-circle"></i>
        </div>
        <div class="confirm-message">
          ${message}
        </div>
      </div>
    `, {
      size: 'small',
      showFooter: true,
      ...options
    });

    modal.footer.innerHTML = `
      <button type="button" class="btn btn-outline" id="confirm-cancel">
        Hủy
      </button>
      <button type="button" class="btn btn-primary" id="confirm-ok">
        Xác nhận
      </button>
    `;

    // Set up button handlers
    const cancelBtn = modal.footer.querySelector('#confirm-cancel');
    const confirmBtn = modal.footer.querySelector('#confirm-ok');

    cancelBtn.addEventListener('click', () => {
      this.close('confirm');
      if (onCancel) onCancel();
    });

    confirmBtn.addEventListener('click', () => {
      this.close('confirm');
      if (onConfirm) onConfirm();
    });

    modal.show();
    return modal;
  }

  showProductDetails(product) {
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercent = hasDiscount ? 
      Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    const modal = this.create('product-details', product.name, `
      <div class="product-details">
        <div class="product-image-large">
          <img src="${product.image || APP_CONFIG.PRODUCT.DEFAULT_IMAGE}" 
               alt="${product.name}"
               onerror="this.src='${APP_CONFIG.PRODUCT.DEFAULT_IMAGE}'">
          ${product.isNew ? '<div class="product-badge new">Mới</div>' : ''}
          ${product.isHot ? '<div class="product-badge hot">Hot</div>' : ''}
          ${hasDiscount ? `<div class="product-badge sale">-${discountPercent}%</div>` : ''}
        </div>
        
        <div class="product-info-detailed">
          <div class="product-price-large">
            <span class="price-current">${this.formatPrice(product.price)}</span>
            ${hasDiscount ? `<span class="price-original">${this.formatPrice(product.originalPrice)}</span>` : ''}
          </div>
          
          ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
          
          ${product.ingredients && product.ingredients.length > 0 ? `
            <div class="product-ingredients">
              <h4>Thành phần:</h4>
              <p>${product.ingredients.join(', ')}</p>
            </div>
          ` : ''}
          
          ${product.nutritionInfo ? `
            <div class="nutrition-info">
              <h4>Thông tin dinh dưỡng:</h4>
              <div class="nutrition-grid">
                ${product.nutritionInfo.calories ? `<div class="nutrition-item"><span>Calo:</span> ${product.nutritionInfo.calories}</div>` : ''}
                ${product.nutritionInfo.protein ? `<div class="nutrition-item"><span>Protein:</span> ${product.nutritionInfo.protein}g</div>` : ''}
                ${product.nutritionInfo.carbs ? `<div class="nutrition-item"><span>Carbs:</span> ${product.nutritionInfo.carbs}g</div>` : ''}
                ${product.nutritionInfo.fat ? `<div class="nutrition-item"><span>Chất béo:</span> ${product.nutritionInfo.fat}g</div>` : ''}
              </div>
            </div>
          ` : ''}
          
          ${product.rating > 0 ? `
            <div class="product-rating">
              <div class="stars">
                ${this.renderStars(product.rating)}
              </div>
              <span class="rating-text">${product.rating}/5 (${product.reviewCount || 0} đánh giá)</span>
            </div>
          ` : ''}
        </div>
      </div>
    `, {
      size: 'large',
      showFooter: true
    });

    modal.footer.innerHTML = `
      <button type="button" class="btn btn-outline" onclick="Modals.close('product-details')">
        Đóng
      </button>
      <button type="button" class="btn btn-primary" onclick="app.addToCart('${product.id}'); Modals.close('product-details')">
        <i class="fas fa-plus"></i> Thêm vào giỏ
      </button>
    `;

    modal.show();
    return modal;
  }

  showProductOptions(product, options = {}) {
    const { editMode = false, currentItem = null, onSave = null } = options;
    const isSimpleProduct = product.category === 'Món thêm' || product.category === 'Kem';
    
    const modal = this.create('product-options', 
      editMode ? `Chỉnh sửa: ${product.name}` : `Tùy chọn: ${product.name}`, 
      this.renderProductOptionsContent(product, isSimpleProduct, currentItem), 
      {
        size: 'medium',
        showFooter: true
      }
    );

    modal.footer.innerHTML = `
      <button type="button" class="btn btn-outline" onclick="Modals.close('product-options')">
        Hủy
      </button>
      <button type="button" class="btn btn-primary" onclick="Modals.submitProductOptions('${product.id}', ${editMode})">
        <i class="fas fa-${editMode ? 'save' : 'plus'}"></i> ${editMode ? 'Cập nhật' : 'Thêm vào giỏ'}
      </button>
    `;

    modal.product = product;
    modal.editMode = editMode;
    modal.onSave = onSave;

    modal.show();
    return modal;
  }

  renderProductOptionsContent(product, isSimpleProduct, currentItem = null) {
    if (isSimpleProduct) {
      return `
        <div class="simple-product-options">
          <div class="form-group">
            <label class="form-label">Số lượng:</label>
            <div class="quantity-selector">
              <button type="button" class="btn btn-sm" onclick="Modals.adjustQuantity(-1)">
                <i class="fas fa-minus"></i>
              </button>
              <input type="number" id="product-quantity" value="${currentItem?.quantity || 1}" min="1" class="quantity-input">
              <button type="button" class="btn btn-sm" onclick="Modals.adjustQuantity(1)">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="product-note">Ghi chú:</label>
            <textarea id="product-note" class="notes-textarea" placeholder="Nhập ghi chú (nếu có)">${currentItem?.note || ''}</textarea>
          </div>
        </div>
      `;
    }

    const sizes = product.sizes || APP_CONFIG.PRODUCT.DEFAULT_SIZE_OPTIONS;
    const sugarOptions = product.sugarOptions || APP_CONFIG.PRODUCT.DEFAULT_SUGAR_OPTIONS;
    const iceOptions = product.iceOptions || APP_CONFIG.PRODUCT.DEFAULT_ICE_OPTIONS;
    const toppings = Products.getToppings();

    return `
      <div class="product-options-form">
        <div class="product-option-group">
          <label class="option-label">Size:</label>
          <div class="option-list" id="size-options">
            ${sizes.map(size => `
              <div class="option-item">
                <input type="radio" name="size" value="${size}" id="size-${size}" 
                       ${(currentItem?.size === size) || (!currentItem && size === 'M') ? 'checked' : ''}>
                <label for="size-${size}">${size}${size === 'L' ? ' (+5,000 VNĐ)' : ''}</label>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="product-option-group">
          <label class="option-label">Mức đường:</label>
          <div class="option-list" id="sugar-options">
            ${sugarOptions.map(sugar => `
              <div class="option-item">
                <input type="radio" name="sugar" value="${sugar}" id="sugar-${sugar}" 
                       ${(currentItem?.sugar === sugar) || (!currentItem && sugar === '100%') ? 'checked' : ''}>
                <label for="sugar-${sugar}">${sugar}</label>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="product-option-group">
          <label class="option-label">Mức đá:</label>
          <div class="option-list" id="ice-options">
            ${iceOptions.map(ice => `
              <div class="option-item">
                <input type="radio" name="ice" value="${ice}" id="ice-${ice}" 
                       ${(currentItem?.ice === ice) || (!currentItem && ice === 'Thường') ? 'checked' : ''}>
                <label for="ice-${ice}">${ice}</label>
              </div>
            `).join('')}
          </div>
        </div>

        ${toppings.length > 0 ? `
          <div class="product-option-group">
            <label class="option-label">Topping:</label>
            <div class="option-list vertical" id="topping-options">
              ${toppings.map(topping => `
                <div class="option-item">
                  <input type="checkbox" name="topping" value="${topping.id}" id="topping-${topping.id}"
                         data-name="${topping.name}" data-price="${topping.price}"
                         ${currentItem?.toppings?.some(t => t.name === topping.name) ? 'checked' : ''}>
                  <label for="topping-${topping.id}">
                    ${topping.name} (+${this.formatPrice(topping.price)})
                  </label>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="product-option-group">
          <label class="option-label">Số lượng:</label>
          <div class="quantity-selector">
            <button type="button" class="btn btn-sm" onclick="Modals.adjustQuantity(-1)">
              <i class="fas fa-minus"></i>
            </button>
            <input type="number" id="product-quantity" value="${currentItem?.quantity || 1}" min="1" class="quantity-input">
            <button type="button" class="btn btn-sm" onclick="Modals.adjustQuantity(1)">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>

        <div class="product-option-group">
          <label class="option-label" for="product-note">Ghi chú:</label>
          <textarea id="product-note" class="notes-textarea" placeholder="Nhập ghi chú (nếu có)">${currentItem?.note || ''}</textarea>
        </div>
      </div>
    `;
  }

  adjustQuantity(delta) {
    const input = document.getElementById('product-quantity');
    if (input) {
      const current = parseInt(input.value) || 1;
      const newValue = Math.max(1, current + delta);
      input.value = newValue;
    }
  }

  submitProductOptions(productId, editMode = false) {
    const modal = this.get('product-options');
    if (!modal) return;

    const product = modal.product;
    const isSimpleProduct = product.category === 'Món thêm' || product.category === 'Kem';

    try {
      const options = {
        quantity: parseInt(document.getElementById('product-quantity').value) || 1,
        note: document.getElementById('product-note').value.trim()
      };

      if (!isSimpleProduct) {
        // Get selected options
        const sizeInput = document.querySelector('input[name="size"]:checked');
        const sugarInput = document.querySelector('input[name="sugar"]:checked');
        const iceInput = document.querySelector('input[name="ice"]:checked');
        const toppingInputs = document.querySelectorAll('input[name="topping"]:checked');

        if (!sizeInput) throw new Error('Vui lòng chọn size!');
        if (!sugarInput) throw new Error('Vui lòng chọn mức đường!');
        if (!iceInput) throw new Error('Vui lòng chọn mức đá!');

        options.size = sizeInput.value;
        options.sugar = sugarInput.value;
        options.ice = iceInput.value;
        options.toppings = Array.from(toppingInputs).map(input => ({
          id: input.value,
          name: input.dataset.name,
          price: parseInt(input.dataset.price) || 0
        }));
      }

      if (editMode && modal.onSave) {
        modal.onSave(options);
      } else {
        Cart.addItem(product, options);
        Notifications.success('Đã thêm vào giỏ hàng!');
      }

      this.close('product-options');

    } catch (error) {
      Notifications.error(error.message);
    }
  }

  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return [
      ...Array(fullStars).fill('<i class="fas fa-star"></i>'),
      ...(hasHalfStar ? ['<i class="fas fa-star-half-alt"></i>'] : []),
      ...Array(emptyStars).fill('<i class="far fa-star"></i>')
    ].join('');
  }

  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price).replace('₫', ' VNĐ');
  }
}

// Create global modal instance
const Modals = new ModalManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalManager;
}