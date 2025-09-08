-- Pet Marketplace Database Schema for D1 (SQLite)
-- Migration script with idempotent operations

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    passwordHash TEXT NOT NULL,
    role TEXT CHECK(role IN ('user','admin','support')) NOT NULL DEFAULT 'user',
    canSell INTEGER DEFAULT 0, -- 0: cannot sell, 1: can sell pets
    balance INTEGER DEFAULT 0, -- user balance in cents/dong
    status TEXT CHECK(status IN ('active','banned','pending')) DEFAULT 'active',
    avatarUrl TEXT,
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
CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(userId, isDefault);

-- Pet Listings
CREATE TABLE IF NOT EXISTS pets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sellerId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    species TEXT CHECK(species IN ('dog','cat','bird','fish','reptile','rabbit','hamster','other')) DEFAULT 'other',
    breed TEXT,
    sex TEXT CHECK(sex IN ('male','female','unknown')) DEFAULT 'unknown',
    ageMonths INTEGER DEFAULT 0,
    vaccinated INTEGER DEFAULT 0,
    dewormed INTEGER DEFAULT 0,
    price INTEGER NOT NULL, -- in cents/dong
    currency TEXT DEFAULT 'VND',
    description TEXT,
    locationProvince TEXT,
    photos JSON, -- array of image URLs
    status TEXT CHECK(status IN ('draft','pending','approved','rejected','sold','archived')) DEFAULT 'pending',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    viewCount INTEGER DEFAULT 0,
    weight REAL, -- in kg
    height REAL, -- in cm
    color TEXT,
    personalityTraits TEXT -- comma-separated traits
);

CREATE INDEX IF NOT EXISTS idx_pets_seller ON pets(sellerId);
CREATE INDEX IF NOT EXISTS idx_pets_status ON pets(status);
CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX IF NOT EXISTS idx_pets_price ON pets(price);
CREATE INDEX IF NOT EXISTS idx_pets_province ON pets(locationProvince);
CREATE INDEX IF NOT EXISTS idx_pets_slug ON pets(slug);
CREATE INDEX IF NOT EXISTS idx_pets_created ON pets(createdAt);

-- Pet Attributes (flexible key-value for custom attributes)
CREATE TABLE IF NOT EXISTS pet_attributes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    petId TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pet_attrs_pet ON pet_attributes(petId);
CREATE INDEX IF NOT EXISTS idx_pet_attrs_key ON pet_attributes(key);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    petId TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    createdAt TEXT DEFAULT (datetime('now')),
    UNIQUE(userId, petId)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(userId);
CREATE INDEX IF NOT EXISTS idx_favorites_pet ON favorites(petId);

-- Shopping Carts
CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(userId);

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cartId TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    petId TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    qty INTEGER DEFAULT 1,
    addedAt TEXT DEFAULT (datetime('now')),
    UNIQUE(cartId, petId)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cartId);
CREATE INDEX IF NOT EXISTS idx_cart_items_pet ON cart_items(petId);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    buyerId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sellerId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    petId TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- total amount in cents/dong
    currency TEXT DEFAULT 'VND',
    status TEXT CHECK(status IN ('pending','confirmed','preparing','shipped','delivered','cancelled','refunded')) DEFAULT 'pending',
    paymentMethod TEXT CHECK(paymentMethod IN ('cod','transfer','escrow','card')) DEFAULT 'cod',
    deliveryMethod TEXT CHECK(deliveryMethod IN ('pickup','ship','meetup')) DEFAULT 'pickup',
    shippingInfo JSON, -- shipping address, tracking, etc.
    notes TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    confirmedAt TEXT,
    deliveredAt TEXT,
    cancelledAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyerId);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(sellerId);
CREATE INDEX IF NOT EXISTS idx_orders_pet ON orders(petId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(createdAt);

-- Chat Threads
CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId1 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    userId2 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    petId TEXT REFERENCES pets(id) ON DELETE SET NULL,
    orderId TEXT REFERENCES orders(id) ON DELETE SET NULL,
    lastMessageAt TEXT DEFAULT (datetime('now')),
    status TEXT CHECK(status IN ('open','closed','archived')) DEFAULT 'open',
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_threads_user1 ON threads(userId1);
CREATE INDEX IF NOT EXISTS idx_threads_user2 ON threads(userId2);
CREATE INDEX IF NOT EXISTS idx_threads_pet ON threads(petId);
CREATE INDEX IF NOT EXISTS idx_threads_order ON threads(orderId);
CREATE INDEX IF NOT EXISTS idx_threads_last_message ON threads(lastMessageAt);

-- Chat Messages
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    threadId TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    senderId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiverId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSON, -- array of file URLs
    messageType TEXT CHECK(messageType IN ('text','image','system')) DEFAULT 'text',
    isRead INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(threadId);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(senderId);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiverId);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(createdAt);

