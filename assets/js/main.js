/**
 * Main Application Entry Point for Pet Marketplace
 * Initializes all modules and handles global functionality
 */

import utils, { $, $$, on, storage, url, debounce } from './utils.js';
import api from './api.js';
import i18n from './i18n.js';

// Application state
let isInitialized = false;
let currentUser = null;

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
    // Production mode - direct initialization
    
    // Initialize internationalization
    await i18n.init(CONFIG.DEFAULT_LANGUAGE);
    
    // Initialize authentication
    await initAuth();
    
    // Initialize UI components
    initUI();
    
    // Initialize search
    initSearch();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize carousel
    initCarousel();
    
    // Initialize modals
    initModals();
    
    // Initialize notifications
    initNotifications();
    
    // Initialize page-specific functionality
    initPageSpecific();
    
    // Health check (skip in demo mode)
    if (!CONFIG.DEMO_MODE) {
      await performHealthCheck();
    }
    
    // Seed development data if needed (skip in demo mode)
    if (window.location.hostname === 'localhost' && !CONFIG.DEMO_MODE) {
      await seedDevelopmentData();
    }
    
    isInitialized = true;
    
    // Dispatch app initialized event
    window.dispatchEvent(new CustomEvent('app:initialized'));
    
    console.log('Pet Marketplace application initialized successfully' + (CONFIG.DEMO_MODE ? ' (Demo Mode)' : ''));
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    showToast('Không thể khởi tạo ứng dụng. Vui lòng tải lại trang.', 'error');
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
  const adminNav = $('#admin-nav');
  const cartIcon = $('#cart-icon');
  const notificationIcon = $('#notification-icon');
  
  if (isLoggedIn && currentUser) {
    // Hide auth buttons, show user menu
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'block';
      
      // Update user info
      const userAvatar = $('#user-avatar-img');
      const userName = $('#user-name');
      
      if (userAvatar) {
        userAvatar.src = currentUser.avatarUrl || 'https://via.placeholder.com/32/ff69b4/ffffff?text=🐾';
        userAvatar.alt = currentUser.fullName;
      }
      
      if (userName) {
        userName.textContent = currentUser.fullName;
      }
      
      // Update balance display
      updateUserBalance();
      
      // Update seller status display
      const myListingsLink = $('#my-listings-link');
      const becomeSellerLink = $('#become-seller-link');
      
      if (currentUser.canSell) {
        if (myListingsLink) myListingsLink.style.display = 'block';
        if (becomeSellerLink) becomeSellerLink.style.display = 'none';
      } else {
        if (myListingsLink) myListingsLink.style.display = 'none';
        if (becomeSellerLink) becomeSellerLink.style.display = 'block';
      }
      
      // Update profile links based on role
      updateNavigationByRole(currentUser.role);
    }
    
    // Show cart and notification icons when authenticated
    if (cartIcon) cartIcon.style.display = 'block';
    if (notificationIcon) notificationIcon.style.display = 'block';
    
    // Show admin navigation if user is admin
    if (adminNav) {
      adminNav.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    }
  } else {
    // Show auth buttons, hide user menu
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (adminNav) adminNav.style.display = 'none';
    
    // Hide cart and notification icons when not authenticated
    if (cartIcon) cartIcon.style.display = 'none';
    if (notificationIcon) notificationIcon.style.display = 'none';
  }
};

