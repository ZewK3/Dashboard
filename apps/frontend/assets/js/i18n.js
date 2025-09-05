/**
 * Internationalization (i18n) Module for Pet Marketplace
 * Handles multiple language support with Vietnamese and English
 */

import { storage } from './utils.js';

// Current language state
let currentLang = 'vi';
let translations = {};
let isLoaded = false;

// Language configuration
const LANGUAGES = {
  vi: {
    name: 'Tiếng Việt',
    code: 'vi',
    flag: '🇻🇳',
    file: '/apps/frontend/assets/i18n/vi.json'
  },
  en: {
    name: 'English',
    code: 'en',
    flag: '🇺🇸',
    file: '/apps/frontend/assets/i18n/en.json'
  }
};

// Initialize i18n system
export const init = async (defaultLang = 'vi') => {
  // Get saved language or use default
  currentLang = storage.get('language', defaultLang);
  
  // Validate language
  if (!LANGUAGES[currentLang]) {
    currentLang = defaultLang;
  }
  
  // Load translations
  await loadTranslations(currentLang);
  
  // Apply translations to DOM
  applyTranslations();
  
  // Update document language
  document.documentElement.lang = currentLang;
  
  isLoaded = true;
  
  // Dispatch event
  window.dispatchEvent(new CustomEvent('i18n:loaded', {
    detail: { language: currentLang }
  }));
};