-- Support Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    requesterId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    handlerId TEXT REFERENCES users(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    category TEXT CHECK(category IN ('order','account','listing','payment','technical','other')) DEFAULT 'other',
    priority TEXT CHECK(priority IN ('low','normal','high','urgent')) DEFAULT 'normal',
    status TEXT CHECK(status IN ('open','in_progress','on_hold','resolved','closed')) DEFAULT 'open',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    resolvedAt TEXT,
    firstResponseAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_tickets_requester ON tickets(requesterId);
CREATE INDEX IF NOT EXISTS idx_tickets_handler ON tickets(handlerId);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(createdAt);

-- Ticket Messages
CREATE TABLE IF NOT EXISTS ticket_messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    ticketId TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    senderId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSON,
    isInternal INTEGER DEFAULT 0, -- internal notes for support team
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticketId);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender ON ticket_messages(senderId);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created ON ticket_messages(createdAt);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    orderId TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    reviewerId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    targetUserId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
    comment TEXT,
    reviewType TEXT CHECK(reviewType IN ('buyer_to_seller','seller_to_buyer')) NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(orderId);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewerId);
CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(targetUserId);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    reporterId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    targetType TEXT CHECK(targetType IN ('pet','user','order','message')) NOT NULL,
    targetId TEXT NOT NULL,
    reason TEXT CHECK(reason IN ('spam','inappropriate','fraud','fake','harassment','copyright','other')) NOT NULL,
    details TEXT,
    status TEXT CHECK(status IN ('open','reviewing','actioned','dismissed')) DEFAULT 'open',
    reviewerId TEXT REFERENCES users(id) ON DELETE SET NULL,
    actionTaken TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporterId);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(targetType, targetId);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reviewer ON reports(reviewerId);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    actorId TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    targetType TEXT,
    targetId TEXT,
    metadata JSON,
    ip TEXT,
    ua TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actorId);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(targetType, targetId);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(createdAt);

-- Moderation Queue
CREATE TABLE IF NOT EXISTS moderation_queue (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    entityType TEXT CHECK(entityType IN ('pet','review','message','user')) NOT NULL,
    entityId TEXT NOT NULL,
    reason TEXT,
    status TEXT CHECK(status IN ('queued','approved','rejected','escalated')) DEFAULT 'queued',
    reviewerId TEXT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    reviewedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_moderation_entity ON moderation_queue(entityType, entityId);
CREATE INDEX IF NOT EXISTS idx_moderation_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_reviewer ON moderation_queue(reviewerId);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK(type IN ('order','message','review','report','system')) NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    data JSON, -- additional data for the notification
    isRead INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(userId, isRead);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(createdAt);

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sessionId TEXT,
    userId TEXT REFERENCES users(id) ON DELETE SET NULL,
    event TEXT NOT NULL,
    properties JSON,
    ip TEXT,
    ua TEXT,
    referer TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(userId);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(sessionId);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(createdAt);

-- System Settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updatedAt TEXT DEFAULT (datetime('now')),
    updatedBy TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updatedAt = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_addresses_timestamp 
AFTER UPDATE ON addresses
BEGIN
    UPDATE addresses SET updatedAt = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_pets_timestamp 
AFTER UPDATE ON pets
BEGIN
    UPDATE pets SET updatedAt = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_carts_timestamp 
AFTER UPDATE ON carts
BEGIN
    UPDATE carts SET updatedAt = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_orders_timestamp 
AFTER UPDATE ON orders
BEGIN
    UPDATE orders SET updatedAt = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_tickets_timestamp 
AFTER UPDATE ON tickets
BEGIN
    UPDATE tickets SET updatedAt = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_reports_timestamp 
AFTER UPDATE ON reports
BEGIN
    UPDATE reports SET updatedAt = datetime('now') WHERE id = NEW.id;
END;

-- Trigger to update thread last message timestamp
CREATE TRIGGER IF NOT EXISTS update_thread_last_message 
AFTER INSERT ON messages
BEGIN
    UPDATE threads SET lastMessageAt = datetime('now') WHERE id = NEW.threadId;
END;