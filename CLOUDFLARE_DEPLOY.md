# 🚀 Hướng Dẫn Deploy PetMarket lên Cloudflare Dashboard

Hướng dẫn chi tiết để deploy ứng dụng PetMarket trực tiếp qua giao diện web Cloudflare Dashboard tại https://dash.cloudflare.com/

> 💡 **Phương pháp mới**: Sử dụng pure JavaScript worker, deploy trực tiếp qua Dashboard mà không cần Wrangler CLI, build tools, hoặc dependencies.

## 📋 Yêu Cầu Trước Khi Bắt Đầu

- ✅ Tài khoản Cloudflare (miễn phí hoặc trả phí)
- ✅ Domain hoặc subdomain (tùy chọn)
- ✅ File `worker.js` (pure JavaScript - không cần build tools)

> 🚀 **Ưu điểm**: Worker được viết bằng pure JavaScript, không cần wrangler CLI, npm, hoặc build process. Copy-paste trực tiếp vào Dashboard!

## 🗂 BƯỚC 1: Tạo D1 Database

### 1.1 Truy cập D1 Database
1. Đăng nhập vào https://dash.cloudflare.com/
2. Chọn account của bạn
3. Sidebar bên trái → **Storage & Databases** → **D1 SQL Database**
4. Click **"Create database"**

### 1.2 Cấu hình Database
- **Database name**: `pet_market_db`
- **Location**: Chọn region gần nhất (Asia-Pacific cho Việt Nam)
- Click **"Create"**

### 1.3 Import Schema và Data
1. Sau khi tạo xong, click vào database `pet_market_db`
2. Tab **"Console"** → Copy nội dung từ file `schema.sql`
3. Paste vào console và click **"Execute"**
4. Làm tương tự với file `seeds.sql` để có dữ liệu demo

## 🗂 BƯỚC 2: Tạo R2 Storage

### 2.1 Truy cập R2 Object Storage
1. Sidebar → **Storage & Databases** → **R2 Object Storage**
2. Click **"Create bucket"**

### 2.2 Cấu hình R2 Bucket
- **Bucket name**: `pet-images`
- **Location**: Automatic (Cloudflare sẽ chọn tối ưu)
- Click **"Create bucket"**

### 2.3 Cấu hình CORS cho Bucket
1. Click vào bucket `pet-images`
2. Tab **"Settings"** → **"CORS policy"** → **"Edit CORS policy"**
3. Paste nội dung sau:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 2.4 Cấu hình Custom Domain (Tùy chọn)
1. Tab **"Settings"** → **"Custom domains"** → **"Connect domain"**
2. Nhập subdomain như `cdn.yourdomain.com`
3. Làm theo hướng dẫn để cấu hình DNS

## 🗂 BƯỚC 3: Tạo KV Namespace

### 3.1 Truy cập Workers KV
1. Sidebar → **Storage & Databases** → **Workers KV**
2. Click **"Create namespace"**

### 3.2 Tạo 2 Namespace
Tạo lần lượt 2 namespace:
- **Namespace name**: `SESSIONS_KV`
- **Namespace name**: `RATELIMIT_KV`

## 🗂 BƯỚC 4: Deploy Cloudflare Worker

### 4.1 Truy cập Workers & Pages
1. Sidebar → **Workers & Pages** → **"Create application"**
2. Tab **"Workers"** → **"Create Worker"**

### 4.2 Cấu hình Worker
- **Worker name**: `pet-market-api`
- Click **"Deploy"** (tạm thời)

### 4.3 Upload Code
1. Click **"Edit code"**
2. Xóa code mẫu, copy toàn bộ nội dung từ file `worker.js`
3. Paste vào editor
4. Click **"Save and deploy"**

> ⚡ **Lưu ý**: File `worker.js` đã được tối ưu thành pure JavaScript, không cần build tools hay dependencies. Có thể copy-paste trực tiếp vào Cloudflare Dashboard!

### 4.4 Cấu hình Variables & Bindings

#### 4.4.1 Environment Variables
1. Tab **"Settings"** → **"Variables"**
2. **"Environment variables"** → **"Add variable"**

Thêm các biến sau:
```
JWT_SECRET = "your-super-secret-jwt-key-min-32-chars-here"
ALLOWED_ORIGIN = "https://your-domain.com"
DEV = "false"
R2_PUBLIC_BASE = "https://your-r2-domain.com"
```

#### 4.4.2 KV Namespace Bindings
1. **"KV namespace bindings"** → **"Add binding"**