// Update navigation based on user role
const updateNavigationByRole = (role) => {
  const profileLink = $('#profile-link');
  const ordersLink = $('#orders-link');
  
  if (profileLink) {
    switch (role) {
      case 'seller':
        profileLink.href = '#seller-portal';
        profileLink.onclick = () => checkAuthentication('seller') && showSection('seller-portal');
        break;
      case 'admin':
        profileLink.href = '#admin-portal';
        profileLink.onclick = () => checkAuthentication('admin') && showSection('admin-portal');
        break;
      case 'support':
        profileLink.href = '#chat-portal';
        profileLink.onclick = () => showSection('chat-portal');
        break;
      default:
        profileLink.href = '#buyer-portal';
        profileLink.onclick = () => showSection('buyer-portal');
    }
  }
  
  if (ordersLink) {
    if (role === 'seller') {
      ordersLink.href = '#seller-portal';
      ordersLink.onclick = () => checkAuthentication('seller') && showSection('seller-portal');
    } else {
      ordersLink.href = '#buyer-portal';
      ordersLink.onclick = () => showSection('buyer-portal');
    }
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
  
  // Setup cart functionality
  initCartFunctionality();
  
  // Setup notifications
  initNotificationSystem();
  
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

// Initialize cart functionality
const initCartFunctionality = () => {
  const cartIcon = $('#cart-icon');
  const cartBadge = $('#cart-badge');
  
  if (cartIcon) {
    on(cartIcon, 'click', () => {
      showCartModal();
    });
  }
  
  // Update cart count from localStorage
  updateCartBadge();
  
  // Listen for cart updates
  window.addEventListener('cart:updated', updateCartBadge);
};

// Initialize notification system
const initNotificationSystem = () => {
  const notificationIcon = $('#notification-icon');
  const notificationBadge = $('#notification-badge');
  
  if (notificationIcon) {
    on(notificationIcon, 'click', () => {
      showNotificationsModal();
    });
  }
  
  // Update notification count
  updateNotificationBadge();
  
  // Check for new notifications periodically
  if (currentUser) {
    setInterval(checkNewNotifications, 30000); // Check every 30 seconds
  }
};

// Update cart badge
const updateCartBadge = () => {
  const cartBadge = $('#cart-badge');
  if (cartBadge) {
    const cart = storage.get('cart') || [];
    const itemCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    cartBadge.textContent = itemCount;
    cartBadge.style.display = itemCount > 0 ? 'flex' : 'none';
  }
};

// Update notification badge
const updateNotificationBadge = () => {
  const notificationBadge = $('#notification-badge');
  if (notificationBadge) {
    const unreadCount = storage.get('unreadNotifications') || 0;
    notificationBadge.textContent = unreadCount;
    notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
  }
};

// Show cart modal
const showCartModal = () => {
  const cart = storage.get('cart') || [];
  const cartHTML = `
    <div class="modal-header">
      <h3><i class="fas fa-shopping-cart"></i> Giỏ hàng của bạn</h3>
      <button onclick="closeModal('cart-modal')" class="modal-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body">
      ${cart.length === 0 ? 
        '<div class="empty-cart" style="text-align: center; padding: 2rem;"><i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i><p>Giỏ hàng trống</p></div>' :
        cart.map(item => `
          <div class="cart-item" data-pet-id="${item.id}" style="display: flex; gap: 1rem; padding: 1rem; border-bottom: 1px solid #eee;">
            <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
            <div class="cart-item-details" style="flex: 1;">
              <h4 style="margin: 0 0 0.5rem 0;">${item.name}</h4>
              <p class="cart-item-price" style="color: var(--pink-accent); font-weight: bold; margin: 0 0 0.5rem 0;">$${item.price}</p>
              <div class="cart-item-actions" style="display: flex; gap: 0.5rem;">
                <button onclick="removeFromCart('${item.id}')" class="btn btn-sm btn-outline">
                  <i class="fas fa-trash"></i> Xóa
                </button>
                <button onclick="contactSeller('${item.sellerId}')" class="btn btn-sm btn-primary">
                  <i class="fas fa-comments"></i> Liên hệ
                </button>
              </div>
            </div>
          </div>
        `).join('')
      }
    </div>
    ${cart.length > 0 ? `
      <div class="modal-footer">
        <button onclick="checkoutCart()" class="btn btn-primary btn-large">
          <i class="fas fa-credit-card"></i> Thanh toán
        </button>
      </div>
    ` : ''}
  `;
  
  showModal('cart-modal', cartHTML);
};

// Show notifications modal
const showNotificationsModal = () => {
  const notifications = storage.get('notifications') || [];
  const notificationHTML = `
    <div class="modal-header">
      <h3><i class="fas fa-bell"></i> Thông báo</h3>
      <button onclick="closeModal('notifications-modal')" class="modal-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body">
      ${notifications.length === 0 ? 
        '<div class="empty-notifications" style="text-align: center; padding: 2rem;"><i class="fas fa-bell-slash" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i><p>Không có thông báo mới</p></div>' :
        notifications.map(notification => `
          <div class="notification-item ${notification.read ? '' : 'unread'}" style="display: flex; gap: 1rem; padding: 1rem; border-bottom: 1px solid #eee; ${!notification.read ? 'background: #fff8f0;' : ''}">
            <div class="notification-icon" style="width: 40px; height: 40px; background: var(--pink-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--pink-accent);">
              <i class="fas ${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content" style="flex: 1;">
              <h4 style="margin: 0 0 0.25rem 0; font-size: 0.9rem;">${notification.title}</h4>
              <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.8rem;">${notification.message}</p>
              <span class="notification-time" style="font-size: 0.7rem; color: #999;">${formatTime(notification.timestamp)}</span>
            </div>
          </div>
        `).join('')
      }
    </div>
    <div class="modal-footer">
      <button onclick="markAllNotificationsRead()" class="btn btn-outline">
        <i class="fas fa-check-double"></i> Đánh dấu đã đọc
      </button>
    </div>
  `;
  
  showModal('notifications-modal', notificationHTML);
};

// Helper functions for notifications
const getNotificationIcon = (type) => {
  const icons = {
    favorite: 'fa-heart',
    message: 'fa-comment',
    order: 'fa-shopping-bag',
    admin: 'fa-cog',
    default: 'fa-bell'
  };
  return icons[type] || icons.default;
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

// Global functions for cart and notifications
window.removeFromCart = (petId) => {
  const cart = storage.get('cart') || [];
  const updatedCart = cart.filter(item => item.id !== petId);
  storage.set('cart', updatedCart);
  window.dispatchEvent(new CustomEvent('cart:updated'));
  showCartModal(); // Refresh modal
  showToast('Đã xóa khỏi giỏ hàng', 'success');
};

window.contactSeller = (sellerId) => {
  closeModal('cart-modal');
  // Navigate to chat or contact form
  showToast('Mở cửa sổ chat...', 'info');
};

window.checkoutCart = () => {
  closeModal('cart-modal');
  showToast('Chức năng thanh toán đang được phát triển', 'info');
};

window.markAllNotificationsRead = () => {
  const notifications = storage.get('notifications') || [];
  const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
  storage.set('notifications', updatedNotifications);
  storage.set('unreadNotifications', 0);
  updateNotificationBadge();
  showNotificationsModal(); // Refresh modal
  showToast('Đã đánh dấu tất cả thông báo', 'success');
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
    <a href="#buyer" onclick="showPetDetails('${pet.slug}')" class="suggestion-item">
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
    // Navigate to buyer section and set search query
    showSection('buyer');
    const searchInput = $('#pet-search');
    if (searchInput) searchInput.value = query;
    // Trigger search functionality if it exists
    if (window.searchPets) window.searchPets(query);
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
  if (hash && hash.match(/^[a-zA-Z][\w-]*$/)) { // Valid CSS identifier
    const element = $('#' + hash);
    if (element) {
      showSection(hash);
    }
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
    if (checkAuthentication('seller')) {
      initSellerPortal();
    } else {
      return; // Don't proceed if authentication failed
    }
  } else if (sectionId === 'admin-portal') {
    if (checkAuthentication('admin')) {
      initAdminPortal();
    } else {
      return; // Don't proceed if authentication failed
    }
  } else if (sectionId === 'chat-portal') {
    initChatPortal();
  }

  // Close mobile menu if open
  const mobileMenu = $('#mobile-menu');
  if (mobileMenu) {
    mobileMenu.style.display = 'none';
  }
};

// Show pet details in buyer section
const showPetDetails = (petSlug) => {
  // Navigate to buyer section first
  showSection('buyer');
  
  // If pet details functionality exists, call it
  if (window.displayPetDetails && typeof window.displayPetDetails === 'function') {
    window.displayPetDetails(petSlug);
  } else {
    // Fallback: try to find and trigger pet search
    const searchInput = $('#pet-search');
    if (searchInput) {
      searchInput.value = petSlug;
      // Trigger search if function exists
      if (window.searchPets && typeof window.searchPets === 'function') {
        window.searchPets(petSlug);
      }
    }
  }
};

// Initialize pet showcase carousel
const initCarousel = () => {
  const carousel = $('#pet-carousel');
  const slides = $$('.carousel-slide');
  const indicators = $$('.indicator');
  
  if (!carousel || slides.length === 0) return;
  
  let currentSlide = 0;
  let autoInterval = null;
  const totalSlides = slides.length;
  
  // Function to show specific slide
  const showSlide = (index) => {
    // Remove active class from all slides and indicators
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Add active class to current slide and indicator
    slides[index].classList.add('active');
    indicators[index].classList.add('active');
    
    currentSlide = index;
  };
  
  // Auto-advance carousel
  const autoAdvance = () => {
    const nextSlide = (currentSlide + 1) % totalSlides;
    showSlide(nextSlide);
  };
  
  // Start auto-advancement
  const startAutoAdvance = () => {
    autoInterval = setInterval(autoAdvance, 4000); // Change slide every 4 seconds
  };
  
  // Stop auto-advancement
  const stopAutoAdvance = () => {
    if (autoInterval) {
      clearInterval(autoInterval);
      autoInterval = null;
    }
  };
  
  // Add click handlers to indicators
  indicators.forEach((indicator, index) => {
    on(indicator, 'click', () => {
      showSlide(index);
    });
  });
  
  // Start auto-advancement
  startAutoAdvance();
  
  // Pause on hover
  on(carousel, 'mouseenter', stopAutoAdvance);
  
  // Resume on mouse leave
  on(carousel, 'mouseleave', startAutoAdvance);
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
  
  // Handle create listing form submission
  const createListingForm = $('#create-listing-form');
  if (createListingForm) {
    on(createListingForm, 'submit', handleCreateListing);
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

// Handle create listing form submission
const handleCreateListing = async (event) => {
  event.preventDefault();
  
  // Check if user is logged in
  if (!currentUser) {
    showToast('Vui lòng đăng nhập để đăng tin', 'error');
    return;
  }
  
  // Check if user can sell
  if (!currentUser.canSell) {
    showToast('Bạn cần đăng ký trở thành người bán để có thể đăng tin', 'error');
    becomeSeller();
    return;
  }
  
  // Check and deduct posting fee
  if (!deductPostingFee()) {
    return; // Fee deduction failed
  }
  
  const formData = utils.form.serialize(event.target);
  
  try {
    showLoading();
    const response = await api.petsAPI.createPet(formData);
    
    if (response.success) {
      closeModal('create-listing-modal');
      showToast('Đăng tin thành công!', 'success');
      
      // Reset form
      event.target.reset();
      
      // Refresh listings if on seller portal
      if (window.location.hash.includes('seller') || $('.page-section#seller-portal').style.display !== 'none') {
        loadSellerListings();
      }
    }
    
  } catch (error) {
    // If listing creation failed, refund the fee
    userBalance += 0.5;
    updateUserBalance();
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

const showModal = (modalId, content = null) => {
  let modal = $(`#${modalId}`);
  
  // Create modal if it doesn't exist
  if (!modal) {
    modal = utils.createElement('div', {
      id: modalId,
      className: 'modal',
      innerHTML: `
        <div class="modal-content">
          <div class="modal-body"></div>
        </div>
      `
    });
    document.body.appendChild(modal);
  }
  
  // Update content if provided
  if (content) {
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
      modalBody.innerHTML = content;
    } else {
      // If no modal-body exists, replace the entire modal-content
      const modalContent = modal.querySelector('.modal-content');
      if (modalContent) {
        modalContent.innerHTML = content;
      }
    }
  }
  
  // Show the modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
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
    <a href="#buyer" onclick="showPetDetails('${pet.slug}')" class="pet-card">
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
      displayPets(response.pets || []);
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

// Check authentication before accessing certain sections
window.checkAuthentication = (requiredRole) => {
  if (!currentUser) {
    showToast('Bạn cần đăng nhập để truy cập tính năng này! 💕', 'warning');
    showAuthModal('login');
    return false;
  }
  
  if (requiredRole === 'seller' && currentUser.role !== 'seller' && currentUser.role !== 'admin') {
    showToast('Bạn cần có quyền người bán để đăng tin! 🐾', 'warning');
    return false;
  }
  
  if (requiredRole === 'admin' && currentUser.role !== 'admin') {
    showToast('Bạn không có quyền truy cập trang quản trị! 👑', 'error');
    return false;
  }
  
  return true;
};

// Authentication-required pet actions
window.toggleFavorite = (petId) => {
  if (!currentUser) {
    showToast('Bạn cần đăng nhập để yêu thích thú cưng! 💕', 'warning');
    showAuthModal('login');
    return;
  }
  
  console.log('Toggle favorite for pet:', petId);
  showToast('Đã thêm vào danh sách yêu thích! 💖', 'success');
};

window.addToCart = (petId) => {
  if (!currentUser) {
    showToast('Bạn cần đăng nhập để mua thú cưng! 🐾', 'warning');
    showAuthModal('login');
    return;
  }
  
  console.log('Add to cart pet:', petId);
  showToast('Đã thêm vào giỏ hàng! 🛒💕', 'success');
};

window.viewPetDetails = (petId) => {
  console.log('View pet details:', petId);
  openModal('pet-detail-modal');
};

// Placeholder seller functions with authentication
window.editListing = (listingId) => {
  if (!checkAuthentication('seller')) return;
  console.log('Edit listing:', listingId);
  showToast('Tính năng đang được phát triển 🔧', 'info');
};

window.toggleListingStatus = (listingId) => {
  if (!checkAuthentication('seller')) return;
  console.log('Toggle listing status:', listingId);
  showToast('Tính năng đang được phát triển 🔧', 'info');
};

window.deleteListing = (listingId) => {
  if (!checkAuthentication('seller')) return;
  console.log('Delete listing:', listingId);
  showToast('Tính năng đang được phát triển 🔧', 'info');
};

// Admin functions
window.loadPendingListings = () => {
  if (!checkAuthentication('admin')) return;
  console.log('Loading pending listings...');
  showToast('Đang tải danh sách chờ duyệt... 👑', 'info');
};

window.saveSystemSettings = () => {
  if (!checkAuthentication('admin')) return;
  console.log('Saving system settings...');
  showToast('Đã lưu cài đặt hệ thống! ⚙️', 'success');
};

// Enhanced Chat functions with better mobile support
window.sendChatMessage = () => {
  const chatInput = $('#chat-input');
  const chatMessages = $('#chat-messages');
  
  if (!chatInput || !chatMessages) return;
  
  const message = chatInput.value.trim();
  if (!message) return;
  
  // Add typing indicator for better UX
  showTypingIndicator();
  
  // Add user message with enhanced mobile styling
  const messageHTML = `
    <div class="message user-message" style="animation: slideInRight 0.3s ease-out;">
      <div class="message-avatar">
        <i class="fas fa-user cute-icon"></i>
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="sender-name">${currentUser?.fullName || 'Bạn'}</span>
          <span class="message-time">${new Date().toLocaleTimeString('vi-VN')}</span>
        </div>
        <div class="message-text">
          <p>${message}</p>
        </div>
      </div>
    </div>
  `;
  
  chatMessages.insertAdjacentHTML('beforeend', messageHTML);
  chatInput.value = '';
  
  // Auto-scroll with smooth behavior
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });
  
  // Hide mobile keyboard on send
  if (window.innerWidth <= 768) {
    chatInput.blur();
    setTimeout(() => chatInput.focus(), 100);
  }
  
  // Enhanced support response system
  setTimeout(() => {
    hideTypingIndicator();
    
    const responses = [
      'Cảm ơn bạn đã liên hệ! Tôi sẽ hỗ trợ bạn ngay bây giờ 🐾',
      'Tôi hiểu vấn đề của bạn. Hãy để tôi kiểm tra thông tin 💕',
      'Đó là một câu hỏi hay! Tôi sẽ giải đáp chi tiết cho bạn 🌟',
      'Bạn có thể cung cấp thêm thông tin để tôi hỗ trợ tốt hơn không? 🤗',
      'Tôi sẽ giúp bạn giải quyết vấn đề này ngay thôi! 💖',
      'Đây là vấn đề phổ biến, tôi có kinh nghiệm xử lý 🏆'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const supportMessageHTML = `
      <div class="message support-message" style="animation: slideInLeft 0.3s ease-out;">
        <div class="message-avatar">
          <i class="fas fa-headset cute-icon"></i>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="sender-name">Hỗ trợ viên PetMarket</span>
            <span class="message-time">${new Date().toLocaleTimeString('vi-VN')}</span>
          </div>
          <div class="message-text">
            <p>${randomResponse}</p>
          </div>
        </div>
      </div>
    `;
    
    chatMessages.insertAdjacentHTML('beforeend', supportMessageHTML);
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: 'smooth'
    });
    
    // Play notification sound (if enabled)
    playNotificationSound();
    
  }, 1000 + Math.random() * 2000);
};

// Enhanced typing indicator
const showTypingIndicator = () => {
  const chatMessages = $('#chat-messages');
  if (!chatMessages) return;
  
  const typingHTML = `
    <div class="message support-message typing-indicator" id="typing-indicator">
      <div class="message-avatar">
        <i class="fas fa-headset cute-icon"></i>
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="sender-name">Hỗ trợ viên PetMarket</span>
          <span class="message-time">đang gõ...</span>
        </div>
        <div class="message-text">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  chatMessages.insertAdjacentHTML('beforeend', typingHTML);
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });
};

const hideTypingIndicator = () => {
  const typingIndicator = $('#typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
};

// Enhanced quick message function
window.sendQuickMessage = (message) => {
  const chatInput = $('#chat-input');
  if (chatInput) {
    chatInput.value = message;
    sendChatMessage();
    
    // Provide haptic feedback on mobile
    if (navigator.vibrate && window.innerWidth <= 768) {
      navigator.vibrate(50);
    }
  }
};

// Enhanced file attachment with mobile support
window.attachFile = () => {
  if (window.innerWidth <= 768) {
    showToast('📎 Tính năng đính kèm file sẽ có trong phiên bản tiếp theo!', 'info');
  } else {
    showToast('Tính năng đính kèm file đang được phát triển 📎', 'info');
  }
  
  // Future: implement file picker
  // const input = document.createElement('input');
  // input.type = 'file';
  // input.accept = 'image/*,.pdf,.doc,.docx';
  // input.click();
};

// Enhanced emoji picker
window.addEmoji = () => {
  const chatInput = $('#chat-input');
  if (chatInput) {
    const emojis = ['🐶', '🐱', '🐦', '🐠', '🐰', '🐾', '💕', '😊', '❤️', '🌟', '🤗', '😍', '🥰', '💖'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    chatInput.value += ` ${randomEmoji}`;
    chatInput.focus();
    
    // Show emoji picker on mobile (future enhancement)
    if (window.innerWidth <= 768) {
      showToast(`Đã thêm ${randomEmoji}`, 'success');
    }
  }
};

// Enhanced end chat function
window.endChat = () => {
  showToast('Cảm ơn bạn đã sử dụng dịch vụ hỗ trợ! 💖', 'success');
  const chatMessages = $('#chat-messages');
  if (chatMessages) {
    setTimeout(() => {
      const goodbyeMessage = `
        <div class="message support-message" style="animation: slideInLeft 0.3s ease-out;">
          <div class="message-avatar">
            <i class="fas fa-headset cute-icon"></i>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="sender-name">Hỗ trợ viên PetMarket</span>
              <span class="message-time">${new Date().toLocaleTimeString('vi-VN')}</span>
            </div>
            <div class="message-text">
              <p>Cảm ơn bạn đã liên hệ với PetMarket! Chúc bạn có những trải nghiệm tuyệt vời với những người bạn thú cưng 🐾💕</p>
              <p><em>Đánh giá chất lượng hỗ trợ: ⭐⭐⭐⭐⭐</em></p>
            </div>
          </div>
        </div>
      `;
      chatMessages.insertAdjacentHTML('beforeend', goodbyeMessage);
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
      });
    }, 500);
  }
};

// Notification sound (soft beep)
const playNotificationSound = () => {
  if (typeof Audio !== 'undefined') {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Silent fail if audio not supported
    }
  }
};

// Placeholder pet interaction functions
// Add admin tab functionality
window.addEventListener('DOMContentLoaded', () => {
  // Setup admin tabs
  const tabBtns = $$('.tab-btn');
  tabBtns.forEach(btn => {
    on(btn, 'click', () => {
      // Remove active class from all tabs and content
      $$('.tab-btn').forEach(b => b.classList.remove('active'));
      $$('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab
      btn.classList.add('active');
      
      // Show corresponding content
      const tabId = btn.dataset.tab;
      if (tabId && tabId.match(/^[a-zA-Z][\w-]*$/)) {
        const tabContent = $(`#${tabId}`);
        if (tabContent) {
          tabContent.classList.add('active');
        }
      }
    });
  });
  
  // Setup chat input enter key
  const chatInput = $('#chat-input');
  if (chatInput) {
    on(chatInput, 'keypress', (e) => {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });
  }
  
  // Setup chat topic selection
  const chatOptionBtns = $$('.chat-option-btn');
  chatOptionBtns.forEach(btn => {
    on(btn, 'click', () => {
      chatOptionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const topic = btn.dataset.topic;
      const topicMessages = {
        general: 'Tôi cần hỗ trợ chung về PetMarket',
        buying: 'Tôi muốn tìm hiểu về việc mua thú cưng',
        selling: 'Tôi cần hỗ trợ đăng bán thú cưng',
        technical: 'Tôi gặp vấn đề kỹ thuật với website'
      };
      
      if (topicMessages[topic]) {
        sendQuickMessage(topicMessages[topic]);
      }
    });
  });
});

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

