-- Pet Marketplace Seed Data
-- Demo data for development and testing

-- Demo Users (passwords are hashed with bcrypt)
-- user1@demo.com / demo123
-- user2@demo.com / demo123  
-- admin@demo.com / demo123
-- support@demo.com / demo123

INSERT OR IGNORE INTO users (id, fullName, email, phone, passwordHash, role, status, avatarUrl, canSell, balance) VALUES
('demo_user_001', 'Nguyễn Văn Hùng', 'user1@demo.com', '0901234567', '$2b$10$8K5z5YJ.QYI1XJQJ5J5J5O.K5z5YJ.QYI1XJQJ5J5J5O.K5z5YJ.Q', 'user', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 0, 10000),
('demo_user_002', 'Trần Thị Linh', 'user2@demo.com', '0912345678', '$2b$10$8K5z5YJ.QYI1XJQJ5J5J5O.K5z5YJ.QYI1XJQJ5J5J5O.K5z5YJ.S', 'user', 'active', 'https://images.unsplash.com/photo-1494790108755-2616b612b618?w=150&h=150&fit=crop&crop=face', 1, 5000),
('demo_admin_001', 'Lê Văn Quản', 'admin@demo.com', '0923456789', '$2b$10$8K5z5YJ.QYI1XJQJ5J5J5O.K5z5YJ.QYI1XJQJ5J5J5O.K5z5YJ.A', 'admin', 'active', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 1, 15000),
('demo_support_001', 'Phạm Thị Hỗ Trợ', 'support@demo.com', '0934567890', '$2b$10$8K5z5YJ.QYI1XJQJ5J5J5O.K5z5YJ.QYI1XJQJ5J5J5O.K5z5YJ.T', 'support', 'active', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 0, 2500),
('demo_user_003', 'Hoàng Minh Tuấn', 'user3@demo.com', '0945678901', '$2b$10$8K5z5YJ.QYI1XJQJ5J5J5O.K5z5YJ.QYI1XJQJ5J5J5O.K5z5YJ.S2', 'user', 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 1, 8000),
('demo_user_004', 'Vũ Thị Lan', 'user4@demo.com', '0956789012', '$2b$10$8K5z5YJ.QYI1XJQJ5J5J5O.K5z5YJ.QYI1XJQJ5J5J5O.K5z5YJ.B2', 'user', 'active', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', 0, 12000);

-- Demo Addresses
INSERT OR IGNORE INTO addresses (id, userId, line1, ward, district, province, isDefault) VALUES
('addr_001', 'demo_user_001', '123 Nguyễn Trãi', 'Phường 2', 'Quận 5', 'TP.HCM', 1),
('addr_002', 'demo_user_002', '456 Lê Văn Sỹ', 'Phường 12', 'Quận 3', 'TP.HCM', 1),
('addr_003', 'demo_user_003', '789 Cách Mạng Tháng 8', 'Phường 5', 'Quận Tân Bình', 'TP.HCM', 1),
('addr_004', 'demo_user_004', '321 Võ Văn Kiệt', 'Phường An Lạc', 'Quận Bình Tân', 'TP.HCM', 1);

-- Demo Pet Listings (Approved)
INSERT OR IGNORE INTO pets (id, sellerId, title, slug, species, breed, sex, ageMonths, vaccinated, dewormed, price, description, locationProvince, photos, status, viewCount, weight, height, color, personalityTraits) VALUES
('pet_001', 'demo_user_002', 'Chó Golden Retriever đực 2 tháng tuổi', 'cho-golden-retriever-duc-2-thang-tuoi', 'dog', 'Golden Retriever', 'male', 2, 1, 1, 15000000, 'Chó Golden Retriever thuần chủng, đã tiêm đủ phòng bệnh và tẩy giun. Bé rất ngoan, thân thiện với trẻ em và dễ huấn luyện. Có giấy tờ đầy đủ.', 'TP.HCM', '["https://images.unsplash.com/photo-1552053831-71594a27632d?w=500", "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500"]', 'approved', 45, 8.5, 35, 'Vàng kim', 'thân thiện,năng động,thông minh'),

('pet_002', 'demo_user_002', 'Mèo Anh lông ngắn cái 3 tháng', 'meo-anh-long-ngan-cai-3-thang', 'cat', 'British Shorthair', 'female', 3, 1, 1, 8000000, 'Mèo Anh lông ngắn màu xám xanh, rất xinh và ngoan. Đã được tiêm phòng đầy đủ và tẩy giun. Ăn uống tốt, vui vẻ.', 'TP.HCM', '["https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500", "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=500"]', 'approved', 32, 2.1, 20, 'Xám xanh', 'điềm tĩnh,dễ thương,sạch sẽ'),

('pet_003', 'demo_user_003', 'Chó Poodle toy size màu trắng', 'cho-poodle-toy-size-mau-trang', 'dog', 'Toy Poodle', 'female', 4, 1, 1, 12000000, 'Chó Poodle toy size nhỏ xinh, lông trắng muốt rất đẹp. Tính tình vui vẻ, thông minh và rất trung thành. Phù hợp nuôi trong căn hộ.', 'TP.HCM', '["https://images.unsplash.com/photo-1616190264687-b7ebf7aa6b8f?w=500", "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=500"]', 'approved', 67, 2.8, 25, 'Trắng', 'thông minh,vui vẻ,trung thành'),

('pet_004', 'demo_user_003', 'Chim Yến phụng đôi màu đẹp', 'chim-yen-phung-doi-mau-dep', 'bird', 'Cockatiel', 'unknown', 6, 0, 0, 3500000, 'Đôi chim Yến phụng màu sắc đẹp, hót hay và rất dễ nuôi. Đã quen ăn cám và rau xanh. Bán kèm lồng và phụ kiện.', 'TP.HCM', '["https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=500", "https://images.unsplash.com/photo-1544744780-6c39b97bb12d?w=500"]', 'approved', 23, 0.15, 15, 'Vàng xám', 'hót hay,dễ nuôi,đẹp mắt'),

('pet_005', 'demo_user_002', 'Cá Betta Crown Tail đỏ', 'ca-betta-crown-tail-do', 'fish', 'Betta Crown Tail', 'male', 8, 0, 0, 250000, 'Cá Betta Crown Tail đực màu đỏ rực rỡ, đuôi tròn đẹp. Khỏe mạnh, ăn mồi tốt. Bán kèm bể nhỏ và thức ăn.', 'TP.HCM', '["https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=500", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500"]', 'approved', 18, 0.05, 8, 'Đỏ', 'đẹp,khỏe mạnh,dễ nuôi'),

('pet_006', 'demo_user_003', 'Thỏ Netherland Dwarf mini', 'tho-netherland-dwarf-mini', 'rabbit', 'Netherland Dwarf', 'male', 5, 1, 1, 1800000, 'Thỏ Netherland Dwarf size mini rất xinh, lông mềm mượt màu trắng pha nâu. Đã tiêm phòng và tẩy giun. Tính tình hiền lành.', 'TP.HCM', '["https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=500", "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=500"]', 'approved', 29, 1.2, 18, 'Trắng nâu', 'hiền lành,dễ thương,mini'),

('pet_007', 'demo_user_002', 'Chuột Hamster Golden đôi', 'chuot-hamster-golden-doi', 'hamster', 'Golden Hamster', 'unknown', 3, 0, 0, 450000, 'Đôi chuột Hamster Golden vàng óng, rất xinh và năng động. Bán kèm lồng, bánh xe và thức ăn. Dễ nuôi, phù hợp làm thú cưng cho trẻ em.', 'TP.HCM', '["https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=500", "https://images.unsplash.com/photo-1509205477838-a534e43a849f?w=500"]', 'approved', 41, 0.12, 12, 'Vàng', 'năng động,xinh xắn,dễ nuôi'),

('pet_008', 'demo_user_003', 'Rùa tai đỏ Brazil nhỏ', 'rua-tai-do-brazil-nho', 'reptile', 'Red-eared Slider', 'unknown', 12, 0, 0, 850000, 'Rùa tai đỏ Brazil kích thước nhỏ, khỏe mạnh và ăn uống tốt. Bán kèm bể nuôi và thức ăn viên. Dễ chăm sóc.', 'TP.HCM', '["https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=500", "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=500"]', 'approved', 15, 0.25, 8, 'Xanh đỏ', 'khỏe mạnh,dễ nuôi,nhỏ xinh');

-- Demo Pending Pet Listings (waiting for approval)
INSERT OR IGNORE INTO pets (id, sellerId, title, slug, species, breed, sex, ageMonths, vaccinated, dewormed, price, description, locationProvince, photos, status, viewCount) VALUES
('pet_pending_001', 'demo_user_002', 'Chó Husky Siberian xanh mắt', 'cho-husky-siberian-xanh-mat', 'dog', 'Siberian Husky', 'male', 8, 1, 1, 22000000, 'Chó Husky Siberian thuần chủng, mắt xanh rất đẹp. Tính tình năng động, thích chạy nhảy. Cần không gian rộng để vận động.', 'TP.HCM', '["https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=500"]', 'pending', 0),

('pet_pending_002', 'demo_user_003', 'Mèo Maine Coon giant size', 'meo-maine-coon-giant-size', 'cat', 'Maine Coon', 'male', 10, 1, 1, 15000000, 'Mèo Maine Coon kích thước lớn, lông dài màu nâu vằn. Tính tình hiền lành và thân thiện. Phù hợp với gia đình có trẻ em.', 'TP.HCM', '["https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500"]', 'pending', 0),

('pet_pending_003', 'demo_user_002', 'Chim Hoàng Anh Canary vàng', 'chim-hoang-anh-canary-vang', 'bird', 'Canary', 'female', 4, 0, 0, 1500000, 'Chim Hoàng Anh Canary màu vàng, hót rất hay và du dương. Đã quen ăn cám và trứng kiến. Bán kèm lồng đẹp.', 'TP.HCM', '["https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=500"]', 'pending', 0),

('pet_pending_004', 'demo_user_003', 'Cá Rồng Châu Á Red Dragon', 'ca-rong-chau-a-red-dragon', 'fish', 'Asian Arowana', 'unknown', 24, 0, 0, 50000000, 'Cá Rồng Châu Á Red Dragon kích thước 35cm, màu đỏ rực rỡ. Có chứng chỉ nguồn gốc hợp pháp. Bể nuôi tối thiểu 500L.', 'TP.HCM', '["https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=500"]', 'pending', 0),

('pet_pending_005', 'demo_user_002', 'Iguana xanh Nam Mỹ lớn', 'iguana-xanh-nam-my-lon', 'reptile', 'Green Iguana', 'unknown', 36, 0, 0, 8000000, 'Iguana xanh Nam Mỹ kích thước lớn, màu xanh đẹp mắt. Đã thuần dưỡng, ăn rau củ và trái cây. Cần terrarium lớn để nuôi.', 'TP.HCM', '["https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=500"]', 'pending', 0);

-- Demo Orders
INSERT OR IGNORE INTO orders (id, buyerId, sellerId, petId, amount, status, paymentMethod, deliveryMethod, notes, confirmedAt) VALUES
('order_001', 'demo_user_001', 'demo_user_002', 'pet_002', 8000000, 'delivered', 'cod', 'pickup', 'Khách hàng đến lấy trực tiếp tại shop', '2024-01-10 14:30:00'),
('order_002', 'demo_user_004', 'demo_user_003', 'pet_003', 12000000, 'confirmed', 'transfer', 'ship', 'Giao hàng tận nơi, liên hệ trước 30 phút', '2024-01-15 09:15:00'),
('order_003', 'demo_user_001', 'demo_user_002', 'pet_005', 250000, 'preparing', 'cod', 'pickup', 'Đặt trước, lấy cuối tuần', '2024-01-18 11:00:00');

-- Demo Chat Threads
INSERT OR IGNORE INTO threads (id, buyerId, sellerId, petId, orderId, status) VALUES
('thread_001', 'demo_buyer_001', 'demo_seller_001', 'pet_001', NULL, 'open'),
('thread_002', 'demo_buyer_002', 'demo_seller_002', 'pet_003', 'order_002', 'open');

-- Demo Messages
INSERT OR IGNORE INTO messages (id, threadId, senderId, receiverId, content, messageType) VALUES
('msg_001', 'thread_001', 'demo_buyer_001', 'demo_seller_001', 'Chào chị, em muốn hỏi về chú chó Golden này ạ', 'text'),
('msg_002', 'thread_001', 'demo_seller_001', 'demo_buyer_001', 'Chào em! Chú Golden này rất khỏe mạnh và đã tiêm phòng đầy đủ nhé', 'text'),
('msg_003', 'thread_001', 'demo_buyer_001', 'demo_seller_001', 'Vậy em có thể đến xem trực tiếp được không ạ?', 'text'),
('msg_004', 'thread_002', 'demo_buyer_002', 'demo_seller_002', 'Cho em xem thêm video của bé Poodle được không ạ?', 'text'),
('msg_005', 'thread_002', 'demo_seller_002', 'demo_buyer_002', 'Dạ được ạ, tối nay chị gửi video cho em', 'text');

-- Demo Support Tickets
INSERT OR IGNORE INTO tickets (id, requesterId, handlerId, subject, category, priority, status, firstResponseAt) VALUES
('ticket_001', 'demo_buyer_001', 'demo_support_001', 'Không thể thanh toán đơn hàng', 'order', 'high', 'resolved', '2024-01-12 10:30:00'),
('ticket_002', 'demo_seller_001', NULL, 'Cần hỗ trợ upload ảnh sản phẩm', 'listing', 'normal', 'open', NULL),
('ticket_003', 'demo_buyer_002', 'demo_support_001', 'Đăng ký tài khoản không nhận được email xác nhận', 'account', 'normal', 'in_progress', '2024-01-16 14:15:00');

-- Demo Ticket Messages
INSERT OR IGNORE INTO ticket_messages (id, ticketId, senderId, content) VALUES
('tmsg_001', 'ticket_001', 'demo_buyer_001', 'Em không thể thanh toán đơn hàng #order_001, trang bị lỗi'),
('tmsg_002', 'ticket_001', 'demo_support_001', 'Anh cho em biết phương thức thanh toán nào anh đang chọn?'),
('tmsg_003', 'ticket_001', 'demo_buyer_001', 'Em chọn COD nhưng không có nút xác nhận'),
('tmsg_004', 'ticket_001', 'demo_support_001', 'Hệ thống đã được cập nhật, anh thử lại nhé'),
('tmsg_005', 'ticket_002', 'demo_seller_001', 'Chị upload ảnh bị lỗi "file too large", phải làm sao ạ?'),
('tmsg_006', 'ticket_003', 'demo_buyer_002', 'Em đăng ký từ hôm qua nhưng chưa nhận được email');

-- Demo Reviews
INSERT OR IGNORE INTO reviews (id, orderId, reviewerId, targetUserId, rating, comment, reviewType) VALUES
('review_001', 'order_001', 'demo_buyer_001', 'demo_seller_001', 5, 'Mèo rất xinh và khỏe mạnh, chị bán hàng rất nhiệt tình!', 'buyer_to_seller'),
('review_002', 'order_001', 'demo_seller_001', 'demo_buyer_001', 5, 'Khách hàng rất dễ thương, lịch sự và đúng giờ hẹn', 'seller_to_buyer');

-- Demo Favorites
INSERT OR IGNORE INTO favorites (id, userId, petId) VALUES
('fav_001', 'demo_buyer_001', 'pet_009'),
('fav_002', 'demo_buyer_001', 'pet_010'),
('fav_003', 'demo_buyer_002', 'pet_001'),
('fav_004', 'demo_buyer_002', 'pet_006');

-- Demo Cart
INSERT OR IGNORE INTO carts (id, buyerId) VALUES
('cart_001', 'demo_buyer_001'),
('cart_002', 'demo_buyer_002');

-- Demo Cart Items
INSERT OR IGNORE INTO cart_items (id, cartId, petId, qty) VALUES
('ci_001', 'cart_001', 'pet_007', 1),
('ci_002', 'cart_002', 'pet_004', 1),
('ci_003', 'cart_002', 'pet_008', 1);

-- Demo Reports
INSERT OR IGNORE INTO reports (id, reporterId, targetType, targetId, reason, details, status) VALUES
('report_001', 'demo_buyer_001', 'pet', 'pet_pending_004', 'fake', 'Cá này có vẻ không đúng loài như mô tả', 'open'),
('report_002', 'demo_buyer_002', 'user', 'demo_seller_002', 'inappropriate', 'Người bán sử dụng ngôn từ không phù hợp trong chat', 'reviewing');

-- Demo Notifications
INSERT OR IGNORE INTO notifications (id, userId, type, title, content, data) VALUES
('notif_001', 'demo_buyer_001', 'order', 'Đơn hàng đã được xác nhận', 'Đơn hàng #order_003 đã được người bán xác nhận', '{"orderId": "order_003"}'),
('notif_002', 'demo_seller_001', 'message', 'Tin nhắn mới', 'Bạn có tin nhắn mới từ khách hàng', '{"threadId": "thread_001"}'),
('notif_003', 'demo_buyer_002', 'system', 'Chào mừng đến PetMarket!', 'Cảm ơn bạn đã đăng ký tài khoản. Hãy khám phá các thú cưng đáng yêu!', '{}');

-- Demo System Settings
INSERT OR IGNORE INTO settings (key, value, description, updatedBy) VALUES
('site_name', 'PetMarket Vietnam', 'Tên website hiển thị', 'demo_admin_001'),
('max_pet_photos', '5', 'Số lượng ảnh tối đa cho mỗi tin đăng', 'demo_admin_001'),
('commission_rate', '5', 'Tỷ lệ hoa hồng (%) cho mỗi giao dịch', 'demo_admin_001'),
('auto_approve_listings', 'false', 'Tự động duyệt tin đăng mới', 'demo_admin_001'),
('maintenance_mode', 'false', 'Chế độ bảo trì website', 'demo_admin_001');