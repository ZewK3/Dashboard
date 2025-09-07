/**
 * Utility Functions for Pet Marketplace
 * Common helper functions used throughout the application
 */

// DOM manipulation utilities
export const $ = (selector) => {
  try {
    if (!selector || selector.trim() === '' || selector === '#') {
      return null;
    }
    return document.querySelector(selector);
  } catch (error) {
    console.warn('Invalid CSS selector:', selector, error);
    return null;
  }
};
export const $$ = (selector) => {
  try {
    if (!selector || selector.trim() === '') {
      return [];
    }
    return document.querySelectorAll(selector);
  } catch (error) {
    console.warn('Invalid CSS selector:', selector, error);
    return [];
  }
};

// Create element with attributes and content
export const createElement = (tag, attributes = {}, content = '') => {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else {
      element[key] = value;
    }
  });
  
  if (content) {
    element.innerHTML = content;
  }
  
  return element;
};

// Event handling utilities
export const on = (element, event, handler, options = {}) => {
  if (typeof element === 'string') {
    element = $(element);
  }
  
  if (element) {
    element.addEventListener(event, handler, options);
  }
};

export const off = (element, event, handler) => {
  if (typeof element === 'string') {
    element = $(element);
  }
  
  if (element) {
    element.removeEventListener(event, handler);
  }
};

export const trigger = (element, event, data = {}) => {
  if (typeof element === 'string') {
    element = $(element);
  }
  
  if (element) {
    const customEvent = new CustomEvent(event, { detail: data });
    element.dispatchEvent(customEvent);
  }
};

// Class manipulation utilities
export const addClass = (element, className) => {
  if (typeof element === 'string') {
    element = $(element);
  }
  
  if (element) {
    element.classList.add(className);
  }
};

export const removeClass = (element, className) => {
  if (typeof element === 'string') {
    element = $(element);
  }
  
  if (element) {
    element.classList.remove(className);
  }
};

export const toggleClass = (element, className) => {
  if (typeof element === 'string') {
    element = $(element);
  }
  
  if (element) {
    element.classList.toggle(className);
  }
};

export const hasClass = (element, className) => {
  if (typeof element === 'string') {
    element = $(element);
  }
  
  return element ? element.classList.contains(className) : false;
};

// Debounce function for search and input handling
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Throttle function for scroll and resize events
export const throttle = (func, delay) => {
  let lastExecTime = 0;
  return (...args) => {
    const currentTime = Date.now();
    if (currentTime - lastExecTime > delay) {
      func.apply(null, args);
      lastExecTime = currentTime;
    }
  };
};

// Local storage utilities
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
  
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

// Session storage utilities
export const sessionStorage = {
  get(key, defaultValue = null) {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return defaultValue;
    }
  },
  
  set(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to sessionStorage:', error);
      return false;
    }
  },
  
  remove(key) {
    try {
      window.sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
      return false;
    }
  }
};

// URL and query parameter utilities
export const url = {
  getParams() {
    return new URLSearchParams(window.location.search);
  },
  
  getParam(key, defaultValue = null) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || defaultValue;
  },
  
  setParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
  },
  
  removeParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url);
  },
  
  updateParams(params) {
    const url = new URL(window.location);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.pushState({}, '', url);
  }
};

// Format utilities
export const format = {
  // Format currency (VND)
  currency(amount, currency = 'VND') {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }
    
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },
  
  // Format number with separators
  number(num, locale = 'vi-VN') {
    if (typeof num !== 'number') {
      num = parseFloat(num) || 0;
    }
    
    return new Intl.NumberFormat(locale).format(num);
  },
  
  // Format date
  date(date, locale = 'vi-VN', options = {}) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
  },
  
  // Format relative time (e.g., "2 hours ago")
  relativeTime(date, locale = 'vi-VN') {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
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
  },
  
  // Truncate text with ellipsis
  truncate(text, maxLength = 100, suffix = '...') {
    if (!text || text.length <= maxLength) {
      return text;
    }
    
    return text.slice(0, maxLength - suffix.length) + suffix;
  },
  
  // Create slug from text
  slug(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  },
  
  // Format file size
  fileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// Validation utilities
