-- Sample data for Pet Marketplace
-- Insert demo users, pets, and other test data

-- Demo Users
INSERT OR IGNORE INTO users (id, name, email, password, role, balance, can_sell) VALUES 
('user1', 'Nguyễn Văn An', 'user1@demo.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'user', 5.0, 1),
('user2', 'Trần Thị Bình', 'user2@demo.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'user', 10.0, 1),
('admin1', 'Admin User', 'admin@demo.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'admin', 0.0, 0),
('support1', 'Support Staff', 'support@demo.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'support', 0.0, 0);

-- Demo Pets
INSERT OR IGNORE INTO pets (id, seller_id, name, description, category, breed, age, price, images, slug, status) VALUES 
('pet1', 'user1', 'Chó Golden Retriever xinh xắn', 'Chó Golden Retriever 2 tuổi, rất thân thiện và đã được huấn luyện cơ bản. Đã tiêm phòng đầy đủ.', 'dog', 'Golden Retriever', '2 tuổi', 500.0, '["https://images.unsplash.com/photo-1552053831-71594a27632d?w=500"]', 'cho-golden-retriever-xinh-xan', 'approved'),
('pet2', 'user1', 'Mèo Ba Tư lông dài', 'Mèo Ba Tư thuần chủng, lông dài mượt mà, tính cách hiền lành. Rất thích hợp làm thú cưng trong nhà.', 'cat', 'Persian', '1.5 tuổi', 300.0, '["https://images.unsplash.com/photo-1513245543132-31f507417b26?w=500"]', 'meo-ba-tu-long-dai', 'approved'),
('pet3', 'user2', 'Chó Pomeranian mini', 'Chó Pomeranian kích thước mini, màu vàng cam xinh xắn. Rất năng động và thông minh.', 'dog', 'Pomeranian', '8 tháng', 800.0, '["https://images.unsplash.com/photo-1551717743-49959800b1f6?w=500"]', 'cho-pomeranian-mini', 'approved'),
('pet4', 'user2', 'Mèo anh lông ngắn', 'Mèo anh lông ngắn màu xám bạc, tính cách độc lập nhưng rất gần gũi với chủ.', 'cat', 'British Shorthair', '3 tuổi', 250.0, '["https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=500"]', 'meo-anh-long-ngan', 'pending');

-- Demo user sessions (expired for security)
INSERT OR IGNORE INTO user_sessions (user_id, token, expires_at) VALUES 
('user1', 'demo-token-user1', '2024-01-01T00:00:00Z'),
('user2', 'demo-token-user2', '2024-01-01T00:00:00Z');

-- Demo favorites
INSERT OR IGNORE INTO favorites (user_id, pet_id) VALUES 
('user1', 'pet3'),
('user2', 'pet1'),
('user2', 'pet2');

-- Demo cart items
INSERT OR IGNORE INTO cart_items (user_id, pet_id) VALUES 
('user1', 'pet4'),
('user2', 'pet1');

-- Demo support tickets
INSERT OR IGNORE INTO support_tickets (id, user_id, subject, description, status, priority) VALUES 
('ticket1', 'user1', 'Không thể tải ảnh lên', 'Tôi gặp vấn đề khi tải ảnh thú cưng lên hệ thống. Ảnh bị lỗi và không hiển thị.', 'open', 'medium'),
('ticket2', 'user2', 'Thanh toán không thành công', 'Tôi đã nạp tiền nhưng số dư tài khoản không được cập nhật.', 'in_progress', 'high');

-- Demo support ticket replies
INSERT OR IGNORE INTO support_ticket_replies (ticket_id, user_id, message, is_internal) VALUES 
('ticket1', 'support1', 'Chúng tôi đã nhận được báo cáo của bạn. Vui lòng thử lại với ảnh có kích thước nhỏ hơn 5MB.', 0),
('ticket1', 'user1', 'Tôi đã thử với ảnh nhỏ hơn nhưng vẫn không được. Có thể hỗ trợ thêm không?', 0),
('ticket2', 'support1', 'Chúng tôi đang kiểm tra hệ thống thanh toán. Sẽ cập nhật cho bạn sớm nhất.', 0);