/**
 * Support Dashboard JavaScript
 * Handles support staff authentication and ticket management
 */

import { petsAPI, apiState } from './api.js';
import { storage, formatDate, showToast } from './utils.js';

// Support state
let supportUser = null;
let currentTicket = null;
let tickets = [];

// Message templates
const messageTemplates = {
    greeting: 'Chào bạn! Cảm ơn bạn đã liên hệ với PetMarket. Tôi có thể giúp gì cho bạn?',
    thanks: 'Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi luôn sẵn sàng hỗ trợ bạn!',
    closing: 'Nếu bạn có thêm câu hỏi nào khác, đừng ngần ngại liên hệ với chúng tôi. Chúc bạn một ngày tốt lành! 🐾'
};

/**
 * Initialize support dashboard
 */
async function initSupport() {
    try {
        // Check if user is authenticated and has support role
        const result = await petsAPI.auth.getProfile();
        
        if (!result.success) {
            showLoginModal();
            return;
        }

        const user = result.data.user;
        if (user.role !== 'support') {
            showToast('Bạn không có quyền truy cập trang này', 'error');
            window.location.href = 'index.html';
            return;
        }

        supportUser = user;
        hideAuthCheck();
        showDashboard();
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error initializing support:', error);
        showLoginModal();
    }
}

/**
 * Show login modal
 */
function showLoginModal() {
    document.getElementById('auth-check').style.display = 'none';
    document.getElementById('support-login-modal').style.display = 'flex';
}

/**
 * Hide auth check screen
 */
function hideAuthCheck() {
    document.getElementById('auth-check').style.display = 'none';
}

/**
 * Show support dashboard
 */
function showDashboard() {
    document.getElementById('support-dashboard').style.display = 'block';
    
    // Update support info in header
    if (supportUser) {
        document.getElementById('support-name').textContent = supportUser.fullName;
        if (supportUser.avatar) {
            document.getElementById('support-avatar').src = supportUser.avatar;
        }
    }
}

/**
 * Handle support login
 */
async function handleSupportLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('support-email').value;
    const password = document.getElementById('support-password').value;
    
    try {
        const result = await petsAPI.auth.login(email, password);
        
        if (!result.success) {
            showToast(result.error || 'Đăng nhập không thành công', 'error');
            return;
        }

        const user = result.data.user;
        if (user.role !== 'support') {
            showToast('Tài khoản này không có quyền hỗ trợ', 'error');
            await petsAPI.auth.logout();
            return;
        }

        supportUser = user;
        document.getElementById('support-login-modal').style.display = 'none';
        showDashboard();
        await loadDashboardData();
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('Có lỗi xảy ra khi đăng nhập', 'error');
    }
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    await Promise.all([
        loadStats(),
        loadTickets()
    ]);
}

/**
 * Load support statistics
 */