export const validate = {
  email(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  phone(phone) {
    // Vietnamese phone number pattern
    const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },
  
  required(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },
  
  minLength(value, min) {
    return value && value.toString().length >= min;
  },
  
  maxLength(value, max) {
    return !value || value.toString().length <= max;
  },
  
  numeric(value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
  },
  
  positive(value) {
    return this.numeric(value) && parseFloat(value) > 0;
  },
  
  url(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

// Form utilities
export const form = {
  serialize(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        // Handle multiple values (checkboxes, multi-select)
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }
    
    return data;
  },
  
  validate(formElement, rules = {}) {
    const data = this.serialize(formElement);
    const errors = {};
    
    Object.entries(rules).forEach(([field, fieldRules]) => {
      const value = data[field];
      const fieldErrors = [];
      
      fieldRules.forEach(rule => {
        if (typeof rule === 'function') {
          const result = rule(value);
          if (result !== true) {
            fieldErrors.push(result);
          }
        } else if (typeof rule === 'object') {
          const { validator, message } = rule;
          if (!validator(value)) {
            fieldErrors.push(message);
          }
        }
      });
      
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      data
    };
  },
  
  showErrors(formElement, errors) {
    // Clear previous errors
    const errorElements = formElement.querySelectorAll('.field-error');
    errorElements.forEach(el => el.remove());
    
    // Show new errors
    Object.entries(errors).forEach(([field, fieldErrors]) => {
      const fieldElement = formElement.querySelector(`[name="${field}"]`);
      if (fieldElement) {
        const errorElement = createElement('div', {
          className: 'field-error',
          textContent: fieldErrors[0] // Show first error
        });
        
        fieldElement.parentNode.appendChild(errorElement);
        fieldElement.classList.add('error');
      }
    });
  },
  
  clearErrors(formElement) {
    const errorElements = formElement.querySelectorAll('.field-error');
    errorElements.forEach(el => el.remove());
    
    const errorFields = formElement.querySelectorAll('.error');
    errorFields.forEach(el => el.classList.remove('error'));
  }
};

// Animation utilities
export const animate = {
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    const start = performance.now();
    
    const step = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      element.style.opacity = progress.toString();
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    requestAnimationFrame(step);
  },
  
  fadeOut(element, duration = 300) {
    const start = performance.now();
    const startOpacity = parseFloat(element.style.opacity) || 1;
    
    const step = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      element.style.opacity = (startOpacity * (1 - progress)).toString();
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.style.display = 'none';
      }
    };
    
    requestAnimationFrame(step);
  },
  
  slideDown(element, duration = 300) {
    element.style.height = '0';
    element.style.overflow = 'hidden';
    element.style.display = 'block';
    
    const targetHeight = element.scrollHeight;
    const start = performance.now();
    
    const step = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      element.style.height = (targetHeight * progress) + 'px';
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.style.height = '';
        element.style.overflow = '';
      }
    };
    
    requestAnimationFrame(step);
  },
  
  slideUp(element, duration = 300) {
    const startHeight = element.offsetHeight;
    const start = performance.now();
    
    element.style.overflow = 'hidden';
    
    const step = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      element.style.height = (startHeight * (1 - progress)) + 'px';
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.style.display = 'none';
        element.style.height = '';
        element.style.overflow = '';
      }
    };
    
    requestAnimationFrame(step);
  }
};

// Intersection Observer utility for lazy loading
export const createObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

// Lazy load images
export const lazyLoadImages = (selector = '[data-src]') => {
  const images = $$(selector);
  
  const imageObserver = createObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => {
    img.classList.add('lazy');
    imageObserver.observe(img);
  });
};

// Copy to clipboard utility
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = createElement('textarea', {
      value: text,
      style: 'position: absolute; left: -9999px;'
    });
    
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Generate random ID
export const generateId = (prefix = 'id') => {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
};

// Check if device is mobile
export const isMobile = () => {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Get viewport dimensions
export const getViewport = () => {
  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  };
};

// Smooth scroll to element
export const scrollTo = (element, options = {}) => {
  if (typeof element === 'string') {
    element = $(element);
  }
  
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      ...options
    });
  }
};

// Create pagination helper
export const createPagination = (current, total, maxVisible = 5) => {
  const pages = [];
  const start = Math.max(1, current - Math.floor(maxVisible / 2));
  const end = Math.min(total, start + maxVisible - 1);
  
  // Add first page and ellipsis if needed
  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push('...');
    }
  }
  
  // Add visible pages
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  // Add ellipsis and last page if needed
  if (end < total) {
    if (end < total - 1) {
      pages.push('...');
    }
    pages.push(total);
  }
  
  return pages;
};

// Export all utilities as default object
export default {
  $,
  $$,
  createElement,
  on,
  off,
  trigger,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  debounce,
  throttle,
  storage,
  sessionStorage,
  url,
  format,
  validate,
  form,
  animate,
  createObserver,
  lazyLoadImages,
  copyToClipboard,
  generateId,
  isMobile,
  getViewport,
  scrollTo,
  createPagination
};