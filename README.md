# PetMarket Vietnam - Complete Pet Trading Platform

A modern, production-ready pet marketplace with **Cloudflare Workers**, **D1 Database**, **R2 Storage**, cute paw print animations, and unified user experience. Built for Vietnamese pet lovers with comprehensive backend API and delightful frontend.

![PetMarket Vietnam](https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&h=400&fit=crop)

## ✨ Latest Updates

### 🎨 Enhanced UI/UX
- **Cute Paw Print Animations**: Floating dog and cat paw prints with interactive effects
- **Single Pink Theme**: Consistent, adorable pink color scheme optimized for Vietnamese users
- **Mobile-First Responsive**: Perfect experience across all devices

### 🚀 Complete Backend API
- **40+ REST Endpoints**: Full CRUD operations for pets, orders, favorites, chat, admin
- **Production-Ready**: JWT auth, audit logging, comprehensive error handling
- **Cloudflare Integration**: D1, R2, KV with rate limiting and security

### 💰 Unified User System
- **Seamless Seller Registration**: Any user can become a seller instantly
- **Balance Management**: Built-in wallet with $0.5 posting fees
- **Smart Payment Integration**: Multiple payment methods with validation

## 🎯 Features

### Customer Experience
- **Adorable Design**: Cute paw print animations and pink gradient theme
- **Advanced Pet Search**: Species, breed, price, location filtering
- **Real-time Chat**: Secure messaging with support staff
- **Favorites & Cart**: Save pets and manage purchases  
- **User Balance System**: Top-up wallet for posting fees
- **Mobile Optimized**: Touch-friendly interface

### Seller Dashboard
- **Easy Pet Listing**: Step-by-step creation with image upload
- **$0.5 Posting Fee**: Automatic deduction from user balance
- **Order Management**: Track sales and buyer communication
- **Performance Analytics**: Listing views and engagement stats

### Admin Panel
- **Content Moderation**: Approve/reject pet listings
- **User Management**: Account control and permissions
- **Platform Statistics**: Users, pets, orders dashboard
- **Support Tools**: Ticket and report management

### Complete Backend
- **Pet CRUD Operations**: Create, read, update, delete listings
- **Order Management**: Cart, checkout, payment processing
- **Chat System**: Real-time messaging between users
- **Favorites**: Add/remove pets from favorites
- **File Upload**: R2 presigned URLs for pet images
- **Admin Functions**: Moderation, statistics, user management

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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)

### 1. Clone Repository
```bash
git clone https://github.com/ZewK3/Dashboard.git
cd Dashboard
```

### 2. Install Dependencies
```bash
npm install -g wrangler
wrangler login
```

### 3. Create Cloudflare Resources

#### Create D1 Database
```bash
wrangler d1 create pet_market_db
```
Copy the database ID and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "PET_DB"
database_name = "pet_market_db"
database_id = "your-d1-database-id-here"
```

#### Create R2 Bucket
```bash
wrangler r2 bucket create pet-images
```

#### Create KV Namespaces
```bash
wrangler kv:namespace create "SESSIONS_KV"
wrangler kv:namespace create "RATELIMIT_KV"
```
Update the IDs in `wrangler.toml`.

### 4. Configure Environment
Update `wrangler.toml` with your values:
```toml
[vars]
JWT_SECRET = "your-super-secret-jwt-key-min-32-chars"
ALLOWED_ORIGIN = "http://localhost:8080"
DEV = "true"
R2_PUBLIC_BASE = "https://your-r2-domain.com"
```

### 5. Run Database Migrations
```bash
# Use the new migration system
wrangler d1 execute PET_DB --file=migrations/0001_initial_schema.sql

# Or use the legacy files (same content)
wrangler d1 execute PET_DB --file=schema.sql
```

### 6. Seed Development Data
```bash
wrangler d1 execute PET_DB --file=seeds.sql
```

### 7. Deploy Worker
```bash
wrangler deploy
```

### 8. Serve Frontend
```bash
# Simple HTTP server
npx http-server . -p 8080

# Or use any static server
python -m http.server 8080
```

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

## 👤 Demo Accounts & Features

### Default Login Credentials
| Email | Password | Role | Features |
|-------|----------|------|----------|
| `buyer@demo.com` | `demo123` | Buyer | Browse pets, favorites, cart, chat |
| `seller@demo.com` | `demo123` | Seller | Create listings, manage sales, $10 balance |
| `admin@demo.com` | `demo123` | Admin | Approve listings, user management, statistics |
| `support@demo.com` | `demo123` | Support | Handle tickets, live chat assistance |

### Demo Features
- **8 Pet Listings**: Dogs, cats, birds, fish, rabbits with real Unsplash images
- **Balance System**: Sellers start with demo balance for posting fees
- **Cute Animations**: Floating paw prints and heart effects
- **Mobile Responsive**: Optimized for touch interfaces
- **Vietnamese Interface**: Complete localization

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