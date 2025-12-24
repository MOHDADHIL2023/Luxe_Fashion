// ==========================================
// ORDERS PAGE MANAGEMENT
// ==========================================

const authGuard = document.getElementById('auth-guard');
let contentContainer; 
const API_URL = 'http://localhost:5001';

// ==========================================
// GET ORDERS FROM LOCALSTORAGE
// ==========================================
function getOrders() {
    const orders = localStorage.getItem('luxe_orders');
    return orders ? JSON.parse(orders) : [];
}

// ==========================================
// FETCH ORDERS FROM BACKEND (Optional)
// ==========================================
async function fetchOrdersFromBackend() {
    try {
        const user = JSON.parse(localStorage.getItem('luxe_current_user'));
        const token = localStorage.getItem('luxe_token'); // === GET TOKEN ===

        if (!user || !user.email || !token) {
            console.log('No user or token found');
            return [];
        }

        const response = await fetch(`${API_URL}/api/orders/user/${user.email}`, {
            method: 'GET', // Explicitly state method
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // === ADD THIS LINE ===
            }
        });

        if (response.ok) {
            const orders = await response.json();
            console.log(` Fetched ${orders.length} orders from backend`);
            return orders;
        } else {
            console.log('Failed to fetch orders from backend');
            return [];
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

// ==========================================
// RENDER ORDERS
// ==========================================
function renderOrders(orders) {
    const orderList = document.getElementById('order-list');
    const noOrdersMessage = document.getElementById('no-orders-message');
    const totalOrdersCount = document.getElementById('total-orders-count');
    const totalSpent = document.getElementById('total-spent');
    
    if (!orderList) return;
    
    orderList.innerHTML = '';

    if (!orders || orders.length === 0) {
        if (noOrdersMessage) noOrdersMessage.classList.remove('hidden');
        if (totalOrdersCount) totalOrdersCount.textContent = '0';
        if (totalSpent) totalSpent.textContent = '0 DHS';
        return;
    }
    
    if (noOrdersMessage) noOrdersMessage.classList.add('hidden');

    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate stats
    const totalAmount = orders.reduce((sum, order) => {
        const orderTotal = order.total || order.totalAmount || 0;
        return sum + orderTotal;
    }, 0);
    
    if (totalOrdersCount) totalOrdersCount.textContent = orders.length;
    if (totalSpent) totalSpent.textContent = totalAmount.toFixed(2) + ' DHS';

    orders.forEach((order, index) => {
        const orderItems = order.items || [];
        const itemDetails = orderItems.map(item => 
            `<div class="order-item">
                <span>${item.name}</span>
                <span>Qty: ${item.qty || item.quantity || 1} × ${(item.price || 0).toFixed(2)} DHS</span>
            </div>`
        ).join('');

        const cardDelay = (index * 0.1) + 0.1;
        const orderTotal = order.total || order.totalAmount || 0;
        const orderId = order.id || order._id || `ORD-${Date.now()}`;
        const orderStatus = order.status || 'Processing';
        const statusClass = orderStatus.toLowerCase().replace(' ', '-');

        const orderHtml = `
            <div class="order-card" style="animation-delay: ${cardDelay}s;">
                <div class="order-header">
                    <div>
                        <div class="order-id">ORDER ID: <strong>${orderId}</strong></div>
                        <div class="order-date">${formatDate(order.date)}</div>
                    </div>
                    <div class="text-right">
                        <div class="order-total">${orderTotal.toFixed(2)} DHS</div>
                        <div class="order-status ${statusClass}">${orderStatus}</div>
                    </div>
                </div>
                <div class="order-item-list">${itemDetails || '<p>No items</p>'}</div>
                <div class="order-actions">
                    <button class="btn-track btn-secondary" onclick="trackOrder('${orderId}')">
                        <i class="fas fa-map-marker-alt"></i> Track Order
                    </button>
                    <button class="btn-reorder" onclick="reorder('${orderId}')">
                        <i class="fas fa-redo"></i> Reorder
                    </button>
                </div>
            </div>
        `;
        orderList.innerHTML += orderHtml;
    });
}

// ==========================================
// FORMAT DATE
// ==========================================
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ==========================================
// LOAD CONTENT
// ==========================================
async function loadContent() {
    contentContainer = document.getElementById('orders-content');
    
    // Try to get orders from localStorage first
    let orders = getOrders();
    
    // If no orders in localStorage, try backend
    if (orders.length === 0) {
        orders = await fetchOrdersFromBackend();
    }
    
    renderOrders(orders); 
    
    // Hide loading guard and show content
    if (authGuard) authGuard.classList.add('hidden');
    if (contentContainer) contentContainer.classList.remove('hidden');
}

// ==========================================
// INITIALIZE ON PAGE LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('luxe_current_user'));
    
    if (!user) {
        // Redirect to login if not logged in
        if (authGuard) {
            const authMessage = authGuard.querySelector('p');
            if (authMessage) authMessage.textContent = 'Please login to view your orders';
        }
        
        setTimeout(() => {
            const currentPath = window.location.pathname;
            const isInPagesFolder = currentPath.includes('/pages/');
            window.location.href = isInPagesFolder ? 'login.html' : '/Frontend/pages/login.html';
        }, 2000);
        
        return;
    }
    
    // Load orders
    setTimeout(() => {
        loadContent();
    }, 500);
});

// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

// Message box
window.displayMessageBox = function(message) {
    const existingBox = document.getElementById('message-box');
    if (existingBox) existingBox.remove();
    
    const messageBox = document.createElement('div');
    messageBox.id = 'message-box';
    messageBox.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex; align-items: center; justify-content: center;
        z-index: 9999;
    `;
    
    messageBox.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px; text-align: center;">
            <p style="font-weight: 600; margin-bottom: 1rem; color: #333;">${message}</p>
            <button onclick="document.getElementById('message-box').remove()" 
                style="background: #10b981; color: white; border: none; padding: 0.75rem 2rem; 
                border-radius: 5px; cursor: pointer; font-weight: bold;">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(messageBox);
}

// Track order
window.trackOrder = function(orderId) {
    displayMessageBox(` Tracking order ${orderId}. Your order is being processed and will be shipped soon.`);
}

// Reorder function
window.reorder = function(orderId) {
    const orders = getOrders();
    const order = orders.find(o => (o.id === orderId || o._id === orderId));
    
    if (!order) {
        displayMessageBox(' Order not found');
        return;
    }
    
    // Add all items from this order back to cart
    const cart = JSON.parse(localStorage.getItem('luxe_cart') || '[]');
    
    if (!order.items || order.items.length === 0) {
        displayMessageBox(' No items in this order');
        return;
    }
    
    order.items.forEach(item => {
        const itemName = item.name;
        const itemQty = item.qty || item.quantity || 1;
        const itemPrice = item.price || 0;
        
        // Find if item already exists in cart
        const existingItem = cart.find(c => c.name === itemName);
        
        if (existingItem) {
            existingItem.quantity += itemQty;
        } else {
            // Create a basic cart item
            cart.push({
                id: Date.now() + Math.random(),
                name: itemName,
                price: itemPrice,
                quantity: itemQty,
                category: 'reorder',
                imageUrl: 'https://placehold.co/400x400/F0F0F0/0A0A0A?text=' + encodeURIComponent(itemName)
            });
        }
    });
    
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
    displayMessageBox(` Items from order ${orderId} added to cart! Redirecting...`);
    
    setTimeout(() => {
        navigateTo('cart.html');
    }, 1500);
}

// Navigation utility
window.navigateTo = function(filename) {
    const currentPath = window.location.pathname;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    window.location.href = basePath + filename;
}

// ==========================================
// DYNAMIC CSS
// ==========================================
const orderStyles = document.createElement('style');
orderStyles.textContent = `
    .order-card {
        animation: slideUp 0.5s ease forwards;
        opacity: 0;
    }
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .order-status {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: bold;
        text-transform: uppercase;
    }
    .order-status.processing {
        background-color: #fef3c7;
        color: #92400e;
    }
    .order-status.shipped {
        background-color: #dbeafe;
        color: #1e40af;
    }
    .order-status.delivered {
        background-color: #dcfce7;
        color: #166534;
    }
    .order-status.cancelled {
        background-color: #fee2e2;
        color: #991b1b;
    }
`;
document.head.appendChild(orderStyles);