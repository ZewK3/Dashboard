-- Initial Pet Marketplace Database Schema for D1 (SQLite)
-- Migration 0001: Create core tables for users, pets, orders, and chat system

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    passwordHash TEXT NOT NULL,
    role TEXT CHECK(role IN ('buyer','seller','admin','support')) NOT NULL DEFAULT 'buyer',
    status TEXT CHECK(status IN ('active','banned','pending')) DEFAULT 'active',
    avatarUrl TEXT,
    balance REAL DEFAULT 0,
    canSell INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- User Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    ip TEXT,
    ua TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    expiresAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expiresAt);

-- User Addresses
CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    line1 TEXT NOT NULL,
    ward TEXT,
    district TEXT,
    province TEXT NOT NULL,
    country TEXT DEFAULT 'VN',
    isDefault INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(userId);

-- Pet Listings
CREATE TABLE IF NOT EXISTS pets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sellerId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    sex TEXT CHECK(sex IN ('male','female','unknown')) NOT NULL,
    ageMonths INTEGER NOT NULL,
    weight REAL,
    height REAL,
    color TEXT,
    vaccinated INTEGER DEFAULT 0,
    dewormed INTEGER DEFAULT 0,
    personalityTraits TEXT,
    price REAL NOT NULL,
    photos TEXT, -- JSON array of photo URLs
    status TEXT CHECK(status IN ('pending','approved','rejected','sold','deleted')) DEFAULT 'pending',
    locationProvince TEXT NOT NULL,
    viewCount INTEGER DEFAULT 0,
    featuredUntil TEXT, -- Featured listing expiry
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pets_seller ON pets(sellerId);
CREATE INDEX IF NOT EXISTS idx_pets_status ON pets(status);
CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX IF NOT EXISTS idx_pets_location ON pets(locationProvince);
CREATE INDEX IF NOT EXISTS idx_pets_price ON pets(price);
CREATE INDEX IF NOT EXISTS idx_pets_created ON pets(createdAt);

-- Pet Attributes (for filtering)
CREATE TABLE IF NOT EXISTS pet_attributes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    petId TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    attributeName TEXT NOT NULL,
    attributeValue TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pet_attributes_pet ON pet_attributes(petId);
CREATE INDEX IF NOT EXISTS idx_pet_attributes_name ON pet_attributes(attributeName);

-- User Favorites
CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    petId TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    createdAt TEXT DEFAULT (datetime('now')),
    UNIQUE(userId, petId)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(userId);
CREATE INDEX IF NOT EXISTS idx_favorites_pet ON favorites(petId);

-- Shopping Cart
CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK(status IN ('active','completed','abandoned')) DEFAULT 'active',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cartId TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    petId TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    price REAL NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    UNIQUE(cartId, petId)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cartId);
CREATE INDEX IF NOT EXISTS idx_cart_items_pet ON cart_items(petId);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    buyerId TEXT NOT NULL REFERENCES users(id),
    sellerId TEXT NOT NULL REFERENCES users(id),
    petId TEXT NOT NULL REFERENCES pets(id),
    quantity INTEGER DEFAULT 1,
    totalAmount REAL NOT NULL,
    status TEXT CHECK(status IN ('pending','confirmed','shipped','delivered','completed','cancelled','refunded')) DEFAULT 'pending',
    paymentMethod TEXT,
    paymentStatus TEXT CHECK(paymentStatus IN ('pending','paid','failed','refunded')) DEFAULT 'pending',
    shippingAddress TEXT,
    notes TEXT,
    trackingNumber TEXT,
    estimatedDelivery TEXT,
    confirmedAt TEXT,
    shippedAt TEXT,
    deliveredAt TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyerId);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(sellerId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(createdAt);

-- Chat System - Conversation Threads
CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    participant1Id TEXT NOT NULL REFERENCES users(id),
    participant2Id TEXT NOT NULL REFERENCES users(id),
    subject TEXT,
    status TEXT CHECK(status IN ('active','closed','archived')) DEFAULT 'active',
    lastMessageAt TEXT DEFAULT (datetime('now')),
    createdAt TEXT DEFAULT (datetime('now')),
    UNIQUE(participant1Id, participant2Id)
);

