/**
 * Main Application Entry Point for Pet Marketplace
 * Initializes all modules and handles global functionality
 */

import utils, { $, $$, on, storage, url, debounce } from './utils.js';
import api, { setBaseUrl, healthCheck, devSeed } from './api.js';
import i18n from './i18n.js';

// Application state
let isInitialized = false;
let currentUser = null;
let currentTheme = 'light';

// Configuration
const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' ? 'http://localhost:8787' : 'https://api.petmarket.vn',
  DEFAULT_LANGUAGE: 'vi',
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000
};

// Initialize application
const init = async () => {
  if (isInitialized) return;
  
  try {
    // Set API base URL
    setBaseUrl(CONFIG.API_BASE_URL);
    
    // Initialize internationalization
    await i18n.init(CONFIG.DEFAULT_LANGUAGE);
    
    // Initialize theme
    initTheme();
    
    // Initialize authentication
    await initAuth();
    
    // Initialize UI components
    initUI();
    
    // Initialize search
    initSearch();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize modals
    initModals();
    
    // Initialize notifications
    initNotifications();
    
    // Initialize page-specific functionality
    initPageSpecific();
    
    // Health check
    await performHealthCheck();
    
    // Seed development data if needed
    if (window.location.hostname === 'localhost') {
      await seedDevelopmentData();
    }
    
    isInitialized = true;
    
    // Dispatch app initialized event
    window.dispatchEvent(new CustomEvent('app:initialized'));
    
    console.log('Pet Marketplace application initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    showToast('Không thể khởi tạo ứng dụng. Vui lòng tải lại trang.', 'error');
  }
};

// Initialize theme system
const initTheme = () => {
  // Get saved theme or detect system preference
  const savedTheme = storage.get('theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  currentTheme = savedTheme || systemTheme;
  
  // Apply theme
  applyTheme(currentTheme);
  
  // Setup theme toggle
  const themeToggle = $('#theme-toggle');
  if (themeToggle) {
    updateThemeToggle();
    
    on(themeToggle, 'click', () => {
      toggleTheme();
    });
  }
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!storage.get('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      applyTheme(newTheme);
      currentTheme = newTheme;
      updateThemeToggle();
    }
  });
};

// Apply theme
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
};

// Toggle theme
const toggleTheme = () => {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  storage.set('theme', newTheme);
  updateThemeToggle();
  
  // Dispatch theme change event
  window.dispatchEvent(new CustomEvent('theme:changed', {
    detail: { theme: newTheme }
  }));
};

// Update theme toggle button
const updateThemeToggle = () => {
  const themeToggle = $('#theme-toggle');
  const icon = themeToggle?.querySelector('i');
  
  if (icon) {
    icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
  }
};

// Initialize authentication
const initAuth = async () => {
  try {
    // Try to get current user if token exists
    const authResult = await api.authAPI.me();
    if (authResult.user) {
      currentUser = authResult.user;
      updateAuthUI(true);
    }
  } catch (error) {
    // No valid session, show login UI
    updateAuthUI(false);
  }
  
  // Setup auth event listeners
  window.addEventListener('auth:login', (event) => {
    currentUser = event.detail.user;
    updateAuthUI(true);
    closeModal('auth-modal');
    showToast('Đăng nhập thành công!', 'success');
  });
  
  window.addEventListener('auth:logout', () => {
    currentUser = null;
    updateAuthUI(false);
    showToast('Đăng xuất thành công!', 'info');
  });
  
  window.addEventListener('auth:register', (event) => {
    currentUser = event.detail.user;
    updateAuthUI(true);
    closeModal('auth-modal');
    showToast('Đăng ký thành công!', 'success');
  });
};

// Update authentication UI
const updateAuthUI = (isLoggedIn) => {
  const authButtons = $('#auth-buttons');
  const userMenu = $('#user-menu');
  
  if (isLoggedIn && currentUser) {
    // Hide auth buttons, show user menu
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'block';
      
      // Update user info
      const userAvatar = $('#user-avatar-img');
      const userName = $('#user-name');
      
      if (userAvatar) {
        userAvatar.src = currentUser.avatarUrl || 'https://via.placeholder.com/32/ccc/666?text=U';
        userAvatar.alt = currentUser.fullName;
      }
      
      if (userName) {
        userName.textContent = currentUser.fullName;
      }
      
      // Update profile links based on role
      updateNavigationByRole(currentUser.role);
    }
  } else {
    // Show auth buttons, hide user menu
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
  }
};

