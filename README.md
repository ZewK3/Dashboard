# 🐾 PetMarket Vietnam - Chợ Thú Cưng Trực Tuyến

**Nền tảng mua bán thú cưng hiện đại, chuyên nghiệp và đáng tin cậy cho cộng đồng Việt Nam**

Được xây dựng với **Cloudflare Workers**, **D1 Database**, **R2 Storage** và các hiệu ứng dễ thương, mang đến trải nghiệm mua sắm thú cưng tuyệt vời cho người Việt.

![PetMarket Vietnam](https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&h=400&fit=crop)

[![Deploy Status](https://img.shields.io/badge/Deploy-Ready-success?style=flat-square&logo=cloudflare)](https://dash.cloudflare.com/)
[![Vietnamese](https://img.shields.io/badge/Language-Vietnamese-blue?style=flat-square&logo=vietnam)](README.md)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

## 🎯 Tính Năng Nổi Bật

### 🛒 **Marketplace Chuyên Nghiệp**
- **Tìm kiếm thông minh**: Lọc theo loại, giống, giá cả, vị trí
- **Hệ thống đánh giá**: Đánh giá người bán và thú cưng
- **Chat trực tiếp**: Nhắn tin giữa người mua và người bán
- **Giỏ hàng & Yêu thích**: Lưu và quản lý thú cưng quan tâm
- **Thanh toán an toàn**: Tích hợp ví điện tử và phí đăng tin

### 🎨 **Giao Diện Dễ Thương**
- **Hiệu ứng paw prints**: Dấu chân thú cưng floating cute
- **Theme màu hồng**: Gam màu pastel nhẹ nhàng, phù hợp với thú cưng
- **Mobile-first**: Tối ưu hoàn hảo cho điện thoại
- **Responsive design**: Hoạt động mượt mà trên mọi thiết bị

### 👥 **Hệ Thống Người Dùng Thống Nhất**
- **Đăng ký dễ dàng**: Một tài khoản cho cả mua và bán
- **Quản lý số dư**: Ví tích hợp với phí đăng tin $0.5
- **Phân quyền thông minh**: User, Seller, Admin, Support
- **Bảo mật cao**: JWT authentication với HttpOnly cookies

### 🛠 **Dashboard Quản Lý**
- **Seller Dashboard**: Quản lý tin đăng và đơn hàng
- **Admin Panel**: Duyệt bài, quản lý người dùng, thống kê
- **Support Center**: Hệ thống ticket và chat hỗ trợ
- **Analytics**: Báo cáo chi tiết về hiệu suất bán hàng

## 🛠 Technology Stack

### Frontend
- **Vanilla HTML/CSS/JS**: Modern ES6+ without framework dependencies
- **Cute Animations**: CSS keyframes with paw print floating effects
- **Mobile-First Design**: Responsive breakpoints optimized for mobile
- **Single Page App**: Section-based navigation without page reloads

### Backend  
- **Cloudflare Workers**: Edge compute with global distribution
- **D1 Database**: SQLite with 20+ tables and relationships
- **R2 Storage**: Object storage for pet images with presigned URLs
- **KV Storage**: Session management and rate limiting
- **JWT Authentication**: Secure HttpOnly cookies with CSRF protection

### Architecture
- **REST API**: JSON-based API endpoints
- **RBAC**: Role-based access control
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API protection
- **Audit Logging**: Activity tracking

## 🚀 Hướng Dẫn Deploy Nhanh

### 📋 **Yêu Cầu Hệ Thống**
- Tài khoản Cloudflare (miễn phí)
- Domain hoặc subdomain (tùy chọn)
- Git repository

### ⚡ **Deploy 1-Click**
```bash
# Clone project
git clone https://github.com/ZewK3/Dashboard.git
cd Dashboard

# Deploy with Wrangler CLI
npm install -g wrangler
wrangler login
wrangler deploy
```

### 🌐 **Deploy qua Cloudflare Dashboard**
Xem hướng dẫn chi tiết tại: **[CLOUDFLARE_DEPLOY.md](CLOUDFLARE_DEPLOY.md)**

- ✅ Step-by-step qua giao diện web
- ✅ Không cần CLI commands
- ✅ Phù hợp với người mới bắt đầu

### 🔧 **Cấu Hình Nhanh**
1. **D1 Database**: `pet_market_db`
2. **R2 Storage**: `pet-images` 
3. **KV Namespaces**: `SESSIONS_KV`, `RATELIMIT_KV`
4. **Environment Variables**: JWT_SECRET, ALLOWED_ORIGIN

## 📁 Project Structure

```
Dashboard/
├── index.html                 # Single-page application with cute paw animations
├── assets/                    # Frontend assets
│   ├── css/styles.css         # Pink theme with paw print animations
│   ├── js/                    # Modular JavaScript
│   │   ├── main.js            # Application entry point
│   │   ├── api.js             # API client with demo mode
│   │   ├── utils.js           # Utilities and helpers
│   │   └── i18n.js            # Vietnamese/English translations
│   └── i18n/                  # Translation files
│       ├── vi.json            # Vietnamese
│       └── en.json            # English
├── worker.js                  # Complete Cloudflare Worker API (40+ endpoints)
├── migrations/                # Database migration files
│   └── 0001_initial_schema.sql # Complete schema with all tables
├── schema.sql                 # Legacy database schema (same as migration)
├── seeds.sql                  # Demo data with 6 users + 8 pets
├── r2_policy.md              # R2 storage policy
├── wrangler.toml             # Cloudflare configuration
└── README.md                 # This file
```

## 🌐 Complete API Endpoints

### Authentication & Users
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Pet Management (CRUD)
- `GET /api/pets` - Search pets with filters (species, price, location)
- `GET /api/pets/:slug` - Get individual pet details
- `POST /api/pets` - Create new pet listing (sellers)
- `PUT /api/pets/:id` - Update pet listing (sellers)
- `DELETE /api/pets/:id` - Delete pet listing (sellers)
- `GET /api/seller/pets` - Get seller's own listings

### Favorites System
- `GET /api/favorites` - Get user's favorite pets
- `POST /api/favorites` - Add pet to favorites
- `DELETE /api/favorites/:petId` - Remove from favorites

### Shopping Cart & Orders
- `GET /api/cart` - Get current cart items
- `POST /api/cart` - Add pet to cart

### Chat & Messaging System  
- `GET /api/threads/:threadId/messages` - Get chat messages
- `POST /api/messages` - Send message in thread

### File Upload (R2 Storage)
- `POST /api/upload/presign` - Get presigned upload URL for pet images

### Admin Functions
- `GET /api/admin/pets/pending` - Get pending pet listings for approval
- `PUT /api/admin/pets/:id/status` - Approve/reject pet listing
- `GET /api/admin/stats` - Get platform statistics (users, pets, orders)

### Health & Development
- `GET /api/health` - Health check endpoint
- `POST /api/dev/seed` - Seed development data (dev only)

## 👤 **Tài Khoản Demo & Test**

| Email | Mật khẩu | Vai trò | Chức năng |
|-------|----------|---------|-----------|
| `user@demo.com` | `demo123` | Người dùng | Duyệt thú cưng, yêu thích, giỏ hàng |
| `seller@demo.com` | `demo123` | Người bán | Đăng tin, quản lý bán hàng, số dư $10 |
| `admin@demo.com` | `demo123` | Quản trị | Duyệt bài, quản lý người dùng, thống kê |
| `support@demo.com` | `demo123` | Hỗ trợ | Xử lý ticket, chat hỗ trợ trực tiếp |

### 🐾 **Dữ Liệu Demo**
- **8 Thú cưng mẫu**: Chó, mèo, chim, cá, thỏ với hình ảnh thật từ Unsplash
- **Hệ thống số dư**: Seller có sẵn số dư demo để test đăng tin
- **Chat & Support**: Test messaging giữa users và support staff
- **Mobile responsive**: Test đầy đủ trên điện thoại

## 🔧 Development

### Local Development
```bash
# Start backend
wrangler dev

# Start frontend (separate terminal)
npx http-server . -p 8080
```

### Database Management
```bash
# Create migration
wrangler d1 execute PET_DB --file=migration.sql

# Backup database
wrangler d1 export PET_DB --output=backup.sql

# View database
wrangler d1 execute PET_DB --command="SELECT * FROM users LIMIT 10"
```

### R2 Storage
```bash
# Upload files to R2
wrangler r2 object put pet-images/test.jpg --file=test.jpg

# List objects
wrangler r2 object list pet-images

# Set CORS policy
wrangler r2 bucket cors put pet-images --cors-file=cors.json
```

## 🚢 Deployment

### Production Deployment
1. Update production variables in `wrangler.toml`
2. Deploy worker: `wrangler deploy --env production`
3. Deploy frontend to Cloudflare Pages or your preferred CDN
4. Configure custom domain and SSL

### Environment Variables
```toml
[env.production.vars]
DEV = "false"
ALLOWED_ORIGIN = "https://your-domain.com"
R2_PUBLIC_BASE = "https://cdn.your-domain.com"
JWT_SECRET = "production-secret-very-long-and-secure"
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt/Argon2 password protection
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API abuse protection
- **Input Validation**: Comprehensive data validation
- **CORS Control**: Restricted cross-origin access
- **Audit Logging**: All actions logged for security

## 📊 Monitoring & Analytics

- **Performance Metrics**: Response times and error rates
- **User Analytics**: Registration, activity, and retention
- **Business Metrics**: Listings, orders, and revenue
- **Error Tracking**: Comprehensive error logging
- **Audit Trails**: Security and compliance logging

## 🌍 Internationalization

The platform supports multiple languages:
- **Vietnamese** (vi): Primary language
- **English** (en): Secondary language

Translation files are located in `assets/i18n/`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Email**: support@petmarket.vn (in production)

## 🗺 Roadmap

- [ ] **Mobile Apps**: React Native iOS/Android apps
- [ ] **Payment Integration**: VNPay, Momo, Stripe integration
- [ ] **Advanced Search**: AI-powered pet recommendations
- [ ] **Video Calls**: In-app video chat for pet viewing
- [ ] **Geolocation**: Auto-location detection and mapping
- [ ] **Push Notifications**: Real-time alerts
- [ ] **Social Features**: Pet social network and communities
- [ ] **Veterinary Integration**: Health records and vet network

---

Built with ❤️ for the Vietnam pet loving community.