Thêm 2 bindings:
```
Variable name: SESSIONS_KV → KV namespace: SESSIONS_KV
Variable name: RATELIMIT_KV → KV namespace: RATELIMIT_KV
```

#### 4.4.3 D1 Database Bindings
1. **"D1 database bindings"** → **"Add binding"**
```
Variable name: PET_DB → D1 database: pet_market_db
```

#### 4.4.4 R2 Bucket Bindings
1. **"R2 bucket bindings"** → **"Add binding"**
```
Variable name: PET_IMAGES → R2 bucket: pet-images
```

### 4.5 Custom Domain (Tùy chọn)
1. Tab **"Triggers"** → **"Add Custom Domain"**
2. Nhập: `api.yourdomain.com`
3. Làm theo hướng dẫn cấu hình DNS

## 🗂 BƯỚC 5: Deploy Frontend với Cloudflare Pages

### 5.1 Tạo Pages Project
1. **Workers & Pages** → **"Create application"**
2. Tab **"Pages"** → **"Connect to Git"**

### 5.2 Kết nối Repository
1. Chọn GitHub/GitLab
2. Authorize Cloudflare
3. Chọn repository chứa code PetMarket
4. Click **"Begin setup"**

### 5.3 Cấu hình Build Settings
```
Project name: pet-market-frontend
Production branch: main
Framework preset: None
Build command: (để trống)
Build output directory: /
Root directory: /
```

### 5.4 Environment Variables cho Pages
Trong **"Environment variables"**, thêm:
```
API_BASE_URL = https://hipet-market-api.tocotoco.workers.dev
VITE_API_URL = https://hipet-market-api.tocotoco.workers.dev
```

### 5.5 Deploy
1. Click **"Save and Deploy"**
2. Chờ quá trình build hoàn thành (2-5 phút)

### 5.6 Custom Domain cho Frontend
1. Tab **"Custom domains"** → **"Set up a custom domain"**
2. Nhập: `petmarket.yourdomain.com` hoặc `yourdomain.com`

## 🗂 BƯỚC 6: Cấu hình DNS

### 6.1 Nếu dùng domain riêng
Trỏ các record DNS sau:

```
Type: CNAME
Name: petmarket (hoặc @)
Content: pet-market-frontend.pages.dev

Type: CNAME
Name: api
Content: hipet-market-api.tocotoco.workers.dev

Type: CNAME  
Name: cdn
Content: pet-images.r2.dev
```

### 6.2 Nếu dùng subdomain Cloudflare
Có thể dùng URLs mặc định:
- Frontend: `https://pet-market-frontend.pages.dev`
- API: `https://hipet-market-api.tocotoco.workers.dev`

## 🧪 BƯỚC 7: Kiểm Tra Deployment

### 7.1 Test API Endpoints
Mở browser và test:
```
https://your-api-domain.com/api/health
https://your-api-domain.com/api/pets
```

### 7.2 Test Frontend
1. Truy cập URL frontend
2. Thử đăng ký/đăng nhập với:
   - Email: `user@demo.com`
   - Password: `demo123`

### 7.3 Test Upload Images
1. Đăng nhập và thử đăng tin bán thú cưng
2. Upload hình ảnh để kiểm tra R2 storage

## 🔧 Bảo Trì và Monitoring

### 8.1 Xem Logs
- **Workers & Pages** → chọn worker → **"Logs"**
- **Real-time logs** để debug real-time

### 8.2 Analytics
- Tab **"Analytics"** để xem:
  - Request count
  - Error rates
  - Response times

### 8.3 Update Code
#### Cập nhật Worker:
1. **Workers & Pages** → chọn worker → **"Edit code"**
2. Paste code mới và **"Save and deploy"**

#### Cập nhật Frontend:
1. Push code mới lên Git repository
2. Cloudflare Pages sẽ tự động deploy

## 🚨 Troubleshooting

### Lỗi thường gặp:

**1. Worker không chạy:**
- Kiểm tra bindings (D1, R2, KV) đã cấu hình đúng
- Xem logs trong tab "Logs"

**2. Database lỗi:**
- Kiểm tra schema đã import chưa
- Test query trong D1 console

**3. Upload ảnh không hoạt động:**
- Kiểm tra CORS policy của R2 bucket
- Verify R2 binding trong worker

**4. Frontend không kết nối API:**
- Kiểm tra environment variables
- Verify CORS headers trong worker

### Support:
- 📧 Email: support@petmarket.vn
- 🐛 GitHub Issues: https://github.com/ZewK3/Dashboard/issues

---

🎉 **Chúc mừng! Bạn đã deploy thành công PetMarket trên Cloudflare!** 🐾