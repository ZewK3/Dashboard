// Application Configuration
const APP_CONFIG = {
  // API Configuration
  API: {
    BASE_URL: "https://zewk.tocotoco.workers.dev/",
    ENDPOINTS: {
      // Authentication
      LOGIN: "loginUser",
      REGISTER: "registerUser",
      USER_INFO: "User",
      
      // Products
      PRODUCTS: "getProducts",
      PRODUCT_BY_ID: "getProductById",
      ADD_PRODUCT: "addProduct",
      UPDATE_PRODUCT: "updateProduct",
      DELETE_PRODUCT: "deleteProduct",
      CATEGORIES: "getCategories",
      
      // Orders
      ORDERS: "getOrders",
      ORDER_BY_ID: "getOrderById",
      SAVE_ORDER: "saveOrder",
      UPDATE_ORDER_STATUS: "updateOrderStatus",
      
      // Stores
      STORES: "getStores",
      NEAREST_STORE: "getNearestStore",
      
      // Analytics
      ANALYTICS: "getAnalytics",
      
      // Transactions
      CHECK_TRANSACTION: "checkTransaction"
    }
  },

  // Store Configuration
  STORE: {
    DEFAULT_COORDS: { lng: 106.650467, lat: 10.782461 },
    DELIVERY_RADIUS: 10, // km
    DELIVERY_FEE: 15000, // VNĐ
    FREE_SHIPPING_THRESHOLD: 200000 // VNĐ
  },

  // Map Configuration
  MAP: {
    MAPBOX_TOKEN: "pk.eyJ1IjoiemV3azExMDYiLCJhIjoiY205d3MwYjI5MHZzaTJtcjBmajl5dWI5diJ9.dP89zeG92u7AeHigH4tJwg",
    GEOCODE_BASE: "https://api.mapbox.com/geocoding/v5/mapbox.places",
    DIRECTIONS_BASE: "https://api.mapbox.com/directions/v5/mapbox/driving/"
  },

  // Payment Configuration
  PAYMENT: {
    QR_BASE_URL: 'https://api.vietqr.io/image/970403-062611062003-sIxhggL.jpg?accountName=LE%20DAI%20LOI',
    TRANSACTION_TIMEOUT: 900000, // 15 minutes in milliseconds
    CHECK_INTERVAL: 5000 // 5 seconds
  },

  // UI Configuration
  UI: {
    PRODUCTS_PER_PAGE: 12,
    ORDERS_PER_PAGE: 20,
    ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 3000,
    DEBOUNCE_DELAY: 500
  },

  // User Configuration
  USER: {
    RANKS: {
      BRONZE: { threshold: 0, name: 'Bronze', color: '#cd7f32' },
      SILVER: { threshold: 250, name: 'Silver', color: '#c0c0c0' },
      GOLD: { threshold: 500, name: 'Gold', color: '#ffd700' },
      DIAMOND: { threshold: 1000, name: 'Diamond', color: '#b9f2ff' }
    },
    DEFAULT_AVATAR: '/assets/images/default-avatar.png'
  },

  // Product Configuration
  PRODUCT: {
    DEFAULT_IMAGE: 'https://via.placeholder.com/300x300?text=No+Image',
    IMAGE_SIZES: {
      THUMBNAIL: '150x150',
      MEDIUM: '300x300',
      LARGE: '600x600'
    },
    DEFAULT_SIZE_OPTIONS: ['M', 'L'],
    DEFAULT_SUGAR_OPTIONS: ['30%', '50%', '70%', '100%'],
    DEFAULT_ICE_OPTIONS: ['Không đá', 'Ít đá', 'Thường', 'Nhiều đá']
  },

  // Order Configuration
  ORDER: {
    STATUSES: {
      PENDING: { value: 'pending', label: 'Chờ xác nhận', color: '#ffc107' },
      CONFIRMED: { value: 'confirmed', label: 'Đã xác nhận', color: '#17a2b8' },
      PREPARING: { value: 'preparing', label: 'Đang chuẩn bị', color: '#fd7e14' },
      DELIVERING: { value: 'delivering', label: 'Đang giao', color: '#6f42c1' },
      COMPLETED: { value: 'completed', label: 'Hoàn thành', color: '#28a745' },
      CANCELLED: { value: 'cancelled', label: 'Đã hủy', color: '#dc3545' }
    },
    AUTO_REFRESH_INTERVAL: 30000 // 30 seconds
  },

  // Local Storage Keys
  STORAGE: {
    TOKEN: 'token',
    USER_INFO: 'userInfo',
    CART: 'cart',
    PREFERENCES: 'preferences',
    LAST_LOCATION: 'lastLocation',
    TRANSACTION_DETAILS: 'transactionDetails'
  },

  // Admin Configuration
  ADMIN: {
    ROLES: ['admin', 'super_admin'],
    PERMISSIONS: {
      VIEW_DASHBOARD: ['admin', 'super_admin'],
      MANAGE_ORDERS: ['admin', 'super_admin'],
      MANAGE_PRODUCTS: ['admin', 'super_admin'],
      MANAGE_STORES: ['super_admin'],
      MANAGE_USERS: ['super_admin'],
      VIEW_ANALYTICS: ['admin', 'super_admin']
    }
  },

  // Error Messages
  ERRORS: {
    NETWORK: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet!',
    SERVER: 'Lỗi server. Vui lòng thử lại sau!',
    UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!',
    FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này!',
    NOT_FOUND: 'Không tìm thấy dữ liệu!',
    VALIDATION: 'Dữ liệu không hợp lệ!',
    UNKNOWN: 'Đã có lỗi xảy ra. Vui lòng thử lại!'
  },

  // Success Messages
  SUCCESS: {
    LOGIN: 'Đăng nhập thành công!',
    REGISTER: 'Đăng ký thành công!',
    LOGOUT: 'Đăng xuất thành công!',
    ORDER_PLACED: 'Đặt hàng thành công!',
    ORDER_UPDATED: 'Cập nhật đơn hàng thành công!',
    PRODUCT_ADDED: 'Thêm sản phẩm thành công!',
    PRODUCT_UPDATED: 'Cập nhật sản phẩm thành công!',
    PRODUCT_DELETED: 'Xóa sản phẩm thành công!'
  }
};

// Feature Flags
const FEATURES = {
  ENABLE_PWA: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_CHAT_SUPPORT: true,
  ENABLE_LOYALTY_PROGRAM: true,
  ENABLE_REVIEWS: true,
  ENABLE_PROMOTIONS: true
};

// Development/Production Environment
const ENV = {
  NODE_ENV: 'production', // Change to 'development' for dev mode
  DEBUG: false,
  LOG_LEVEL: 'error' // 'debug', 'info', 'warn', 'error'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APP_CONFIG, FEATURES, ENV };
}