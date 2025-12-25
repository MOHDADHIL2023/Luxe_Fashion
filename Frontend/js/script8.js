// Frontend/js/script8.js

// Ensure API URL is defined (fallback to localhost)
const BASE_URL = typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:5001';

// ==========================================
// 1. FETCH ORDERS
// ==========================================
async function fetchOrdersFromBackend() {
    const user = JSON.parse(localStorage.getItem('luxe_current_user'));
    const token = localStorage.getItem('luxe_token');

    // If no user or token, cannot fetch private orders
    if (!user || !user.email || !token) {
        console.warn("User or Token missing in localStorage");
        return [];
    }

    try {
        // FIX: Use the specific user email endpoint to match your backend routes
        const url = `${BASE_URL}/api/orders/user/${user.email}`;
        
        console.log("Fetching orders from:", url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Handle if backend returns wrapped data { success: true, data: [...] } or just [...]
            const orders = Array.isArray(data) ? data : (data.orders || []);
            console.log(`Loaded ${orders.length} orders`);
            return orders;
        } else {
            console.error(`Failed to fetch orders. Status: ${response.status}`);
            const errText = await response.text();
            console.error("Server Response:", errText);
            return [];
        }
    } catch (error) {
        console.error("Network error while fetching orders:", error);
        return [];
    }
}

// ==========================================
// 2. RENDER ORDERS
// ==========================================
function renderOrders(orders) {
    const list = document.getElementById('order-list');
    const noOrders = document.getElementById('no-orders-message');
    const countSpan = document.getElementById('total-orders-count');
    const spentSpan = document.getElementById('total-spent');

    if(!list) return;
    list.innerHTML = '';

    // Handle Empty State
    if (!orders || orders.length === 0) {
        if(noOrders) noOrders.classList.remove('hidden');
        if(countSpan) countSpan.textContent = '0';
        if(spentSpan) spentSpan.textContent = '0.00 DHS';
        return;
    }

    if(noOrders) noOrders.classList.add('hidden');

    // Calculate Stats
    // Checks for 'totalAmount' (standard) or 'total' (legacy)
    const totalSpent = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || Number(o.total) || 0), 0);
    
    if(countSpan) countSpan.textContent = orders.length;
    if(spentSpan) spentSpan.textContent = `${totalSpent.toFixed(2)} DHS`;

    // Render Cards
    orders.forEach((order, index) => {
        const dateStr = new Date(order.createdAt || order.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        
        const total = Number(order.totalAmount || order.total || 0).toFixed(2);
        const status = order.status || 'Processing';
        const orderId = order._id || order.id || 'N/A';
        
        // Build Items List
        let itemsHtml = '';
        if (order.items && order.items.length > 0) {
            itemsHtml = order.items.map(i => `
                <div class="order-item-row" style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #eee;">
                    <span style="font-weight: 500;">${i.name}</span>
                    <span style="color: #666;">x${i.qty || i.quantity}</span>
                </div>
            `).join('');
        } else {
            itemsHtml = '<p>No items details available</p>';
        }

        const html = `
            <div class="order-card" style="animation-delay: ${index * 0.1}s; background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 1rem;">
                <div class="order-header" style="display: flex; justify-content: space-between; margin-bottom: 1rem; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.5rem;">
                    <div>
                        <div style="font-size: 0.9rem; color: #888;">ORDER ID</div>
                        <strong style="font-size: 1.1rem;">#${orderId.substring(0, 8).toUpperCase()}</strong>
                        <div class="order-date" style="font-size: 0.9rem; color: #666; margin-top: 4px;">${dateStr}</div>
                    </div>
                    <div class="text-right" style="text-align: right;">
                        <div class="order-total" style="font-size: 1.2rem; font-weight: bold; color: #10b981;">${total} DHS</div>
                        <div class="order-status status-${status.toLowerCase()}" 
                             style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; margin-top: 5px; 
                             background: ${status === 'Delivered' ? '#dcfce7' : '#fef3c7'}; 
                             color: ${status === 'Delivered' ? '#166534' : '#92400e'};">
                             ${status}
                        </div>
                    </div>
                </div>
                
                <div class="order-items-container" style="margin-bottom: 1rem;">
                    <div style="font-size: 0.9rem; font-weight: bold; margin-bottom: 0.5rem; color: #444;">ITEMS</div>
                    ${itemsHtml}
                </div>
                
                <div class="order-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="alert('Order Tracking: ${status}')" 
                            style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        Track Order
                    </button>
                </div>
            </div>
        `;
        list.innerHTML += html;
    });
}

// ==========================================
// 3. INIT ON LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const authGuard = document.getElementById('auth-guard');
    const content = document.getElementById('orders-content');

    const user = JSON.parse(localStorage.getItem('luxe_current_user'));
    
    // Auth Check
    if (!user) {
        if(authGuard) authGuard.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <i class="fas fa-lock" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <p style="font-size: 1.2rem;">Please login to view your order history.</p>
            </div>
        `;
        setTimeout(() => window.location.href = '/Frontend/pages/login.html', 1500);
        return;
    }

    // Fetch Data
    const orders = await fetchOrdersFromBackend();
    
    // Render
    renderOrders(orders);

    // Toggle Visibility
    if(authGuard) authGuard.classList.add('hidden');
    if(content) content.classList.remove('hidden');
});