async function loadStats() {
    try {
        const result = await petsAPI.support.getTickets();
        
        if (result.success) {
            const allTickets = result.data.tickets || [];
            const pendingTickets = allTickets.filter(t => t.status === 'pending');
            const resolvedToday = allTickets.filter(t => 
                t.status === 'resolved' && 
                new Date(t.updatedAt).toDateString() === new Date().toDateString()
            );
            
            document.getElementById('total-tickets').textContent = allTickets.length;
            document.getElementById('pending-tickets').textContent = pendingTickets.length;
            document.getElementById('resolved-today').textContent = resolvedToday.length;
            
            // Calculate average rating (placeholder)
            document.getElementById('avg-rating').textContent = '4.8';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load support tickets
 */
async function loadTickets() {
    try {
        const result = await petsAPI.support.getTickets();
        const ticketListElement = document.getElementById('ticket-list');
        
        if (!result.success) {
            ticketListElement.innerHTML = '<div class="no-data">Không thể tải danh sách ticket</div>';
            return;
        }

        tickets = result.data.tickets || [];
        
        if (tickets.length === 0) {
            ticketListElement.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-inbox"></i>
                    <p>Chưa có ticket nào cần xử lý</p>
                </div>
            `;
            return;
        }

        ticketListElement.innerHTML = tickets.map(ticket => `
            <div class="ticket-item ${ticket.id === currentTicket?.id ? 'active' : ''}" onclick="selectTicket(${ticket.id})">
                <div class="ticket-header">
                    <div class="ticket-info">
                        <h4>${ticket.subject}</h4>
                        <p class="ticket-user">
                            <i class="fas fa-user"></i> ${ticket.user?.fullName || 'Unknown'}
                        </p>
                    </div>
                    <div class="ticket-meta">
                        <span class="ticket-status status-${ticket.status}">${getStatusText(ticket.status)}</span>
                        <span class="ticket-priority priority-${ticket.priority}">${getPriorityText(ticket.priority)}</span>
                    </div>
                </div>
                <div class="ticket-preview">
                    <p>${ticket.lastMessage || 'Chưa có tin nhắn'}</p>
                    <small class="ticket-time">${formatDate(ticket.updatedAt)}</small>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading tickets:', error);
        document.getElementById('ticket-list').innerHTML = 
            '<div class="no-data">Có lỗi xảy ra khi tải dữ liệu</div>';
    }
}

/**
 * Select a ticket for detailed view
 */
async function selectTicket(ticketId) {
    try {
        const result = await petsAPI.support.getTicket(ticketId);
        
        if (!result.success) {
            showToast('Không thể tải thông tin ticket', 'error');
            return;
        }

        currentTicket = result.data.ticket;
        
        // Update ticket list active state
        document.querySelectorAll('.ticket-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.ticket-item').classList.add('active');
        
        // Show chat area
        showChatArea();
        
        // Load messages
        await loadTicketMessages();
        
    } catch (error) {
        console.error('Error selecting ticket:', error);
        showToast('Có lỗi xảy ra khi tải ticket', 'error');
    }
}

/**
 * Show chat area with ticket details
 */
function showChatArea() {
    const chatArea = document.getElementById('chat-area-section');
    chatArea.style.display = 'block';
    
    // Update chat header
    document.getElementById('chat-user-name').textContent = currentTicket.user?.fullName || 'Unknown';
    document.getElementById('chat-ticket-subject').textContent = currentTicket.subject;
    document.getElementById('chat-ticket-status').textContent = getStatusText(currentTicket.status);
    document.getElementById('chat-ticket-status').className = `ticket-status status-${currentTicket.status}`;
    
    if (currentTicket.user?.avatar) {
        document.getElementById('chat-user-avatar').src = currentTicket.user.avatar;
    }
    
    // Update action buttons based on status
    const resolveBtn = document.getElementById('resolve-btn');
    const closeBtn = document.getElementById('close-btn');
    
    if (currentTicket.status === 'resolved' || currentTicket.status === 'closed') {
        resolveBtn.style.display = 'none';
        closeBtn.textContent = 'Đã đóng';
        closeBtn.disabled = true;
    } else {
        resolveBtn.style.display = 'inline-block';
        closeBtn.textContent = 'Đóng';
        closeBtn.disabled = false;
    }
}

/**
 * Load messages for current ticket
 */
async function loadTicketMessages() {
    if (!currentTicket) return;
    
    try {
        const result = await petsAPI.chat.getMessages(currentTicket.chatThreadId);
        const messagesContainer = document.getElementById('chat-messages');
        
        if (!result.success) {
            messagesContainer.innerHTML = '<div class="no-data">Không thể tải tin nhắn</div>';
            return;
        }

        const messages = result.data.messages || [];
        
        if (messages.length === 0) {
            messagesContainer.innerHTML = '<div class="no-data">Chưa có tin nhắn nào</div>';
            return;
        }

        messagesContainer.innerHTML = messages.map(message => `
            <div class="message ${message.senderId === supportUser.id ? 'support-message' : 'user-message'}">
                <div class="message-content">
                    <p>${message.content}</p>
                    <small class="message-time">${formatDate(message.createdAt)}</small>
                </div>
            </div>
        `).join('');
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

/**
 * Send reply to ticket
 */
async function sendSupportReply(event) {
    event.preventDefault();
    
    if (!currentTicket) {
        showToast('Vui lòng chọn ticket để trả lời', 'error');
        return;
    }
    
    const messageInput = document.getElementById('support-message-input');
    const message = messageInput.value.trim();
    
    if (!message) {
        showToast('Vui lòng nhập nội dung tin nhắn', 'error');
        return;
    }
    
    try {
        const result = await petsAPI.support.replyToTicket(currentTicket.id, message);
        
        if (result.success) {
            messageInput.value = '';
            showToast('Đã gửi phản hồi thành công', 'success');
            await loadTicketMessages();
            await loadTickets(); // Refresh ticket list
        } else {
            showToast(result.error || 'Không thể gửi phản hồi', 'error');
        }
    } catch (error) {
        console.error('Error sending reply:', error);
        showToast('Có lỗi xảy ra khi gửi phản hồi', 'error');
    }
}

/**
 * Resolve current ticket
 */
async function resolveTicket() {
    if (!currentTicket) return;
    
    if (!confirm('Bạn có chắc muốn đánh dấu ticket này là đã giải quyết?')) return;
    
    try {
        const result = await petsAPI.support.closeTicket(currentTicket.id);
        
        if (result.success) {
            showToast('Đã đánh dấu ticket là đã giải quyết', 'success');
            currentTicket.status = 'resolved';
            showChatArea(); // Update UI
            await loadTickets();
            await loadStats();
        } else {
            showToast(result.error || 'Không thể giải quyết ticket', 'error');
        }
    } catch (error) {
        console.error('Error resolving ticket:', error);
        showToast('Có lỗi xảy ra khi giải quyết ticket', 'error');
    }
}

/**
 * Close current ticket
 */
async function closeTicket() {
    if (!currentTicket) return;
    
    if (!confirm('Bạn có chắc muốn đóng ticket này?')) return;
    
    try {
        const result = await petsAPI.support.closeTicket(currentTicket.id);
        
        if (result.success) {
            showToast('Đã đóng ticket thành công', 'success');
            currentTicket.status = 'closed';
            showChatArea(); // Update UI
            await loadTickets();
            await loadStats();
        } else {
            showToast(result.error || 'Không thể đóng ticket', 'error');
        }
    } catch (error) {
        console.error('Error closing ticket:', error);
        showToast('Có lỗi xảy ra khi đóng ticket', 'error');
    }
}

/**
 * Insert message template
 */
function insertTemplate(templateType) {
    const messageInput = document.getElementById('support-message-input');
    const template = messageTemplates[templateType];
    
    if (template) {
        if (messageInput.value) {
            messageInput.value += '\n\n' + template;
        } else {
            messageInput.value = template;
        }
        messageInput.focus();
    }
}

/**
 * Refresh tickets
 */
async function refreshTickets() {
    await loadTickets();
    await loadStats();
    showToast('Đã làm mới danh sách ticket', 'success');
}

/**
 * Logout function
 */
async function logout() {
    if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
    
    try {
        await petsAPI.auth.logout();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

/**
 * Helper functions
 */
function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ xử lý',
        'in-progress': 'Đang xử lý',
        'resolved': 'Đã giải quyết',
        'closed': 'Đã đóng'
    };
    return statusMap[status] || status;
}

function getPriorityText(priority) {
    const priorityMap = {
        'high': 'Cao',
        'medium': 'Trung bình',
        'low': 'Thấp'
    };
    return priorityMap[priority] || priority;
}

/**
 * Event listeners
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize support dashboard
    initSupport();
    
    // Login form
    const loginForm = document.getElementById('support-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleSupportLogin);
    }
    
    // Reply form
    const replyForm = document.getElementById('support-reply-form');
    if (replyForm) {
        replyForm.addEventListener('submit', sendSupportReply);
    }
    
    // User dropdown toggle
    const userBtn = document.getElementById('support-user-btn');
    const dropdown = document.getElementById('support-dropdown');
    
    if (userBtn && dropdown) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });
    }
    
    // Ticket filters
    const statusFilter = document.getElementById('ticket-status-filter');
    const priorityFilter = document.getElementById('ticket-priority-filter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTickets);
    }
    
    if (priorityFilter) {
        priorityFilter.addEventListener('change', filterTickets);
    }
});

/**
 * Filter tickets based on status and priority
 */
function filterTickets() {
    const statusFilter = document.getElementById('ticket-status-filter').value;
    const priorityFilter = document.getElementById('ticket-priority-filter').value;
    
    const ticketItems = document.querySelectorAll('.ticket-item');
    
    ticketItems.forEach(item => {
        const ticketId = item.onclick.toString().match(/selectTicket\((\d+)\)/)?.[1];
        const ticket = tickets.find(t => t.id == ticketId);
        
        if (!ticket) return;
        
        const statusMatch = statusFilter === 'all' || ticket.status === statusFilter;
        const priorityMatch = priorityFilter === 'all' || ticket.priority === priorityFilter;
        
        if (statusMatch && priorityMatch) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Make functions available globally for onclick handlers
window.selectTicket = selectTicket;
window.resolveTicket = resolveTicket;
window.closeTicket = closeTicket;
window.insertTemplate = insertTemplate;
window.refreshTickets = refreshTickets;
window.logout = logout;