// Load translation file
const loadTranslations = async (lang) => {
  try {
    const response = await fetch(LANGUAGES[lang].file);
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${lang}`);
    }
    
    translations = await response.json();
    return translations;
  } catch (error) {
    console.error('Error loading translations:', error);
    
    // Fallback to default language if current language fails
    if (lang !== 'vi') {
      console.log('Falling back to Vietnamese');
      currentLang = 'vi';
      return loadTranslations('vi');
    }
    
    // If Vietnamese also fails, use empty object
    translations = {};
  }
};

// Get translation for a key
export const t = (key, params = {}) => {
  if (!key) return '';
  
  // Split key by dots to handle nested objects
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Return key if translation not found
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }
  }
  
  // Handle string interpolation
  if (typeof value === 'string' && Object.keys(params).length > 0) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return params[param] || match;
    });
  }
  
  return value || key;
};

// Get current language
export const getCurrentLanguage = () => currentLang;

// Get available languages
export const getLanguages = () => LANGUAGES;

// Change language
export const changeLanguage = async (lang) => {
  if (!LANGUAGES[lang]) {
    console.error(`Language ${lang} is not supported`);
    return false;
  }
  
  if (lang === currentLang) {
    return true; // Already using this language
  }
  
  // Load new translations
  currentLang = lang;
  await loadTranslations(lang);
  
  // Save to storage
  storage.set('language', lang);
  
  // Apply to DOM
  applyTranslations();
  
  // Update document language
  document.documentElement.lang = lang;
  
  // Dispatch event
  window.dispatchEvent(new CustomEvent('i18n:changed', {
    detail: { language: lang }
  }));
  
  return true;
};

// Apply translations to DOM elements
export const applyTranslations = () => {
  // Find all elements with data-i18n attribute
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const params = element.dataset.i18nParams ? 
      JSON.parse(element.dataset.i18nParams) : {};
    
    const translation = t(key, params);
    
    // Apply translation based on element type
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      if (element.type === 'submit' || element.type === 'button') {
        element.value = translation;
      } else {
        element.placeholder = translation;
      }
    } else {
      element.textContent = translation;
    }
  });
  
  // Update title if exists
  const titleKey = document.documentElement.getAttribute('data-i18n-title');
  if (titleKey) {
    document.title = t(titleKey);
  }
  
  // Update meta description if exists
  const metaDesc = document.querySelector('meta[name="description"]');
  const descKey = metaDesc?.getAttribute('data-i18n');
  if (metaDesc && descKey) {
    metaDesc.content = t(descKey);
  }
};

// Format number based on current language
export const formatNumber = (number, options = {}) => {
  const locale = currentLang === 'vi' ? 'vi-VN' : 'en-US';
  return new Intl.NumberFormat(locale, options).format(number);
};

// Format currency based on current language
export const formatCurrency = (amount, currency = 'VND') => {
  const locale = currentLang === 'vi' ? 'vi-VN' : 'en-US';
  
  if (currency === 'VND') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Format date based on current language
export const formatDate = (date, options = {}) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  const locale = currentLang === 'vi' ? 'vi-VN' : 'en-US';
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
};

// Format relative time based on current language
export const formatRelativeTime = (date) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  const locale = currentLang === 'vi' ? 'vi-VN' : 'en-US';
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  const diff = date.getTime() - Date.now();
  const diffInSeconds = Math.round(diff / 1000);
  const diffInMinutes = Math.round(diffInSeconds / 60);
  const diffInHours = Math.round(diffInMinutes / 60);
  const diffInDays = Math.round(diffInHours / 24);
  
  if (Math.abs(diffInDays) >= 1) {
    return rtf.format(diffInDays, 'day');
  } else if (Math.abs(diffInHours) >= 1) {
    return rtf.format(diffInHours, 'hour');
  } else if (Math.abs(diffInMinutes) >= 1) {
    return rtf.format(diffInMinutes, 'minute');
  } else {
    return rtf.format(diffInSeconds, 'second');
  }
};

// Get localized text for common terms
export const getLocalizedText = (key) => {
  const commonTexts = {
    // Pet species
    dog: currentLang === 'vi' ? 'Chó' : 'Dog',
    cat: currentLang === 'vi' ? 'Mèo' : 'Cat',
    bird: currentLang === 'vi' ? 'Chim' : 'Bird',
    fish: currentLang === 'vi' ? 'Cá' : 'Fish',
    rabbit: currentLang === 'vi' ? 'Thỏ' : 'Rabbit',
    hamster: currentLang === 'vi' ? 'Chuột hamster' : 'Hamster',
    reptile: currentLang === 'vi' ? 'Bò sát' : 'Reptile',
    other: currentLang === 'vi' ? 'Khác' : 'Other',
    
    // Gender
    male: currentLang === 'vi' ? 'Đực' : 'Male',
    female: currentLang === 'vi' ? 'Cái' : 'Female',
    unknown: currentLang === 'vi' ? 'Không rõ' : 'Unknown',
    
    // Status
    active: currentLang === 'vi' ? 'Hoạt động' : 'Active',
    inactive: currentLang === 'vi' ? 'Không hoạt động' : 'Inactive',
    pending: currentLang === 'vi' ? 'Chờ duyệt' : 'Pending',
    approved: currentLang === 'vi' ? 'Đã duyệt' : 'Approved',
    rejected: currentLang === 'vi' ? 'Đã từ chối' : 'Rejected',
    sold: currentLang === 'vi' ? 'Đã bán' : 'Sold',
    archived: currentLang === 'vi' ? 'Đã lưu trữ' : 'Archived',
    
    // Order status
    confirmed: currentLang === 'vi' ? 'Đã xác nhận' : 'Confirmed',
    preparing: currentLang === 'vi' ? 'Đang chuẩn bị' : 'Preparing',
    shipped: currentLang === 'vi' ? 'Đã gửi' : 'Shipped',
    delivered: currentLang === 'vi' ? 'Đã giao' : 'Delivered',
    cancelled: currentLang === 'vi' ? 'Đã hủy' : 'Cancelled',
    refunded: currentLang === 'vi' ? 'Đã hoàn tiền' : 'Refunded',
    
    // Payment methods
    cod: currentLang === 'vi' ? 'Thanh toán khi nhận hàng' : 'Cash on Delivery',
    transfer: currentLang === 'vi' ? 'Chuyển khoản' : 'Bank Transfer',
    escrow: currentLang === 'vi' ? 'Ký quỹ' : 'Escrow',
    card: currentLang === 'vi' ? 'Thẻ tín dụng' : 'Credit Card',
    
    // Delivery methods
    pickup: currentLang === 'vi' ? 'Tự đến lấy' : 'Pickup',
    ship: currentLang === 'vi' ? 'Giao hàng' : 'Shipping',
    meetup: currentLang === 'vi' ? 'Gặp mặt' : 'Meetup',
    
    // Common actions
    save: currentLang === 'vi' ? 'Lưu' : 'Save',
    cancel: currentLang === 'vi' ? 'Hủy' : 'Cancel',
    delete: currentLang === 'vi' ? 'Xóa' : 'Delete',
    edit: currentLang === 'vi' ? 'Sửa' : 'Edit',
    view: currentLang === 'vi' ? 'Xem' : 'View',
    add: currentLang === 'vi' ? 'Thêm' : 'Add',
    remove: currentLang === 'vi' ? 'Xóa' : 'Remove',
    search: currentLang === 'vi' ? 'Tìm kiếm' : 'Search',
    filter: currentLang === 'vi' ? 'Lọc' : 'Filter',
    sort: currentLang === 'vi' ? 'Sắp xếp' : 'Sort',
    
    // Time periods
    today: currentLang === 'vi' ? 'Hôm nay' : 'Today',
    yesterday: currentLang === 'vi' ? 'Hôm qua' : 'Yesterday',
    thisWeek: currentLang === 'vi' ? 'Tuần này' : 'This Week',
    thisMonth: currentLang === 'vi' ? 'Tháng này' : 'This Month',
    thisYear: currentLang === 'vi' ? 'Năm này' : 'This Year'
  };
  
  return commonTexts[key] || key;
};

// Get direction for current language (for RTL support in future)
export const getDirection = () => {
  // Currently only support LTR languages
  return 'ltr';
};

// Check if system is loaded
export const isLoaded = () => isLoaded;

// Add new translations dynamically
export const addTranslations = (newTranslations, lang = currentLang) => {
  if (lang === currentLang) {
    translations = { ...translations, ...newTranslations };
    applyTranslations();
  }
};

// Get all current translations
export const getTranslations = () => translations;

// Pluralization helper
export const plural = (count, singular, plural = null) => {
  if (currentLang === 'vi') {
    // Vietnamese doesn't have plural forms
    return singular;
  }
  
  // English pluralization
  if (count === 1) {
    return singular;
  }
  
  if (plural) {
    return plural;
  }
  
  // Simple English pluralization rules
  if (singular.endsWith('s') || singular.endsWith('sh') || singular.endsWith('ch') || 
      singular.endsWith('x') || singular.endsWith('z')) {
    return singular + 'es';
  } else if (singular.endsWith('y')) {
    return singular.slice(0, -1) + 'ies';
  } else {
    return singular + 's';
  }
};

// Language detection from browser
export const detectLanguage = () => {
  const browserLang = navigator.language || navigator.languages[0];
  
  if (browserLang.startsWith('vi')) {
    return 'vi';
  } else if (browserLang.startsWith('en')) {
    return 'en';
  }
  
  return 'vi'; // Default to Vietnamese
};

// Setup language switcher UI
export const setupLanguageSwitcher = () => {
  const langToggle = document.getElementById('lang-toggle');
  const currentLangSpan = document.getElementById('current-lang');
  
  if (!langToggle) return;
  
  // Update current language display
  const updateDisplay = () => {
    if (currentLangSpan) {
      currentLangSpan.textContent = LANGUAGES[currentLang].code.toUpperCase();
    }
    
    langToggle.setAttribute('aria-label', 
      currentLang === 'vi' ? 'Chuyển sang tiếng Anh' : 'Switch to Vietnamese'
    );
  };
  
  // Initial display update
  updateDisplay();
  
  // Click handler
  langToggle.addEventListener('click', async () => {
    const newLang = currentLang === 'vi' ? 'en' : 'vi';
    const success = await changeLanguage(newLang);
    
    if (success) {
      updateDisplay();
    }
  });
  
  // Listen for language changes
  window.addEventListener('i18n:changed', updateDisplay);
};

// Export default object
export default {
  init,
  t,
  getCurrentLanguage,
  getLanguages,
  changeLanguage,
  applyTranslations,
  formatNumber,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getLocalizedText,
  getDirection,
  isLoaded,
  addTranslations,
  getTranslations,
  plural,
  detectLanguage,
  setupLanguageSwitcher
};