// ========================================
// ADMIN PANEL DATA MANAGEMENT
// ========================================

let users = [];
let orders = [];
let products = [];

const API_URL = 'http://localhost:5001';

// ========================================
// 1. AUTHENTICATION & HEADERS HELPER
// ========================================

// Check if admin is logged in immediately
function checkAuth() {
    const token = localStorage.getItem('luxe_token');
    const user = JSON.parse(localStorage.getItem('luxe_current_user'));

    if (!token || !user || user.role !== 'admin') {
        alert("Access Denied: Admins only.");
        window.location.href = '/Frontend/pages/login.html';
        return false;
    }
    return true;
}

// Helper to get headers with Token
function getAuthHeaders() {
    const token = localStorage.getItem('luxe_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// ========================================
// 2. DATA FETCHING (Async Functions)
// ========================================

async function fetchAllData() {
    if (!checkAuth()) return;

    try {
        const headers = getAuthHeaders();

        // 1. Fetch Users
        const usersRes = await fetch(`${API_URL}/users`, { headers });
        if (usersRes.ok) {
            const data = await usersRes.json();
            users = data.users || data; // Handle if response is { users: [...] } or just [...]
            console.log(` Loaded ${users.length} users`);
            renderUsers();
        } else {
            console.error('Failed to load users');
        }

        // 2. Fetch Products
        const productsRes = await fetch(`${API_URL}/api/products`); // Public route, no token strictly needed but good practice
        if (productsRes.ok) {
            products = await productsRes.json();
            console.log(` Loaded ${products.length} products`);
            renderProducts();
        }

        // 3. Fetch Orders (Protected Admin Route)
        const ordersRes = await fetch(`${API_URL}/api/orders`, { headers });
        if (ordersRes.ok) {
            orders = await ordersRes.json();
            console.log(`✅ Loaded ${orders.length} orders`);
            renderOrders();
        } else {
            console.error('Failed to load orders');
        }

        // 4. Update Statistics
        updateStatistics();

    } catch (error) {
        console.error("Error loading admin data:", error);
        showNotification("Error connecting to server. Is backend running?", "error");
    }
}

async function updateStatistics() {
    try {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_URL}/api/stats`, { headers });
        
        if (res.ok) {
            const data = await res.json();
            document.getElementById('total-users').textContent = data.userCount;
            document.getElementById('total-orders').textContent = data.orderCount;
            document.getElementById('total-products').textContent = data.productCount;
            document.getElementById('total-revenue').textContent = `${data.revenue} DHS`;
        }
    } catch (error) {
        console.log("Stats error:", error);
    }
}

// ========================================
// 3. ACTION FUNCTIONS (Delete, Save)
// ========================================

// Delete User
async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_URL}/users/${id}`, { 
            method: 'DELETE',
            headers: headers
        });
        
        if (response.ok) {
            showNotification('User deleted successfully!', 'success');
            fetchAllData(); // Refresh data
        } else {
            const err = await response.json();
            showNotification(err.error || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Error deleting user', 'error');
    }
}

// Delete Product
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_URL}/api/products/${id}`, { 
            method: 'DELETE',
            headers: headers
        });
        
        if (response.ok) {
            showNotification('Product deleted successfully!', 'success');
            fetchAllData();
        } else {
            showNotification('Error deleting product', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Error deleting product', 'error');
    }
}

// Save Product (Create)
async function saveProduct(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: document.getElementById('product-stock').value === 'true',
        rating: parseFloat(document.getElementById('product-rating').value),
        imageUrl: document.getElementById('product-image').value || 'https://placehold.co/400x400/F0F0F0/0A0A0A?text=No+Image',
        isNew: document.getElementById('product-new').checked,
        isSale: document.getElementById('product-sale').checked
    };

    try {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_URL}/api/products`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(productData)
        });

        if (res.ok) {
            showNotification('Product added successfully!', 'success');
            closeProductModal();
            fetchAllData();
        } else {
            const err = await res.json();
            showNotification(err.message || 'Error saving product', 'error');
        }
    } catch (error) {
        console.error(error);
        showNotification('Server Error', 'error');
    }
}

// ========================================
// 4. RENDERING FUNCTIONS (UI Only)
// ========================================