// Initialize admin portal functionality  
const initAdminPortal = () => {
  if (window.adminPortalInitialized) return;
  window.adminPortalInitialized = true;

  console.log('Admin portal initialized');
  showToast('Chào mừng đến trang quản trị! 👑', 'success');
  
  // Load admin statistics
  loadAdminStats();
};

// Initialize chat portal functionality
const initChatPortal = () => {
  if (window.chatPortalInitialized) return;
  window.chatPortalInitialized = true;

  console.log('Chat portal initialized');
  showToast('Chào mừng đến trang hỗ trợ! 💬', 'success');
  
  // Update user name in chat if logged in
  const chatUserName = $('#chat-user-name');
  if (chatUserName && currentUser) {
    chatUserName.textContent = currentUser.fullName || 'Khách hàng';
  }
};

// Load admin statistics
const loadAdminStats = async () => {
  try {
    // Mock data for demonstration
    const stats = {
      totalUsers: 1250,
      totalPets: 856,
      pendingApproval: 23,
      revenueToday: 5420000
    };
    
    updateStatElement('total-users', stats.totalUsers.toLocaleString('vi-VN'));
    updateStatElement('total-pets', stats.totalPets.toLocaleString('vi-VN'));
    updateStatElement('pending-approval', stats.pendingApproval);
    updateStatElement('revenue-today', stats.revenueToday.toLocaleString('vi-VN') + ' VND');
    
    // Animate the numbers
    animateStatNumbers();
  } catch (error) {
    console.error('Error loading admin stats:', error);
  }
};