CREATE INDEX IF NOT EXISTS idx_threads_p1 ON threads(participant1Id);
CREATE INDEX IF NOT EXISTS idx_threads_p2 ON threads(participant2Id);
CREATE INDEX IF NOT EXISTS idx_threads_last_message ON threads(lastMessageAt);

-- Chat Messages
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    threadId TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    senderId TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    type TEXT CHECK(type IN ('text','image','file','system')) DEFAULT 'text',
    readAt TEXT,
    editedAt TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(threadId);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(senderId);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(createdAt);

-- Support Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL REFERENCES users(id),
    assignedTo TEXT REFERENCES users(id),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    priority TEXT CHECK(priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
    status TEXT CHECK(status IN ('open','in_progress','resolved','closed')) DEFAULT 'open',
    resolution TEXT,
    resolvedAt TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(userId);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assignedTo);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- Support Ticket Messages
CREATE TABLE IF NOT EXISTS ticket_messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    ticketId TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    userId TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    isInternal INTEGER DEFAULT 0, -- Internal notes for staff
    attachments TEXT, -- JSON array of attachment URLs
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticketId);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_user ON ticket_messages(userId);

-- Reviews and Ratings
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    orderId TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    reviewerId TEXT NOT NULL REFERENCES users(id),
    revieweeId TEXT NOT NULL REFERENCES users(id),
    petId TEXT NOT NULL REFERENCES pets(id),
    rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    photos TEXT, -- JSON array of review photo URLs
    status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    UNIQUE(orderId, reviewerId)
);

CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(orderId);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewerId);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(revieweeId);
CREATE INDEX IF NOT EXISTS idx_reviews_pet ON reviews(petId);

-- Reports (for content moderation)
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    reporterId TEXT NOT NULL REFERENCES users(id),
    reportedUserId TEXT REFERENCES users(id),
    reportedPetId TEXT REFERENCES pets(id),
    reportedMessageId TEXT REFERENCES messages(id),
    type TEXT CHECK(type IN ('inappropriate_content','spam','fraud','harassment','fake_listing','other')) NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending','investigating','resolved','dismissed')) DEFAULT 'pending',
    resolution TEXT,
    resolvedBy TEXT REFERENCES users(id),
    resolvedAt TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporterId);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    actorId TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    targetType TEXT NOT NULL,
    targetId TEXT NOT NULL,
    metadata TEXT, -- JSON object with additional data
    ip TEXT,
    ua TEXT, -- User agent
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actorId);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(targetType, targetId);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(createdAt);

-- Moderation Queue
CREATE TABLE IF NOT EXISTS moderation_queue (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    itemType TEXT CHECK(itemType IN ('pet','review','message','user')) NOT NULL,
    itemId TEXT NOT NULL,
    reason TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    status TEXT CHECK(status IN ('pending','approved','rejected','escalated')) DEFAULT 'pending',
    moderatorId TEXT REFERENCES users(id),
    moderatorNotes TEXT,
    moderatedAt TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_moderation_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_priority ON moderation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_moderation_type ON moderation_queue(itemType);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON object with additional data
    readAt TEXT,
    actionUrl TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(readAt);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(createdAt);

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sessionId TEXT,
    userId TEXT REFERENCES users(id),
    event TEXT NOT NULL,
    properties TEXT, -- JSON object with event properties
    ip TEXT,
    ua TEXT,
    referer TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(userId);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(sessionId);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(createdAt);

-- Settings and Configuration
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updatedBy TEXT REFERENCES users(id),
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    UNIQUE(category, key)
);

CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Insert default system settings
INSERT OR IGNORE INTO settings (category, key, value, description) VALUES
('system', 'site_name', 'Pet Marketplace', 'Website name'),
('system', 'maintenance_mode', 'false', 'Enable maintenance mode'),
('system', 'registration_enabled', 'true', 'Allow new user registration'),
('pets', 'max_photos_per_listing', '5', 'Maximum photos per pet listing'),
('pets', 'listing_fee', '0.5', 'Fee charged per pet listing in USD'),
('reviews', 'require_moderation', 'false', 'Require admin approval for reviews'),
('chat', 'max_message_length', '1000', 'Maximum characters per chat message'),
('uploads', 'max_file_size_mb', '5', 'Maximum file size for uploads in MB'),
('uploads', 'allowed_extensions', 'jpg,jpeg,png,webp,gif', 'Allowed file extensions for uploads');