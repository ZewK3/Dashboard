// Products Management Class
class ProductManager {
  constructor() {
    this.products = new Map();
    this.categories = new Set();
    this.isLoaded = false;
    this.loadingPromise = null;
  }

  async loadAll() {
    if (this.isLoaded) return this.products;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this.fetchProducts();
    await this.loadingPromise;
    this.loadingPromise = null;
    return this.products;
  }

  async fetchProducts() {
    try {
      // Try to get from API first
      const data = await API.getProducts();
      
      if (data && Array.isArray(data)) {
        this.processProductData(data);
      } else {
        // Fallback to CSV if API fails
        await this.loadFromCSV();
      }
      
      this.isLoaded = true;
      console.log(`Loaded ${this.products.size} products in ${this.categories.size} categories`);
      
    } catch (error) {
      console.error('Failed to load products:', error);
      
      // Try CSV fallback
      try {
        await this.loadFromCSV();
        this.isLoaded = true;
      } catch (csvError) {
        console.error('CSV fallback also failed:', csvError);
        throw new Error('Không thể tải dữ liệu sản phẩm');
      }
    }
  }

  async loadFromCSV() {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxseIrDGsm0EN5t6GWCi8-lHO-WJccNl3pR5s2DzSrLRxf5nYje9xUdLlOT0ZkGxlmw0tMZZNKFa8a/pub?output=csv';
    
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch CSV data');
    }
    
    const csv = await response.text();
    const jsonData = API.parseCSV(csv);
    