// Animate stat numbers with cute effect
const animateStatNumbers = () => {
  const statNumbers = $$('.stat-number');
  statNumbers.forEach((element, index) => {
    setTimeout(() => {
      element.style.transform = 'scale(1.1)';
      element.style.color = 'var(--pink-primary)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.color = '';
      }, 300);
    }, index * 200);
  });
};

// Performance monitoring
const performHealthCheck = async () => {
  try {
    // Production API - no specific health check endpoint needed
    console.log('Production API mode enabled');
  } catch (error) {
    console.warn('API check failed:', error);
    showToast('Kết nối API không ổn định. Một số tính năng có thể bị hạn chế.', 'warning');
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
  showModal,
  closeModal,
  getCurrentUser: () => currentUser,
  utils,
  api,
  i18n
};

// Make utilities globally available
window.utils = utils;
window.api = api;
window.i18n = i18n;

// Make functions globally accessible for onclick handlers
window.closeModal = closeModal;
window.openModal = openModal;
window.showModal = showModal;
window.showSection = showSection;

// User balance and seller functionality
let userBalance = 5.00; // Default balance for demo

const updateUserBalance = () => {
  const balanceElement = $('#user-balance');
  if (balanceElement && currentUser) {
    balanceElement.textContent = `$${userBalance.toFixed(2)}`;
  }
};

const openTopUpModal = () => {
  openModal('topup-modal');
  
  // Setup preset button handlers
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remove active from all buttons
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      // Add active to clicked button
      e.target.classList.add('active');
      // Clear custom amount
      $('#custom-amount').value = '';
    });
  });
};