// Update navigation based on user role
const updateNavigationByRole = (role) => {
  const profileLink = $('#profile-link');
  const ordersLink = $('#orders-link');
  
  if (profileLink) {
    switch (role) {
      case 'seller':
        profileLink.href = '/apps/frontend/seller.html';
        break;
      case 'admin':
        profileLink.href = '/apps/frontend/admin.html';
        break;
      case 'support':
        profileLink.href = '/apps/frontend/support.html';
        break;
      default:
        profileLink.href = '/apps/frontend/buyer.html';
    }
  }
  
  if (ordersLink) {
    ordersLink.href = role === 'seller' ? '/apps/frontend/seller.html#orders' : '/apps/frontend/buyer.html#orders';
  }
};

// Initialize UI components
const initUI = () => {
  // Setup language switcher
  i18n.setupLanguageSwitcher();
  
  // Setup mobile menu
  initMobileMenu();
  
  // Setup user dropdown
  initUserDropdown();
  
  // Setup lazy loading for images
  utils.lazyLoadImages();
  
  // Setup smooth scrolling for anchor links
  initSmoothScrolling();
  
  // Setup form enhancements
  initFormEnhancements();
};

// Initialize mobile menu
const initMobileMenu = () => {
  const menuToggle = $('#mobile-menu-toggle');
  const mobileMenu = $('#mobile-menu');
  
  if (menuToggle && mobileMenu) {
    on(menuToggle, 'click', () => {
      const isOpen = mobileMenu.style.display === 'block';
      mobileMenu.style.display = isOpen ? 'none' : 'block';
      menuToggle.setAttribute('aria-expanded', !isOpen);
    });
    
    // Close menu when clicking outside
    on(document, 'click', (event) => {
      if (!menuToggle.contains(event.target) && !mobileMenu.contains(event.target)) {
        mobileMenu.style.display = 'none';
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
};

// Initialize user dropdown
const initUserDropdown = () => {
  const userAvatar = $('#user-avatar');
  const userDropdown = $('#user-dropdown');
  const logoutBtn = $('#logout-btn');
  
  if (userAvatar && userDropdown) {
    on(userAvatar, 'click', () => {
      const isOpen = userDropdown.style.display === 'block';
      userDropdown.style.display = isOpen ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    on(document, 'click', (event) => {
      if (!userAvatar.contains(event.target) && !userDropdown.contains(event.target)) {
        userDropdown.style.display = 'none';
      }
    });
  }
  
  if (logoutBtn) {
    on(logoutBtn, 'click', async () => {
      try {
        await api.authAPI.logout();
        window.dispatchEvent(new CustomEvent('auth:logout'));
      } catch (error) {
        console.error('Logout error:', error);
        showToast('Có lỗi xảy ra khi đăng xuất', 'error');
      }
    });
  }
};

// Initialize search functionality
const initSearch = () => {
  const searchInputs = $$('.search-input');
  const searchSuggestions = $('#search-suggestions');
  
  const performSearch = debounce(async (query) => {
    if (!query || query.length < 2) {
      if (searchSuggestions) {
        searchSuggestions.style.display = 'none';
      }
      return;
    }
    
    try {
      // Perform search API call
      const results = await api.petsAPI.getPets({
        search: query,
        limit: 5
      });
      
      if (searchSuggestions && results.pets.length > 0) {
        showSearchSuggestions(results.pets);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, CONFIG.DEBOUNCE_DELAY);
  
  searchInputs.forEach(input => {
    on(input, 'input', (event) => {
      performSearch(event.target.value);
    });
    
    on(input, 'keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        redirectToSearch(input.value);
      }
    });
  });
  
  // Search button handlers
  const searchBtns = $$('.search-btn');
  searchBtns.forEach(btn => {
    on(btn, 'click', () => {
      const input = btn.parentElement.querySelector('.search-input');
      if (input) {
        redirectToSearch(input.value);
      }
    });
  });
};

// Show search suggestions
const showSearchSuggestions = (pets) => {
  const searchSuggestions = $('#search-suggestions');
  if (!searchSuggestions) return;
  
  const suggestionHTML = pets.map(pet => `
    <a href="/apps/frontend/buyer.html?pet=${pet.slug}" class="suggestion-item">
      <img src="${pet.photos[0] || 'https://via.placeholder.com/40'}" alt="${pet.title}" class="suggestion-image">
      <div class="suggestion-content">
        <div class="suggestion-title">${pet.title}</div>
        <div class="suggestion-price">${utils.format.currency(pet.price)}</div>
      </div>
    </a>
  `).join('');
  
  searchSuggestions.innerHTML = suggestionHTML;
  searchSuggestions.style.display = 'block';
  
  // Hide suggestions when clicking outside
  setTimeout(() => {
    on(document, 'click', () => {
      searchSuggestions.style.display = 'none';
    }, { once: true });
  }, 100);
};

// Redirect to search page
const redirectToSearch = (query) => {
  if (query) {
    window.location.href = `/apps/frontend/buyer.html?search=${encodeURIComponent(query)}`;
  }
};

// Initialize navigation
const initNavigation = () => {
  // Handle section navigation
  const navButtons = $$('.nav-btn');
  navButtons.forEach(btn => {
    on(btn, 'click', (e) => {
      e.preventDefault();
      const section = btn.dataset.section;
      const species = btn.dataset.species;
      
      if (section) {
        showSection(section);
        if (section === 'buyer-portal' && species) {
          // Set species filter if specified
          setTimeout(() => {
            const speciesFilter = $('#species-filter');
            if (speciesFilter) {
              speciesFilter.value = species;
              applyBuyerFilters();
            }
          }, 100);
        }
      }
    });
  });

  // Highlight current page in navigation
  const currentPath = window.location.pathname;
  const navLinks = $$('.nav-link, .mobile-nav-link');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
  
  // Handle navigation clicks for external links
  navLinks.forEach(link => {
    if (!link.classList.contains('nav-btn')) {
      on(link, 'click', (event) => {
        // Add loading state if needed
        if (link.classList.contains('nav-link')) {
          showLoading();
        }
      });
    }
  });

  // Handle URL hash navigation
  const hash = window.location.hash.substring(1);
  if (hash && $('#' + hash)) {
    showSection(hash);
  }
};

// Show specific section and hide others
const showSection = (sectionId) => {
  const sections = $$('.page-section');
  sections.forEach(section => {
    if (section.id === sectionId) {
      section.style.display = 'block';
      // Update URL without reload
      if (sectionId !== 'home') {
        window.history.pushState({}, '', `#${sectionId}`);
      } else {
        window.history.pushState({}, '', window.location.pathname);
      }
    } else {
      section.style.display = 'none';
    }
  });

  // Update active nav state
  $$('.nav-link, .mobile-nav-link, .nav-btn').forEach(link => {
    link.classList.remove('active');
  });
  
  const activeNavs = $$(`[data-section="${sectionId}"]`);
  activeNavs.forEach(nav => nav.classList.add('active'));

  // Initialize section-specific functionality
  if (sectionId === 'buyer-portal') {
    initBuyerPortal();
  } else if (sectionId === 'seller-portal') {
    initSellerPortal();
  }

  // Close mobile menu if open
  const mobileMenu = $('#mobile-menu');
  if (mobileMenu) {
    mobileMenu.style.display = 'none';
  }
};

// Initialize smooth scrolling
const initSmoothScrolling = () => {
  const anchorLinks = $$('a[href^="#"]');
  
  anchorLinks.forEach(link => {
    on(link, 'click', (event) => {
      const href = link.getAttribute('href');
      const target = $(href);
      
      if (target) {
        event.preventDefault();
        utils.scrollTo(target);
      }
    });
  });
};

// Initialize form enhancements
const initFormEnhancements = () => {
  // Auto-format phone numbers
  const phoneInputs = $$('input[type="tel"]');
  phoneInputs.forEach(input => {
    on(input, 'input', (event) => {
      let value = event.target.value.replace(/\D/g, '');
      if (value.startsWith('84')) {
        value = '+84 ' + value.slice(2);
      } else if (value.startsWith('0')) {
        value = value.slice(1);
        value = '+84 ' + value;
      }
      event.target.value = value;
    });
  });
  
  // Auto-format currency inputs
  const priceInputs = $$('input[name="price"]');
  priceInputs.forEach(input => {
    on(input, 'input', (event) => {
      let value = event.target.value.replace(/\D/g, '');
      if (value) {
        value = parseInt(value).toLocaleString('vi-VN');
        event.target.value = value;
      }
    });
  });
};

// Initialize modals
const initModals = () => {
  // Auth modal
  const authModal = $('#auth-modal');
  const loginBtn = $('#login-btn');
  const registerBtn = $('#register-btn');
  const authModalClose = $('#auth-modal-close');
  const authSwitchBtn = $('#auth-switch-btn');
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');
  
  if (loginBtn) {
    on(loginBtn, 'click', () => {
      showAuthModal('login');
    });
  }
  
  if (registerBtn) {
    on(registerBtn, 'click', () => {
      showAuthModal('register');
    });
  }
  
  if (authModalClose) {
    on(authModalClose, 'click', () => {
      closeModal('auth-modal');
    });
  }
  
  if (authSwitchBtn) {
    on(authSwitchBtn, 'click', () => {
      switchAuthMode();
    });
  }
  
  // Handle auth form submissions
  if (loginForm) {
    on(loginForm, 'submit', handleLogin);
  }
  
  if (registerForm) {
    on(registerForm, 'submit', handleRegister);
  }
  
  // Close modals when clicking outside
  on(document, 'click', (event) => {
    if (event.target.classList.contains('modal')) {
      closeModal(event.target.id);
    }
  });
  
  // Close modals with Escape key
  on(document, 'keydown', (event) => {
    if (event.key === 'Escape') {
      const openModal = $('.modal.active');
      if (openModal) {
        closeModal(openModal.id);
      }
    }
  });
};

// Show authentication modal
const showAuthModal = (mode = 'login') => {
  const authModal = $('#auth-modal');
  const authModalTitle = $('#auth-modal-title');
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');
  const authSwitchText = $('#auth-switch-text');
  const authSwitchBtn = $('#auth-switch-btn');
  
  if (!authModal) return;
  
  // Clear forms
  if (loginForm) loginForm.reset();
  if (registerForm) registerForm.reset();
  
  if (mode === 'login') {
    if (authModalTitle) authModalTitle.textContent = 'Đăng nhập';
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (authSwitchText) authSwitchText.innerHTML = 'Chưa có tài khoản? <button type="button" id="auth-switch-btn" class="link-btn">Đăng ký ngay</button>';
  } else {
    if (authModalTitle) authModalTitle.textContent = 'Đăng ký';
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (authSwitchText) authSwitchText.innerHTML = 'Đã có tài khoản? <button type="button" id="auth-switch-btn" class="link-btn">Đăng nhập ngay</button>';
  }
  
  // Re-attach switch button event
  const newSwitchBtn = $('#auth-switch-btn');
  if (newSwitchBtn) {
    on(newSwitchBtn, 'click', switchAuthMode);
  }
  
  openModal('auth-modal');
};

// Switch authentication mode
const switchAuthMode = () => {
  const loginForm = $('#login-form');
  const isLoginVisible = loginForm && loginForm.style.display !== 'none';
  
  showAuthModal(isLoginVisible ? 'register' : 'login');
};

// Handle login form submission
const handleLogin = async (event) => {
  event.preventDefault();
  
  const formData = utils.form.serialize(event.target);
  
  try {
    showLoading();
    const response = await api.authAPI.login(formData);
    
    window.dispatchEvent(new CustomEvent('auth:login', {
      detail: { user: response.user, token: response.token }
    }));
    
  } catch (error) {
    showToast(api.handleApiError(error, false), 'error');
  } finally {
    hideLoading();
  }
};

// Handle register form submission
const handleRegister = async (event) => {
  event.preventDefault();
  
  const formData = utils.form.serialize(event.target);
  
  try {
    showLoading();
    const response = await api.authAPI.register(formData);
    
    window.dispatchEvent(new CustomEvent('auth:register', {
      detail: { user: response.user, token: response.token }
    }));
    
  } catch (error) {
    showToast(api.handleApiError(error, false), 'error');
  } finally {
    hideLoading();
  }
};

// Modal utilities
const openModal = (modalId) => {
  const modal = $(`#${modalId}`);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

const closeModal = (modalId) => {
  const modal = $(`#${modalId}`);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

// Initialize notifications system
const initNotifications = () => {
  // Create toast container if it doesn't exist
  let toastContainer = $('#toast-container');
  if (!toastContainer) {
    toastContainer = utils.createElement('div', {
      id: 'toast-container',
      className: 'toast-container'
    });
    document.body.appendChild(toastContainer);
  }
  
  // Make showToast globally available
  window.showToast = showToast;
};

// Show toast notification
const showToast = (message, type = 'info', duration = CONFIG.TOAST_DURATION) => {
  const toastContainer = $('#toast-container');
  if (!toastContainer) return;
  
  const toastId = utils.generateId('toast');
  const iconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  
  const toast = utils.createElement('div', {
    id: toastId,
    className: `toast ${type}`,
    innerHTML: `
      <i class="toast-icon ${iconMap[type] || iconMap.info}"></i>
      <div class="toast-content">
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close" aria-label="Close">
        <i class="fas fa-times"></i>
      </button>
    `
  });
  
  // Add close handler
  const closeBtn = toast.querySelector('.toast-close');
  on(closeBtn, 'click', () => removeToast(toastId));
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Show with animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto remove
  setTimeout(() => removeToast(toastId), duration);
};

// Remove toast notification
const removeToast = (toastId) => {
  const toast = $(`#${toastId}`);
  if (toast) {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }
};

// Show/hide loading spinner
const showLoading = () => {
  let spinner = $('#loading-spinner');
  if (!spinner) {
    spinner = utils.createElement('div', {
      id: 'loading-spinner',
      className: 'loading-spinner',
      innerHTML: '<div class="spinner"></div>'
    });
    document.body.appendChild(spinner);
  }
  spinner.style.display = 'flex';
};

const hideLoading = () => {
  const spinner = $('#loading-spinner');
  if (spinner) {
    spinner.style.display = 'none';
  }
};

// Initialize page-specific functionality
const initPageSpecific = () => {
  const currentPage = getCurrentPage();
  
  switch (currentPage) {
    case 'index':
      initHomePage();
      break;
    case 'buyer':
      initBuyerPage();
      break;
    case 'seller':
      initSellerPage();
      break;
    case 'admin':
      initAdminPage();
      break;
    case 'support':
      initSupportPage();
      break;
  }
};

// Get current page name
const getCurrentPage = () => {
  const path = window.location.pathname;
  const filename = path.split('/').pop().split('.')[0];
  return filename || 'index';
};

// Initialize home page
const initHomePage = () => {
  loadFeaturedPets();
  initCountUp();
};

// Load featured pets for home page
const loadFeaturedPets = async () => {
  const featuredGrid = $('#featured-pets-grid');
  if (!featuredGrid) return;
  
  try {
    const response = await api.petsAPI.getPets({
      limit: 8,
      status: 'approved'
    });
    
    featuredGrid.innerHTML = response.pets.map(pet => createPetCard(pet)).join('');
    
  } catch (error) {
    console.error('Error loading featured pets:', error);
    featuredGrid.innerHTML = '<p class="error-message">Không thể tải danh sách thú cưng</p>';
  }
};

// Create pet card HTML
const createPetCard = (pet) => {
  return `
    <a href="/apps/frontend/buyer.html?pet=${pet.slug}" class="pet-card">
      <div class="pet-card-image">
        <img src="${pet.photos[0] || 'https://via.placeholder.com/280x200'}" 
             alt="${pet.title}" class="pet-card-img">
        <div class="pet-card-status ${pet.status}">${utils.format.capitalize(pet.status)}</div>
        <button class="pet-card-favorite" data-pet-id="${pet.id}">
          <i class="fas fa-heart"></i>
        </button>
      </div>
      <div class="pet-card-content">
        <h3 class="pet-card-title">${pet.title}</h3>
        <div class="pet-card-info">
          <span>${i18n.getLocalizedText(pet.species)}</span>
          <span>${pet.ageMonths} ${i18n.t('pet.months')}</span>
          <span>${i18n.getLocalizedText(pet.sex)}</span>
        </div>
        <div class="pet-card-price">${utils.format.currency(pet.price)}</div>
        <div class="pet-card-seller">
          <img src="${pet.sellerAvatar || 'https://via.placeholder.com/24'}" 
               alt="${pet.sellerName}" class="seller-avatar">
          <span>${pet.sellerName}</span>
          ${pet.sellerRating ? `
            <div class="seller-rating">
              <i class="fas fa-star"></i>
              <span>${pet.sellerRating}</span>
            </div>
          ` : ''}
        </div>
      </div>
    </a>
  `;
};

// Initialize count-up animation for statistics
const initCountUp = () => {
  const statNumbers = $$('.stat-number');
  
  const observer = utils.createObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const finalNumber = parseInt(element.textContent.replace(/\D/g, ''));
        animateNumber(element, finalNumber);
        observer.unobserve(element);
      }
    });
  });
  
  statNumbers.forEach(element => observer.observe(element));
};

// Animate number counting
const animateNumber = (element, target, duration = 2000) => {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    
    const formatted = Math.floor(current).toLocaleString('vi-VN');
    element.textContent = formatted + (element.textContent.includes('+') ? '+' : '');
  }, 16);
};

// Placeholder functions for other pages
// Initialize buyer portal functionality
const initBuyerPortal = () => {
  if (window.buyerPortalInitialized) return;
  window.buyerPortalInitialized = true;

  // Initialize search
  const buyerSearch = $('#buyer-search');
  const buyerSearchBtn = $('#buyer-search-btn');
  
  if (buyerSearch && buyerSearchBtn) {
    const performBuyerSearch = debounce(async () => {
      const query = buyerSearch.value.trim();
      if (query) {
        await loadPets({ search: query });
      }
    }, CONFIG.DEBOUNCE_DELAY);

    on(buyerSearch, 'input', performBuyerSearch);
    on(buyerSearchBtn, 'click', performBuyerSearch);
  }

  // Initialize filters
  const applyFiltersBtn = $('#apply-filters');
  const clearFiltersBtn = $('#clear-filters');
  
  if (applyFiltersBtn) {
    on(applyFiltersBtn, 'click', applyBuyerFilters);
  }
  
  if (clearFiltersBtn) {
    on(clearFiltersBtn, 'click', clearBuyerFilters);
  }

  // Initialize quick actions
  const viewCartBtn = $('#view-cart');

  if (viewCartBtn) {
    on(viewCartBtn, 'click', () => openModal('cart-modal'));
  }

  // Initialize view controls
  const viewBtns = $$('.view-btn');
  viewBtns.forEach(btn => {
    on(btn, 'click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      updatePetsView(view);
    });
  });

  // Initialize sort
  const sortSelect = $('#sort-pets');
  if (sortSelect) {
    on(sortSelect, 'change', () => {
      applyBuyerFilters();
    });
  }

  // Load initial pets
  loadPets();
};

// Apply buyer filters
const applyBuyerFilters = async () => {
  const species = $('#species-filter')?.value || '';
  const price = $('#price-filter')?.value || '';
  const location = $('#location-filter')?.value || '';
  const age = $('#age-filter')?.value || '';
  const sort = $('#sort-pets')?.value || 'newest';
  const search = $('#buyer-search')?.value || '';

  const filters = { species, price, location, age, sort, search };
  await loadPets(filters);
};

// Clear buyer filters
const clearBuyerFilters = () => {
  $('#species-filter').value = '';
  $('#price-filter').value = '';
  $('#location-filter').value = '';
  $('#age-filter').value = '';
  $('#buyer-search').value = '';
  loadPets();
};

// Load pets with filters
const loadPets = async (filters = {}) => {
  const grid = $('#buyer-pets-grid');
  if (!grid) return;

  try {
    showLoading();
    const response = await api.petsAPI.getPets(filters);
    
    if (response.success) {
      displayPets(response.data.pets || response.data || []);
    } else {
      showToast('Không thể tải danh sách thú cưng', 'error');
    }
  } catch (error) {
    console.error('Error loading pets:', error);
    showToast('Có lỗi xảy ra khi tải dữ liệu', 'error');
  } finally {
    hideLoading();
  }
};

// Display pets in grid
const displayPets = (pets) => {
  const grid = $('#buyer-pets-grid');
  if (!grid) return;

  if (!pets || pets.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>Không tìm thấy thú cưng</h3>
        <p>Thử thay đổi bộ lọc tìm kiếm của bạn</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = pets.map(pet => createBuyerPetCard(pet)).join('');
};

// Create buyer pet card
const createBuyerPetCard = (pet) => {
  const price = pet.price ? pet.price.toLocaleString('vi-VN') + ' VND' : 'Liên hệ';
  const image = pet.images && pet.images.length > 0 ? pet.images[0] : 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=200&fit=crop';
  
  return `
    <div class="pet-card" data-pet-id="${pet.id}">
      <div class="pet-image">
        <img src="${image}" alt="${pet.title}" loading="lazy">
        <div class="pet-actions">
          <button class="action-btn favorite-btn" onclick="toggleFavorite('${pet.id}')" data-pet-id="${pet.id}">
            <i class="fas fa-heart"></i>
          </button>
          <button class="action-btn cart-btn" onclick="addToCart('${pet.id}')" data-pet-id="${pet.id}">
            <i class="fas fa-shopping-cart"></i>
          </button>
        </div>
      </div>
      <div class="pet-info">
        <h3 class="pet-title">${pet.title}</h3>
        <p class="pet-breed">${pet.breed || pet.species}</p>
        <div class="pet-details">
          <span class="pet-age"><i class="fas fa-birthday-cake"></i> ${pet.age || 'N/A'} tháng</span>
          <span class="pet-location"><i class="fas fa-map-marker-alt"></i> ${pet.location || 'N/A'}</span>
        </div>
        <div class="pet-price">${price}</div>
        <button class="btn btn-primary btn-small view-details-btn" onclick="viewPetDetails('${pet.id}')">
          Xem chi tiết
        </button>
      </div>
    </div>
  `;
};

// Initialize seller portal functionality  
const initSellerPortal = () => {
  if (window.sellerPortalInitialized) return;
  window.sellerPortalInitialized = true;

  // Check if user is authenticated and has seller role
  if (!currentUser || (currentUser.role !== 'seller' && currentUser.role !== 'admin')) {
    showToast('Bạn cần đăng nhập với tài khoản người bán để truy cập trang này', 'warning');
    showAuthModal('login');
    showSection('home');
    return;
  }

  // Initialize seller actions
  const createListingBtn = $('#create-listing');
  const manageOrdersBtn = $('#manage-orders');

  if (createListingBtn) {
    on(createListingBtn, 'click', () => openModal('create-listing-modal'));
  }

  if (manageOrdersBtn) {
    on(manageOrdersBtn, 'click', toggleOrdersSection);
  }

  // Initialize listing filters
  const listingStatusFilter = $('#listing-status-filter');
  if (listingStatusFilter) {
    on(listingStatusFilter, 'change', loadSellerListings);
  }

  // Initialize order filters  
  const orderStatusFilter = $('#order-status-filter');
  if (orderStatusFilter) {
    on(orderStatusFilter, 'change', loadSellerOrders);
  }

  // Load seller data
  loadSellerStats();
  loadSellerListings();
};

// Load seller statistics
const loadSellerStats = async () => {
  try {
    const response = await api.sellersAPI?.getStats();
    if (response?.success) {
      const stats = response.data;
      updateStatElement('total-listings', stats.totalListings || 0);
      updateStatElement('total-views', stats.totalViews || 0);
      updateStatElement('total-orders', stats.totalOrders || 0);
      updateStatElement('total-revenue', (stats.totalRevenue || 0).toLocaleString('vi-VN'));
    }
  } catch (error) {
    console.error('Error loading seller stats:', error);
  }
};

// Update stat element
const updateStatElement = (id, value) => {
  const element = $('#' + id);
  if (element) {
    element.textContent = value;
  }
};

// Load seller listings
const loadSellerListings = async () => {
  const grid = $('#seller-listings-grid');
  if (!grid) return;

  try {
    const status = $('#listing-status-filter')?.value || '';
    const response = await api.sellersAPI?.getListings({ status });
    
    if (response?.success) {
      displaySellerListings(response.data.listings || []);
    }
  } catch (error) {
    console.error('Error loading seller listings:', error);
    showToast('Không thể tải danh sách tin đăng', 'error');
  }
};

// Display seller listings
const displaySellerListings = (listings) => {
  const grid = $('#seller-listings-grid');
  if (!grid) return;

  if (!listings || listings.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-list"></i>
        <h3>Chưa có tin đăng nào</h3>
        <p>Hãy tạo tin đăng đầu tiên của bạn</p>
        <button class="btn btn-primary" onclick="openModal('create-listing-modal')">
          <i class="fas fa-plus"></i> Đăng tin ngay
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = listings.map(listing => createSellerListingCard(listing)).join('');
};

// Create seller listing card
const createSellerListingCard = (listing) => {
  const price = listing.price ? listing.price.toLocaleString('vi-VN') + ' VND' : 'Liên hệ';
  const image = listing.images && listing.images.length > 0 ? listing.images[0] : 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=200&fit=crop';
  const statusClass = `status-${listing.status}`;
  const statusText = getStatusText(listing.status);
  
  return `
    <div class="listing-card" data-listing-id="${listing.id}">
      <div class="listing-image">
        <img src="${image}" alt="${listing.title}">
        <div class="listing-status ${statusClass}">${statusText}</div>
      </div>
      <div class="listing-info">
        <h3 class="listing-title">${listing.title}</h3>
        <div class="listing-stats">
          <span><i class="fas fa-eye"></i> ${listing.views || 0} lượt xem</span>
          <span><i class="fas fa-heart"></i> ${listing.favorites || 0} yêu thích</span>
        </div>
        <div class="listing-price">${price}</div>
        <div class="listing-actions">
          <button class="btn btn-outline btn-small" onclick="editListing('${listing.id}')">
            <i class="fas fa-edit"></i> Sửa
          </button>
          <button class="btn btn-outline btn-small" onclick="toggleListingStatus('${listing.id}')">
            <i class="fas fa-toggle-on"></i> ${listing.status === 'active' ? 'Ẩn' : 'Hiện'}
          </button>
          <button class="btn btn-danger btn-small" onclick="deleteListing('${listing.id}')">
            <i class="fas fa-trash"></i> Xóa
          </button>
        </div>
      </div>
    </div>
  `;
};

// Get status text
const getStatusText = (status) => {
  const statusMap = {
    'active': 'Đang hiển thị',
    'pending': 'Chờ duyệt', 
    'sold': 'Đã bán',
    'inactive': 'Tạm ẩn'
  };
  return statusMap[status] || status;
};

// Toggle orders section
const toggleOrdersSection = () => {
  const ordersSection = $('#orders-section');
  const listingsSection = $('.listings-section');
  
  if (ordersSection && ordersSection.style.display === 'none') {
    ordersSection.style.display = 'block';
    if (listingsSection) listingsSection.style.display = 'none';
    loadSellerOrders();
  } else {
    if (ordersSection) ordersSection.style.display = 'none';
    if (listingsSection) listingsSection.style.display = 'block';
  }
};

// Placeholder pet interaction functions
window.toggleFavorite = (petId) => {
  console.log('Toggle favorite for pet:', petId);
  showToast('Tính năng đang được phát triển', 'info');
};

window.addToCart = (petId) => {
  console.log('Add to cart pet:', petId);
  showToast('Đã thêm vào giỏ hàng', 'success');
};

window.viewPetDetails = (petId) => {
  console.log('View pet details:', petId);
  openModal('pet-detail-modal');
};

// Placeholder seller functions
window.editListing = (listingId) => {
  console.log('Edit listing:', listingId);
  showToast('Tính năng đang được phát triển', 'info');
};

window.toggleListingStatus = (listingId) => {
  console.log('Toggle listing status:', listingId);
  showToast('Tính năng đang được phát triển', 'info');
};

window.deleteListing = (listingId) => {
  console.log('Delete listing:', listingId);
  showToast('Tính năng đang được phát triển', 'info');
};

const loadSellerOrders = () => {
  console.log('Loading seller orders...');
};

const updatePetsView = (view) => {
  console.log('Update pets view:', view);
};

const initBuyerPage = () => {
  console.log('Buyer page initialized');
};

const initSellerPage = () => {
  console.log('Seller page initialized');
};

const initAdminPage = () => {
  console.log('Admin page initialized');
};

const initSupportPage = () => {
  console.log('Support page initialized');
};

// Perform health check
const performHealthCheck = async () => {
  try {
    await healthCheck();
    console.log('API health check passed');
  } catch (error) {
    console.warn('API health check failed:', error);
    showToast('Kết nối API không ổn định. Một số tính năng có thể bị hạn chế.', 'warning');
  }
};

// Seed development data
const seedDevelopmentData = async () => {
  try {
    // Only seed if no data exists
    const hasData = storage.get('dev_seeded');
    if (!hasData) {
      await devSeed();
      storage.set('dev_seeded', true);
      console.log('Development data seeded successfully');
    }
  } catch (error) {
    console.warn('Development seeding failed:', error);
  }
};

// Error handling
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  showToast('Đã xảy ra lỗi không mong muốn', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showToast('Đã xảy ra lỗi trong quá trình xử lý', 'error');
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for global access
window.app = {
  init,
  showToast,
  showLoading,
  hideLoading,
  openModal,
  closeModal,
  getCurrentUser: () => currentUser,
  getCurrentTheme: () => currentTheme,
  toggleTheme,
  utils,
  api,
  i18n
};

// Make utilities globally available
window.utils = utils;
window.api = api;
window.i18n = i18n;