    this.processProductData(jsonData);
  }

  processProductData(data) {
    this.products.clear();
    this.categories.clear();

    data.forEach((item, index) => {
      if (!item['Tên món'] || !item['Danh mục']) return;

      const product = this.createProductFromData(item, index);
      this.products.set(product.id, product);
      this.categories.add(product.category);
    });

    // Extract toppings
    this.extractToppings(data);

    // Sort categories
    this.sortCategories();
  }

  createProductFromData(item, index) {
    const id = item.id || `product_${index}_${Date.now()}`;
    const name = item['Tên món'];
    const category = item['Danh mục'];
    const price = this.parsePrice(item['Giá tiền']);
    const image = item['URL hình ảnh'] || APP_CONFIG.PRODUCT.DEFAULT_IMAGE;
    
    return {
      id,
      name,
      category,
      price,
      originalPrice: this.parsePrice(item['Giá gốc']),
      image,
      description: item['Mô tả'] || '',
      sizes: this.parseSizes(item['Size']),
      sugarOptions: this.parseOptions(item['Đường']),
      iceOptions: this.parseOptions(item['Đá']),
      isNew: this.parseBoolean(item['Mới']),
      isHot: this.parseBoolean(item['Hot']),
      isAvailable: this.parseBoolean(item['Có sẵn'], true),
      ingredients: this.parseArray(item['Thành phần']),
      allergens: this.parseArray(item['Dị ứng']),
      nutritionInfo: this.parseNutrition(item),
      preparationTime: this.parseNumber(item['Thời gian chuẩn bị'], 5),
      rating: this.parseNumber(item['Đánh giá'], 0),
      reviewCount: this.parseNumber(item['Số đánh giá'], 0),
      createdAt: item['Ngày tạo'] || new Date().toISOString(),
      updatedAt: item['Ngày cập nhật'] || new Date().toISOString()
    };
  }

  parsePrice(price) {
    if (!price) return 0;
    return Number(price.toString().replace(/[^\d]/g, '')) || 0;
  }

  parseBoolean(value, defaultValue = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'có', 'đúng'].includes(value.toLowerCase());
    }
    return defaultValue;
  }

  parseNumber(value, defaultValue = 0) {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  parseArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      return value.split(',').map(item => item.trim()).filter(item => item);
    }
    return [];
  }

  parseSizes(sizes) {
    if (!sizes) return APP_CONFIG.PRODUCT.DEFAULT_SIZE_OPTIONS;
    return this.parseArray(sizes);
  }

  parseOptions(options) {
    if (!options) return [];
    return this.parseArray(options);
  }

  parseNutrition(item) {
    return {
      calories: this.parseNumber(item['Calo']),
      protein: this.parseNumber(item['Protein']),
      carbs: this.parseNumber(item['Carbs']),
      fat: this.parseNumber(item['Chất béo']),
      sugar: this.parseNumber(item['Đường']),
      caffeine: this.parseNumber(item['Caffeine'])
    };
  }

  extractToppings(data) {
    this.toppings = new Map();
    
    data.forEach(item => {
      if (item['Danh mục'] === 'Topping' && item['Tên món']) {
        const topping = {
          id: `topping_${item['Tên món'].replace(/\s+/g, '_').toLowerCase()}`,
          name: item['Tên món'],
          price: this.parsePrice(item['Giá tiền']),
          image: item['URL hình ảnh'],
          description: item['Mô tả'] || '',
          isAvailable: this.parseBoolean(item['Có sẵn'], true)
        };
        
        this.toppings.set(topping.id, topping);
      }
    });
  }

  sortCategories() {
    const categoryOrder = ['Trà Sữa', 'Trà', 'Cà Phê', 'Nước ép', 'Smoothie', 'Món thêm', 'Kem', 'Topping'];
    const sorted = Array.from(this.categories).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
    
    this.categories = new Set(sorted);
  }

  // Getter methods
  getAll() {
    return Array.from(this.products.values());
  }

  getById(id) {
    return this.products.get(id);
  }

  getByCategory(category) {
    return this.getAll().filter(product => product.category === category);
  }

  getCategories() {
    return Array.from(this.categories);
  }

  getToppings() {
    if (!this.toppings) return [];
    return Array.from(this.toppings.values());
  }

  getToppingById(id) {
    if (!this.toppings) return null;
    return this.toppings.get(id);
  }

  // Search and filter methods
  search(query, options = {}) {
    if (!query || query.trim() === '') return this.getAll();

    const searchQuery = query.toLowerCase().trim();
    const {
      category = null,
      minPrice = 0,
      maxPrice = Infinity,
      includeUnavailable = false
    } = options;

    return this.getAll().filter(product => {
      // Category filter
      if (category && product.category !== category) return false;
      
      // Availability filter
      if (!includeUnavailable && !product.isAvailable) return false;
      
      // Price filter
      if (product.price < minPrice || product.price > maxPrice) return false;
      
      // Text search
      const searchFields = [
        product.name,
        product.description,
        product.category,
        ...(product.ingredients || []),
        ...(product.allergens || [])
      ].join(' ').toLowerCase();
      
      return searchFields.includes(searchQuery);
    });
  }

  filter(filters = {}) {
    const {
      category = null,
      isNew = null,
      isHot = null,
      minPrice = 0,
      maxPrice = Infinity,
      minRating = 0,
      includeUnavailable = false,
      sortBy = 'name',
      sortOrder = 'asc'
    } = filters;

    let results = this.getAll().filter(product => {
      if (category && product.category !== category) return false;
      if (isNew !== null && product.isNew !== isNew) return false;
      if (isHot !== null && product.isHot !== isHot) return false;
      if (product.price < minPrice || product.price > maxPrice) return false;
      if (product.rating < minRating) return false;
      if (!includeUnavailable && !product.isAvailable) return false;
      
      return true;
    });

    // Sort results
    results.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    return results;
  }

  // Product management methods (for admin)
  async add(productData) {
    try {
      const token = Storage.get(APP_CONFIG.STORAGE.TOKEN);
      if (!token) throw new Error('Authentication required');

      const newProduct = await API.addProduct(productData, token);
      
      if (newProduct && newProduct.id) {
        this.products.set(newProduct.id, newProduct);
        this.categories.add(newProduct.category);
        return newProduct;
      }
      
      throw new Error('Failed to add product');
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  async update(id, productData) {
    try {
      const token = Storage.get(APP_CONFIG.STORAGE.TOKEN);
      if (!token) throw new Error('Authentication required');

      const updatedProduct = await API.updateProduct(id, productData, token);
      
      if (updatedProduct) {
        this.products.set(id, updatedProduct);
        this.categories.add(updatedProduct.category);
        return updatedProduct;
      }
      
      throw new Error('Failed to update product');
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const token = Storage.get(APP_CONFIG.STORAGE.TOKEN);
      if (!token) throw new Error('Authentication required');

      await API.deleteProduct(id, token);
      this.products.delete(id);
      
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Utility methods
  calculateDiscountPercent(product) {
    if (!product.originalPrice || product.originalPrice <= product.price) return 0;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }

  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price).replace('₫', ' VNĐ');
  }

  getProductUrl(product) {
    return `#product/${product.id}`;
  }

  getImageUrl(product, size = 'medium') {
    if (!product.image || product.image === APP_CONFIG.PRODUCT.DEFAULT_IMAGE) {
      return APP_CONFIG.PRODUCT.DEFAULT_IMAGE;
    }

    // If using a service that supports dynamic resizing
    const sizeMap = APP_CONFIG.PRODUCT.IMAGE_SIZES;
    if (sizeMap[size] && product.image.includes('placeholder') === false) {
      return product.image.replace(/\d+x\d+/, sizeMap[size]);
    }

    return product.image;
  }

  // Cache management
  invalidateCache() {
    this.isLoaded = false;
    this.products.clear();
    this.categories.clear();
    
    // Clear any cached data
    const cacheKeys = Storage.keys().filter(key => key.startsWith('products_'));
    cacheKeys.forEach(key => Storage.remove(key));
  }

  async refresh() {
    this.invalidateCache();
    return this.loadAll();
  }

  // Export/Import for admin
  exportData() {
    return {
      products: this.getAll(),
      categories: this.getCategories(),
      toppings: this.getToppings(),
      timestamp: new Date().toISOString()
    };
  }

  importData(data) {
    if (data.products && Array.isArray(data.products)) {
      this.processProductData(data.products);
      return true;
    }
    return false;
  }

  // Statistics
  getStats() {
    const products = this.getAll();
    const categories = this.getCategories();
    
    return {
      totalProducts: products.length,
      totalCategories: categories.length,
      availableProducts: products.filter(p => p.isAvailable).length,
      newProducts: products.filter(p => p.isNew).length,
      hotProducts: products.filter(p => p.isHot).length,
      averagePrice: products.reduce((sum, p) => sum + p.price, 0) / products.length,
      priceRange: {
        min: Math.min(...products.map(p => p.price)),
        max: Math.max(...products.map(p => p.price))
      },
      categoryStats: categories.map(category => ({
        name: category,
        count: this.getByCategory(category).length
      }))
    };
  }
}

// Create global products instance
const Products = new ProductManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductManager;
}