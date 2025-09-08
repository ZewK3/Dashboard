/**
 * Admin Dashboard JavaScript
 * Handles admin authentication and dashboard functionality
 */

import { petsAPI, apiState } from './api.js';
import { storage, formatCurrency, formatDate, showToast } from './utils.js';

// Admin state
let adminUser = null;
let currentTab = 'pending-listings';

/**
 * Initialize admin dashboard
 */
async function initAdmin() {
    try {
        // Check if user is authenticated and has admin role
        const result = await petsAPI.auth.getProfile();
        
        if (!result.success) {
            showLoginModal();
            return;
        }

        const user = result.data.user;
        if (user.role !== 'admin') {
            showToast('Bạn không có quyền truy cập trang này', 'error');
            window.location.href = 'index.html';
            return;
        }

        adminUser = user;
        hideAuthCheck();
        showDashboard();
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error initializing admin:', error);
        showLoginModal();
    }
}

/**
 * Show login modal
 */
function showLoginModal() {
    document.getElementById('auth-check').style.display = 'none';
    document.getElementById('admin-login-modal').style.display = 'flex';
}

/**
 * Hide auth check screen
 */
function hideAuthCheck() {
    document.getElementById('auth-check').style.display = 'none';
}

/**
 * Show admin dashboard
 */
function showDashboard() {
    document.getElementById('admin-dashboard').style.display = 'block';
    
    // Update admin info in header
    if (adminUser) {
        document.getElementById('admin-name').textContent = adminUser.fullName;
        if (adminUser.avatar) {
            document.getElementById('admin-avatar').src = adminUser.avatar;
        }
    }
}

/**
 * Handle admin login
 */
async function handleAdminLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    try {
        const result = await petsAPI.auth.login(email, password);
        
        if (!result.success) {
            showToast(result.error || 'Đăng nhập không thành công', 'error');
            return;
        }

        const user = result.data.user;
        if (user.role !== 'admin') {
            showToast('Tài khoản này không có quyền quản trị', 'error');
            await petsAPI.auth.logout();
            return;
        }

        adminUser = user;
        document.getElementById('admin-login-modal').style.display = 'none';
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
        loadPendingPets(),
        loadUsers()
    ]);
}

/**
 * Load admin statistics
 */
async function loadStats() {
    try {
        const result = await petsAPI.admin.getStats();
        
        if (result.success) {
            const stats = result.data;
            document.getElementById('total-users').textContent = stats.totalUsers || 0;
            document.getElementById('total-pets').textContent = stats.totalPets || 0;
            document.getElementById('pending-approval').textContent = stats.pendingApproval || 0;
            document.getElementById('revenue-today').textContent = formatCurrency(stats.revenueToday || 0);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load pending pets for approval
 */
async function loadPendingPets() {
    try {
        const result = await petsAPI.admin.getPendingPets();
        const tbody = document.getElementById('pending-pets-list');
        
        if (!result.success) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">Không thể tải dữ liệu</td></tr>';
            return;
        }

        const pets = result.data.pets || [];
        
        if (pets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">Không có tin đăng nào chờ duyệt</td></tr>';
            return;
        }

        tbody.innerHTML = pets.map(pet => `
            <tr>
                <td>#${pet.id}</td>
                <td>
                    <div class="pet-title">
                        <strong>${pet.title}</strong>
                        <small>${pet.species} - ${pet.breed}</small>
                    </div>
                </td>
                <td>${pet.seller?.fullName || 'N/A'}</td>
                <td>${formatCurrency(pet.price)}</td>
                <td>${formatDate(pet.createdAt)}</td>
                <td>
                    <span class="status-badge status-${pet.status}">${getStatusText(pet.status)}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-success btn-sm" onclick="approvePet(${pet.id})">
                            <i class="fas fa-check"></i> Duyệt
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="rejectPet(${pet.id})">
                            <i class="fas fa-times"></i> Từ chối
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading pending pets:', error);
        document.getElementById('pending-pets-list').innerHTML = 
            '<tr><td colspan="7" class="no-data">Có lỗi xảy ra khi tải dữ liệu</td></tr>';
    }
}

/**
 * Load users for management
 */
async function loadUsers() {
    try {
        const result = await petsAPI.admin.getUsers();
        const tbody = document.getElementById('users-list');
        
        if (!result.success) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">Không thể tải dữ liệu</td></tr>';
            return;
        }

        const users = result.data.users || [];
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">Không có người dùng nào</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>#${user.id}</td>
                <td>
                    <div class="user-info">
                        <img src="${user.avatar || '/assets/img/default-avatar.png'}" alt="${user.fullName}" class="user-avatar">
                        <strong>${user.fullName}</strong>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge role-${user.role}">${getRoleText(user.role)}</span>
                </td>
                <td>${formatCurrency(user.balance || 0)}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="editUser(${user.id})">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('users-list').innerHTML = 
            '<tr><td colspan="7" class="no-data">Có lỗi xảy ra khi tải dữ liệu</td></tr>';
    }
}

/**
 * Approve a pet listing
 */
async function approvePet(petId) {
    if (!confirm('Bạn có chắc muốn duyệt tin đăng này?')) return;
    
    try {
        const result = await petsAPI.admin.approvePet(petId);
        
        if (result.success) {
            showToast('Đã duyệt tin đăng thành công', 'success');
            await loadPendingPets();
            await loadStats();
        } else {
            showToast(result.error || 'Không thể duyệt tin đăng', 'error');
        }
    } catch (error) {
        console.error('Error approving pet:', error);
        showToast('Có lỗi xảy ra khi duyệt tin đăng', 'error');
    }
}

/**
 * Reject a pet listing
 */
async function rejectPet(petId) {
    const reason = prompt('Lý do từ chối:');
    if (!reason) return;
    
    try {
        const result = await petsAPI.admin.rejectPet(petId, reason);
        
        if (result.success) {
            showToast('Đã từ chối tin đăng', 'success');
            await loadPendingPets();
            await loadStats();
        } else {
            showToast(result.error || 'Không thể từ chối tin đăng', 'error');
        }
    } catch (error) {
        console.error('Error rejecting pet:', error);
        showToast('Có lỗi xảy ra khi từ chối tin đăng', 'error');
    }
}

/**
 * Edit user (placeholder)
 */
function editUser(userId) {
    showToast('Chức năng chỉnh sửa người dùng đang được phát triển', 'info');
}

/**
 * Handle tab switching
 */
function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    currentTab = tabName;
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
        'pending': 'Chờ duyệt',
        'approved': 'Đã duyệt',
        'rejected': 'Từ chối',
        'available': 'Có sẵn',
        'sold': 'Đã bán'
    };
    return statusMap[status] || status;
}

function getRoleText(role) {
    const roleMap = {
        'user': 'Người dùng',
        'admin': 'Quản trị viên',
        'support': 'Hỗ trợ'
    };
    return roleMap[role] || role;
}

/**
 * Event listeners
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize admin dashboard
    initAdmin();
    
    // Login form
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // User dropdown toggle
    const userBtn = document.getElementById('admin-user-btn');
    const dropdown = document.getElementById('admin-dropdown');
    
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
});

// Make functions available globally for onclick handlers
window.approvePet = approvePet;
window.rejectPet = rejectPet;
window.editUser = editUser;
window.logout = logout;