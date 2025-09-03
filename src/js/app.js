// Main Application JavaScript
class TocoTocoApp {
  constructor() {
    this.isInitialized = false;
    this.currentView = 'grid';
    this.currentCategory = '';
    this.searchQuery = '';
    this.init();
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Initialize core components
      await this.initializeComponents();
      
      // Load initial data
      await this.loadInitialData();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize authentication
      await Auth.checkSession();
      
      // Initialize cart
      Cart.updateDisplay();
      
      this.isInitialized = true;
      console.log('TocoToco App initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Notifications.show('Không thể khởi tạo ứng dụng. Vui lòng tải lại trang!', 'error');
    }
  }

  async initializeComponents() {
    // Initialize notification system
    Notifications.init();
    
    // Initialize modal system
    Modals.init();
    
    // Initialize storage
    Storage.init();
    
    // Initialize API
    API.init();
  }

  async loadInitialData() {
    try {
      // Show loading state
      this.showLoading(true);
      
      // Load products and categories
      await Products.loadAll();
      
      // Load categories for sidebar
      await this.loadCategories();
      
      // Load default category products
      const categories = Products.getCategories();
      if (categories.length > 0) {
        this.currentCategory = categories[0];
        await this.loadCategoryProducts(this.currentCategory);
      }
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Notifications.show('Không thể tải dữ liệu. Vui lòng thử lại!', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async loadCategories() {
    const categories = Products.getCategories();
    const categoryList = document.getElementById('category-list');
    
    if (!categoryList) return;
    
    categoryList.innerHTML = '';
    
    categories.forEach((category, index) => {
      const li = document.createElement('li');
      if (index === 0) li.classList.add('active');
      
      const button = document.createElement('button');
      button.textContent = category;
      button.onclick = () => this.selectCategory(category, li);
      
      li.appendChild(button);
      categoryList.appendChild(li);
    });
  }

  async selectCategory(category, element) {
    try {
      // Update active state
      document.querySelectorAll('#category-list li').forEach(li => {
        li.classList.remove('active');
      });
      element.classList.add('active');
      
      // Update current category
      this.currentCategory = category;
      
      // Update page title
      const categoryTitle = document.getElementById('category-title');
      if (categoryTitle) {
        categoryTitle.textContent = category;
      }
      
      // Load category products
      await this.loadCategoryProducts(category);
      
      // Close mobile menu if open
      if (window.innerWidth <= 768) {
        this.toggleMobileMenu(false);
      }
      
    } catch (error) {
      console.error('Failed to select category:', error);
      Notifications.show('Không thể tải danh mục. Vui lòng thử lại!', 'error');
    }
  }

  async loadCategoryProducts(category) {
    try {
      this.showLoading(true);
      
      let products = Products.getByCategory(category);
      
      // Apply search filter if active
      if (this.searchQuery) {
        products = products.filter(product => 
          product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
      
      this.renderProducts(products);
      
    } catch (error) {
      console.error('Failed to load category products:', error);
      Notifications.show('Không thể tải sản phẩm. Vui lòng thử lại!', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  renderProducts(products) {
    const productList = document.getElementById('product-list');
    if (!productList) return;
    
    productList.className = `product-list ${this.currentView}-view`;
    productList.innerHTML = '';
    
    if (products.length === 0) {
      productList.innerHTML = `
        <div class="no-products">
          <i class="fas fa-search"></i>
          <h3>Không tìm thấy sản phẩm</h3>
          <p>Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác.</p>
        </div>
      `;
      return;
    }
    
    products.forEach(product => {
      const productCard = this.createProductCard(product);
      productList.appendChild(productCard);
    });
  }

  createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-product-id', product.id);
    
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercent = hasDiscount ? 
      Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image || APP_CONFIG.PRODUCT.DEFAULT_IMAGE}" 
             alt="${product.name}" 
             loading="lazy"
             onerror="this.src='${APP_CONFIG.PRODUCT.DEFAULT_IMAGE}'">
        ${product.isNew ? '<div class="product-badge new">Mới</div>' : ''}
        ${product.isHot ? '<div class="product-badge hot">Hot</div>' : ''}
        ${hasDiscount ? `<div class="product-badge sale">-${discountPercent}%</div>` : ''}
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
        <div class="product-price">
          <span class="price-current">${this.formatPrice(product.price)}</span>
          ${hasDiscount ? `<span class="price-original">${this.formatPrice(product.originalPrice)}</span>` : ''}
        </div>
        <div class="product-actions">
          <button class="btn btn-outline btn-sm" onclick="app.showProductDetails('${product.id}')">
            <i class="fas fa-eye"></i> Xem
          </button>
          <button class="btn btn-primary btn-sm" onclick="app.addToCart('${product.id}')">
            <i class="fas fa-plus"></i> Thêm
          </button>
        </div>
      </div>
    `;
    
    return card;
  }

  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price).replace('₫', ' VNĐ');
  }

  showProductDetails(productId) {
    const product = Products.getById(productId);
    if (!product) {
      Notifications.show('Không tìm thấy sản phẩm!', 'error');
      return;
    }
    
    Modals.showProductDetails(product);
  }

  addToCart(productId) {
    const product = Products.getById(productId);
    if (!product) {
      Notifications.show('Không tìm thấy sản phẩm!', 'error');
      return;
    }
    
    // For simple products, add directly to cart
    if (product.category === 'Món thêm' || product.category === 'Kem') {
      Cart.addItem({
        ...product,
        quantity: 1,
        options: {},
        note: ''
      });
      Notifications.show('Đã thêm vào giỏ hàng!', 'success');
    } else {
      // Show options modal for complex products
      Modals.showProductOptions(product);
    }
  }

  searchProducts(query) {
    this.searchQuery = query.trim();
    
    if (this.currentCategory) {
      this.loadCategoryProducts(this.currentCategory);
    }
  }

  toggleView(view) {
    if (view === this.currentView) return;
    
    this.currentView = view;
    
    // Update view toggle buttons
    document.querySelectorAll('.view-toggle .btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`${view}-view`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    // Re-render products with new view
    if (this.currentCategory) {
      this.loadCategoryProducts(this.currentCategory);
    }
  }

  toggleMobileMenu(force = null) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (!sidebar) return;
    
    if (force !== null) {
      if (force) {
        sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
      } else {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
      }
    } else {
      sidebar.classList.toggle('active');
      if (overlay) overlay.classList.toggle('active');
    }
  }

  showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchProducts(e.target.value);
        }, APP_CONFIG.UI.DEBOUNCE_DELAY);
      });
    }
    
    // View toggle
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    
    if (gridViewBtn) {
      gridViewBtn.addEventListener('click', () => this.toggleView('grid'));
    }
    
    if (listViewBtn) {
      listViewBtn.addEventListener('click', () => this.toggleView('list'));
    }
    
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => this.toggleMobileMenu());
    }
    
    // Sidebar overlay click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('sidebar-overlay')) {
        this.toggleMobileMenu(false);
      }
    });
    
    // Close mobile menu on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.toggleMobileMenu(false);
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // ESC key to close modals and mobile menu
      if (e.key === 'Escape') {
        Modals.closeAll();
        this.toggleMobileMenu(false);
      }
      
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInput) {
          searchInput.focus();
        }
      }
    });
    
    // Cart button
    const cartButtons = document.querySelectorAll('.cart-btn, [onclick="viewCart()"]');
    cartButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        Cart.show();
      });
    });
    
    // Prevent form submission on Enter in search
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });
    }
  }
}

// Global functions for backward compatibility
function toggleMenu() {
  if (window.app) {
    window.app.toggleMobileMenu();
  }
}

function viewCart() {
  Cart.show();
}

function showLoginPopup(isRegister) {
  Auth.showLoginModal(isRegister);
}

function logout() {
  Auth.logout();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create sidebar overlay for mobile
  if (window.innerWidth <= 768) {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }
  
  // Initialize the app
  window.app = new TocoTocoApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.app?.isInitialized) {
    // Refresh data when page becomes visible
    Auth.checkSession();
    Cart.updateDisplay();
  }
});

// Handle online/offline status
window.addEventListener('online', () => {
  Notifications.show('Kết nối internet đã được khôi phục!', 'success');
});

window.addEventListener('offline', () => {
  Notifications.show('Mất kết nối internet!', 'warning');
});