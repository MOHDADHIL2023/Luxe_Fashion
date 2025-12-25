// Frontend/js/script-admin.js

const BASE_URL = typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:5001';

// Data Store
let users = [];
let orders = [];
let products = [];

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        initTabs();
        initSearch();
        fetchAllData();
    }
});

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('luxe_current_user'));
    const token = localStorage.getItem('luxe_token');

    if (!user || !token || user.role !== 'admin') {
        alert("Access Denied: Admins only.");
        window.location.href = '/Frontend/pages/login.html';
        return false;
    }
    return true;
}

function getAuthHeaders() {
    const token = localStorage.getItem('luxe_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function fetchAllData() {
    try {
        const headers = getAuthHeaders();

        // 1. Fetch Users
        const usersRes = await fetch(`${BASE_URL}/users`, { headers });
        if (usersRes.ok) {
            const data = await usersRes.json();
            users = data.users || data; 
            renderUsers();
            document.getElementById('total-users').textContent = users.length;
        }

        // 2. Fetch Products
        const productsRes = await fetch(`${BASE_URL}/api/products`);
        if (productsRes.ok) {
            products = await productsRes.json();
            renderProducts();
            document.getElementById('total-products').textContent = products.length;
        }

        // 3. Fetch Orders
        const ordersRes = await fetch(`${BASE_URL}/api/orders`, { headers });
        if (ordersRes.ok) {
            orders = await ordersRes.json();
            renderOrders();
            document.getElementById('total-orders').textContent = orders.length;
            
            const revenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            document.getElementById('total-revenue').textContent = revenue.toFixed(2) + ' DHS';
        }

    } catch (error) {
        console.error("Error loading admin data:", error);
    }
}

// ========================================
// RENDERERS
// ========================================

function renderUsers(term = '') {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = users.filter(u => 
        u.name.toLowerCase().includes(term.toLowerCase()) || 
        u.email.toLowerCase().includes(term.toLowerCase())
    );

    filtered.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user._id.substring(0, 6)}...</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="role-badge">${user.role}</span></td>
            <td>${user.status}</td>
            <td>
                <button class="btn-delete" onclick="deleteUser('${user._id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderOrders(term = '') {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = orders.filter(o => 
        (o._id && o._id.includes(term)) || 
        (o.customerName && o.customerName.toLowerCase().includes(term.toLowerCase()))
    );

    filtered.forEach(order => {
        const total = order.totalAmount || 0;
        const tr = document.createElement('tr');
        
        // Changed Button to call viewOrderDetails
        tr.innerHTML = `
            <td>${order._id.substring(0, 8)}...</td>
            <td>${order.customerName}</td>
            <td>${new Date(order.createdAt || order.date).toLocaleDateString()}</td>
            <td>${order.status}</td>
            <td>${total.toFixed(2)}</td>
            <td>${order.items.length} Items</td>
            <td>
                <button class="btn-view" onclick="viewOrderDetails('${order._id}')">View</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderProducts(term = '') {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = products.filter(p => p.name.toLowerCase().includes(term.toLowerCase()));

    filtered.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product._id.substring(0, 6)}...</td>
            <td><img src="${product.imageUrl}" style="width:40px;height:40px;object-fit:cover"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.price}</td>
            <td>${product.stock ? 'In Stock' : 'Out'}</td>
            <td>
                <button class="btn-delete" onclick="deleteProduct('${product._id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ========================================
// ORDER DETAILS MODAL LOGIC
// ========================================

// 1. Create Modal HTML dynamically if it doesn't exist
function ensureOrderModalExists() {
    if (!document.getElementById('order-details-modal')) {
        const modalHTML = `
            <div id="order-details-modal" class="modal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2 id="order-modal-title">Order Details</h2>
                        <button class="close-btn" onclick="closeOrderDetailsModal()">&times;</button>
                    </div>
                    <div id="order-details-body" style="padding: 10px 0;">
                        <!-- Content injected here -->
                    </div>
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="closeOrderDetailsModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// 2. Open Modal with Data
window.viewOrderDetails = function(orderId) {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    ensureOrderModalExists();

    const dateStr = new Date(order.createdAt || order.date).toLocaleString();
    const address = order.shippingAddress 
        ? `${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.country || ''}`
        : 'N/A';

    // Build Items List HTML
    let itemsHtml = order.items.map(item => `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 8px 0;">
            <div>
                <strong>${item.name}</strong> <br>
                <span style="color: #666; font-size: 0.9em;">Qty: ${item.qty}</span>
            </div>
            <div>
                ${(item.price * item.qty).toFixed(2)} DHS
            </div>
        </div>
    `).join('');

    const contentHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div>
                <h4 style="margin: 0 0 5px; color: #555;">Customer Info</h4>
                <p style="margin: 0; font-weight: bold;">${order.customerName}</p>
                <p style="margin: 0; font-size: 0.9em; color: #666;">${order.customerEmail}</p>
            </div>
            <div>
                <h4 style="margin: 0 0 5px; color: #555;">Order Info</h4>
                <p style="margin: 0; font-size: 0.9em;">ID: #${order._id.substring(0, 8)}</p>
                <p style="margin: 0; font-size: 0.9em;">Date: ${dateStr}</p>
                <p style="margin: 5px 0 0;"><span class="status-badge status-${(order.status || 'pending').toLowerCase()}">${order.status}</span></p>
            </div>
        </div>

        <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 5px; color: #555;">Shipping Address</h4>
            <p style="margin: 0; background: #f9fafb; padding: 8px; border-radius: 4px;">${address}</p>
        </div>

        <div>
            <h4 style="margin: 0 0 10px; color: #555;">Order Items</h4>
            <div style="border: 1px solid #eee; border-radius: 4px; padding: 0 10px;">
                ${itemsHtml}
            </div>
            <div style="text-align: right; margin-top: 15px; font-size: 1.2em; font-weight: bold; color: #10b981;">
                Total: ${order.totalAmount.toFixed(2)} DHS
            </div>
        </div>
    `;

    document.getElementById('order-details-body').innerHTML = contentHtml;
    document.getElementById('order-details-modal').classList.add('active');
};

window.closeOrderDetailsModal = function() {
    const modal = document.getElementById('order-details-modal');
    if(modal) modal.classList.remove('active');
};

// ========================================
// ACTIONS
// ========================================
window.deleteUser = async (id) => {
    if(!confirm("Delete User?")) return;
    await fetch(`${BASE_URL}/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    fetchAllData();
};

window.deleteProduct = async (id) => {
    if(!confirm("Delete Product?")) return;
    await fetch(`${BASE_URL}/api/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    fetchAllData();
};

window.saveProduct = async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: Number(document.getElementById('product-price').value),
        imageUrl: document.getElementById('product-image').value,
        stock: document.getElementById('product-stock').value === 'true',
        description: "New Product"
    };

    await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    
    document.getElementById('product-modal').classList.remove('active');
    fetchAllData();
};

// ========================================
// TABS & UI
// ========================================
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        });
    });
    
    const pForm = document.getElementById('product-form');
    if(pForm) pForm.addEventListener('submit', window.saveProduct);
    
    window.openProductModal = () => document.getElementById('product-modal').classList.add('active');
    window.closeProductModal = () => document.getElementById('product-modal').classList.remove('active');
}

function initSearch() {
    document.getElementById('user-search').addEventListener('input', (e) => renderUsers(e.target.value));
    document.getElementById('order-search').addEventListener('input', (e) => renderOrders(e.target.value));
    document.getElementById('product-search').addEventListener('input', (e) => renderProducts(e.target.value));
}