function renderUsers(searchTerm = '') {
    const tbody = document.getElementById('users-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const filteredUsers = users.filter(user =>
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filteredUsers.forEach(user => {
        const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
        const dateStr = user.joined ? new Date(user.joined).toLocaleDateString() : 'N/A';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user._id.substring(0, 6)}...</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="role-badge">${user.role}</span></td>
            <td><span class="status-badge ${statusClass}">${user.status}</span></td>
            <td>${dateStr}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-delete" onclick="deleteUser('${user._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderOrders(searchTerm = '') {
    const tbody = document.getElementById('orders-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const filteredOrders = orders.filter(order =>
        (order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filteredOrders.forEach(order => {
        const itemsList = order.items && order.items.length > 0
            ? order.items.map(i => i.name).join(', ')
            : 'No items';
        
        // Handle totalAmount vs total naming consistency
        const total = order.totalAmount || order.total || 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order._id.substring(0, 8)}...</td>
            <td>${order.customerName}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td><span class="status-badge status-${(order.status || 'pending').toLowerCase()}">${order.status || 'Pending'}</span></td>
            <td>${total.toFixed(2)} DHS</td>
            <td>${itemsList}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-view" onclick="viewOrderDetails('${order._id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderProducts(searchTerm = '') {
    const tbody = document.getElementById('products-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const filteredProducts = products.filter(product =>
        (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filteredProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product._id.substring(0, 6)}...</td>
            <td><img src="${product.imageUrl}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;" onerror="this.src='https://placehold.co/50x50/F0F0F0/0A0A0A?text=No+Image'"></td>
            <td>${product.name}</td>
            <td>${(product.category || '').replace('-', ' ')}</td>
            <td>${product.price.toFixed(2)} DHS</td>
            <td><span class="stock-badge stock-${product.stock ? 'in' : 'out'}">${product.stock ? 'In Stock' : 'Out of Stock'}</span></td>
            <td>${product.rating} ⭐</td>
            <td>
                <div class="action-btns">
                    <button class="btn-delete" onclick="deleteProduct('${product._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ========================================
// 5. UI INTERACTION (Modals, Tabs, Search)
// ========================================

window.openUserModal = function() {
    alert("To add users, use the Signup page.");
}

window.openOrderModal = function() {
    alert("Orders are created by customers via checkout.");
}

window.viewOrderDetails = function(orderId) {
    const order = orders.find(o => o._id === orderId);
    if (order) {
        const total = order.totalAmount || order.total || 0;
        const details = `
Order ID: ${order._id}
Customer: ${order.customerName}
Email: ${order.customerEmail || 'N/A'}
Total: ${total} DHS
Status: ${order.status}
Date: ${new Date(order.date).toLocaleString()}

Items:
${order.items.map(item => `- ${item.name} (Qty: ${item.qty})`).join('\n')}
        `;
        alert(details);
    }
}

window.openProductModal = function() {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');

    title.textContent = 'Add New Product';
    form.reset();
    document.getElementById('product-id').value = '';
    modal.classList.add('active');
}

window.closeProductModal = function() {
    document.getElementById('product-modal').classList.remove('active');
}

window.closeUserModal = function() {
    document.getElementById('user-modal').classList.remove('active');
}

window.closeOrderModal = function() {
    document.getElementById('order-modal').classList.remove('active');
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            if (targetTab === 'stats') {
                updateStatistics();
            }
        });
    });
}

function initSearch() {
    const userSearch = document.getElementById('user-search');
    const orderSearch = document.getElementById('order-search');
    const productSearch = document.getElementById('product-search');

    if(userSearch) userSearch.addEventListener('input', (e) => renderUsers(e.target.value));
    if(orderSearch) orderSearch.addEventListener('input', (e) => renderOrders(e.target.value));
    if(productSearch) productSearch.addEventListener('input', (e) => renderProducts(e.target.value));
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 5rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// 6. INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log(' Admin Panel Initializing...');
    
    // Attach functions to window so HTML can access them (needed for onclick="")
    window.deleteUser = deleteUser;
    window.deleteProduct = deleteProduct;
    window.saveProduct = saveProduct;

    // Event Listeners for Forms
    const productForm = document.getElementById('product-form');
    if(productForm) productForm.addEventListener('submit', saveProduct);

    // Close Modals on Outside Click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    initTabs();
    initSearch();
    
    // Start data fetch
    fetchAllData();
});

// Dynamic Styles for Admin
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    .status-active { background-color: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 20px; font-weight: bold; font-size: 0.8em; }
    .status-inactive { background-color: #f3f4f6; color: #4b5563; padding: 4px 10px; border-radius: 20px; font-weight: bold; font-size: 0.8em; }
    .role-badge { background-color: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 20px; font-weight: bold; font-size: 0.8em; }
    .stock-in { background-color: #dcfce7; color: #166534; }
    .stock-out { background-color: #fee2e2; color: #991b1b; }
`;
document.head.appendChild(adminStyles);