const processTopUp = () => {
  const activePreset = document.querySelector('.preset-btn.active');
  const customAmount = $('#custom-amount').value;
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
  
  let amount = 0;
  if (activePreset) {
    amount = parseFloat(activePreset.dataset.amount);
  } else if (customAmount) {
    amount = parseFloat(customAmount);
  }
  
  if (amount <= 0) {
    showToast('Vui lòng chọn số tiền nạp', 'error');
    return;
  }
  
  if (amount > 1000) {
    showToast('Số tiền nạp không được vượt quá $1000', 'error');
    return;
  }
  
  // Demo payment processing
  showLoading();
  setTimeout(() => {
    userBalance += amount;
    updateUserBalance();
    closeModal('topup-modal');
    hideLoading();
    showToast(`Nạp thành công $${amount.toFixed(2)} vào tài khoản!`, 'success');
    
    // Clear form
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    $('#custom-amount').value = '';
  }, 2000);
};

const becomeSeller = () => {
  if (!currentUser) {
    showToast('Vui lòng đăng nhập để trở thành người bán', 'error');
    return;
  }
  
  // Update user role to include seller
  currentUser.canSell = true;
  
  // Show seller menu item
  const myListingsLink = $('#my-listings-link');
  const becomeSellerLink = $('#become-seller-link');
  
  if (myListingsLink) myListingsLink.style.display = 'block';
  if (becomeSellerLink) becomeSellerLink.style.display = 'none';
  
  showToast('Bạn đã trở thành người bán thành công! Giờ bạn có thể đăng tin bán thú cưng.', 'success');
  
  // Show seller portal
  showSection('seller-portal');
};

const deductPostingFee = () => {
  const POSTING_FEE = 0.5;
  
  if (userBalance < POSTING_FEE) {
    showToast(`Số dư không đủ. Cần $${POSTING_FEE} để đăng tin. Vui lòng nạp thêm tiền.`, 'error');
    openTopUpModal();
    return false;
  }
  
  userBalance -= POSTING_FEE;
  updateUserBalance();
  showToast(`Đã trừ $${POSTING_FEE} phí đăng tin từ tài khoản`, 'info');
  return true;
};

// Make new functions globally available
window.openTopUpModal = openTopUpModal;
window.processTopUp = processTopUp;
window.becomeSeller = becomeSeller;
window.deductPostingFee = deductPostingFee;
window.updateUserBalance = updateUserBalance;