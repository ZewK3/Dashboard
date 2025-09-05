# PetMarket Vietnam - Pet Trading Platform

A modern, full-stack pet marketplace built with **Cloudflare Workers**, **D1 Database**, **R2 Storage**, and vanilla **HTML/CSS/JavaScript**. Connect pet lovers across Vietnam with a secure, user-friendly platform for buying and selling pets.

![PetMarket Vietnam](https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&h=400&fit=crop)

## 🎯 Features

### Customer Interface
- **Modern Responsive Design**: Mobile-first approach with dark mode support
- **Advanced Search & Filtering**: By species, price, location, age, and more
- **Real-time Chat**: Secure messaging between buyers and sellers
- **Favorites & Cart System**: Save pets and manage purchases
- **User Reviews & Ratings**: Build trust in the community
- **Multi-language Support**: Vietnamese and English

### Seller Dashboard
- **Easy Listing Creation**: Step-by-step wizard with image upload
- **Order Management**: Track sales and communicate with buyers
- **Performance Analytics**: View listing statistics and insights
- **Inventory Control**: Manage availability and pricing

### Admin Panel
- **Content Moderation**: Review and approve pet listings
- **User Management**: Handle accounts, bans, and permissions
- **Analytics Dashboard**: Platform statistics and growth metrics
- **Support Tools**: Manage tickets and user reports

### Support System
- **Ticket Management**: Organized customer support workflow
- **Live Chat Integration**: Real-time assistance
- **Knowledge Base**: Self-service help articles
- **Escalation System**: Priority handling for urgent issues

## 🛠 Technology Stack

### Frontend
- **HTML5/CSS3/JavaScript (ES6+)**: Modern vanilla web technologies
- **CSS Custom Properties**: Theming and responsive design
- **CSS Grid/Flexbox**: Layout systems
- **Intersection Observer**: Lazy loading and animations
- **Web APIs**: Geolocation, localStorage, IndexedDB

### Backend
- **Cloudflare Workers**: Serverless compute platform
- **D1 Database**: SQLite-compatible edge database
- **R2 Storage**: Object storage for images
- **KV Storage**: Session management and rate limiting
- **JWT Authentication**: Secure token-based auth

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
wrangler d1 execute PET_DB --file=apps/backend/schema.sql
```

### 6. Seed Development Data
```bash
wrangler d1 execute PET_DB --file=apps/backend/seeds.sql
```

### 7. Deploy Worker
```bash
wrangler deploy
```

### 8. Serve Frontend
```bash
# Simple HTTP server
npx http-server apps/frontend -p 8080

# Or use any static server
python -m http.server 8080 -d apps/frontend
```

## 📁 Project Structure

```
apps/
├── frontend/                 # Frontend application
│   ├── index.html            # Landing page
│   ├── buyer.html            # Buyer interface
│   ├── seller.html           # Seller dashboard
│   ├── admin.html            # Admin panel
│   ├── support.html          # Support interface
│   └── assets/
│       ├── css/styles.css    # Modern CSS with custom properties
│       ├── js/               # Modular JavaScript
│       │   ├── main.js       # Application entry point
│       │   ├── api.js        # API client
│       │   ├── auth.js       # Authentication
│       │   ├── pets.js       # Pet listings
│       │   ├── utils.js      # Utilities
│       │   └── i18n.js       # Internationalization
│       ├── img/brand/        # Branding assets
│       └── i18n/             # Translation files
│           ├── vi.json       # Vietnamese
│           └── en.json       # English
└── backend/                  # Backend API
    ├── worker.js             # Cloudflare Worker
    ├── schema.sql            # Database schema
    └── seeds.sql             # Sample data

wrangler.toml                 # Cloudflare configuration
README.md                     # This file
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Pet Listings
- `GET /api/pets` - Search pets with filters
- `GET /api/pets/:slug` - Get pet details
- `POST /api/seller/pets` - Create listing (seller)
- `PUT /api/seller/pets/:id` - Update listing (seller)
- `DELETE /api/seller/pets/:id` - Delete listing (seller)
- `GET /api/admin/pets` - Moderation queue (admin)
- `PUT /api/admin/pets/:id` - Moderate listing (admin)

### Orders & Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart/items` - Add to cart
- `DELETE /api/cart/items/:id` - Remove from cart
- `POST /api/orders` - Create order
- `GET /api/orders` - Get orders
- `PUT /api/orders/:id` - Update order status

### Chat & Support
- `GET /api/threads` - Get chat threads
- `POST /api/threads` - Create thread
- `GET /api/threads/:id/messages` - Get messages
- `POST /api/threads/:id/messages` - Send message
- `POST /api/tickets` - Create support ticket
- `GET /api/tickets` - Get tickets

### File Upload
- `POST /api/upload/presign` - Get R2 upload URL

## 👤 Demo Accounts

### Default Login Credentials
| Email | Password | Role |
|-------|----------|------|
| `buyer@demo.com` | `demo123` | Buyer |
| `seller@demo.com` | `demo123` | Seller |
| `admin@demo.com` | `demo123` | Admin |
| `support@demo.com` | `demo123` | Support |

## 🔧 Development

### Local Development
```bash
# Start backend
wrangler dev

# Start frontend (separate terminal)
npx http-server apps/frontend -p 8080
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

Translation files are located in `apps/frontend/assets/i18n/`.

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