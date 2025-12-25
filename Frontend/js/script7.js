// Frontend/js/script7.js

// Ensure API URL is defined
const ORDERS_URL = typeof API_URL !== 'undefined' ? `${API_URL}/api/orders` : 'http://localhost:5001/api/orders';

// ==========================================
// RENDER CART UI
// ==========================================
function renderCart() {
    const cart = JSON.parse(localStorage.getItem('luxe_cart') || '[]');
    const emptyView = document.getElementById('empty-cart-area');
    const fullView = document.getElementById('full-cart-view');

    // 1. Handle Empty State
    if (!cart || cart.length === 0) {
        if (emptyView) emptyView.classList.remove('hidden');
        if (fullView) fullView.classList.add('hidden');
        return;
    }

    // 2. Handle Full State
    if (emptyView) emptyView.classList.add('hidden');
    if (fullView) fullView.classList.remove('hidden');

    // 3. Calculate Totals (Force numbers)
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const tax = subtotal * 0.05; // 5% VAT
    const shipping = subtotal > 240 ? 0 : 20; // Free shipping logic
    const total = subtotal + tax + shipping;

    // 4. Generate HTML
    let html = `
        <div class="cart-layout">
            
            <!-- Left Column: Items List -->
            <div class="cart-items-section">
                <h2 class="section-heading">
                    <i class="fas fa-shopping-bag"></i> Shopping Cart (${cart.length} items)
                </h2>
                <div class="cart-items-list">
    `;

    cart.forEach((item, index) => {
        // Fallback for image and name
        const imgSrc = item.imageUrl || 'https://placehold.co/100x100?text=No+Image';
        const itemName = item.name || 'Unknown Item';
        const itemPrice = Number(item.price).toFixed(2);
        const itemTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);

        html += `
            <div class="cart-item-card">
                <div class="item-image">
                    <img src="${imgSrc}" alt="${itemName}" onerror="this.src='https://placehold.co/100x100?text=Error'">
                </div>
                
                <div class="item-info">
                    <h3>${itemName}</h3>
                    <p class="item-category">${(item.category || 'Product').toUpperCase()}</p>
                    <p class="item-price">${itemPrice} DHS</p>
                </div>

                <div class="item-quantity-controls">
                    <button type="button" onclick="updateQuantity(${index}, -1)" title="Decrease">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty-value">${item.quantity}</span>
                    <button type="button" onclick="updateQuantity(${index}, 1)" title="Increase">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>

                <div class="item-total-price">
                    ${itemTotal} DHS
                </div>

                <button class="item-remove-btn" onclick="removeItem(${index})" title="Remove Item">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    });

    html += `
                </div> <!-- End List -->
            </div> <!-- End Items Section -->

            <!-- Right Column: Order Summary -->
            <div class="order-summary-section">
                <h2 class="section-heading"><i class="fas fa-receipt"></i> Order Summary</h2>
                <div class="summary-details">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)} DHS</span>
                    </div>
                    <div class="summary-row">
                        <span>Tax (5%):</span>
                        <span>${tax.toFixed(2)} DHS</span>
                    </div>
                    <div class="summary-row">
                        <span>Shipping:</span>
                        <span>${shipping === 0 ? 'FREE' : shipping.toFixed(2) + ' DHS'}</span>
                    </div>
                    
                    ${subtotal < 240 ? `
                    <div class="shipping-notice">
                        <i class="fas fa-info-circle"></i> Add ${(240 - subtotal).toFixed(2)} DHS for FREE Shipping!
                    </div>` : ''}

                    <div class="summary-divider"></div>
                    
                    <div class="summary-row summary-total">
                        <span>Total:</span>
                        <span>${total.toFixed(2)} DHS</span>
                    </div>
                </div>
                
                <button class="checkout-button" onclick="handleCheckout()">
                    <i class="fas fa-lock"></i> Secure Checkout
                </button>

                <div class="secure-checkout-info">
                    <i class="fas fa-shield-alt"></i> Secure SSL Encryption
                </div>
            </div>

        </div> <!-- End Cart Layout -->
    `;

    fullView.innerHTML = html;
}

// ==========================================
// CART ACTIONS (Update/Remove)
// ==========================================

window.updateQuantity = function(index, change) {
    const cart = JSON.parse(localStorage.getItem('luxe_cart') || '[]');
    if (cart[index]) {
        cart[index].quantity = Number(cart[index].quantity) + change;
        
        // Prevent quantity < 1
        if (cart[index].quantity < 1) {
            cart[index].quantity = 1; 
        }
        
        localStorage.setItem('luxe_cart', JSON.stringify(cart));
        renderCart();
        updateGlobalBadge();
    }
}

window.removeItem = function(index) {
    if (!confirm("Are you sure you want to remove this item?")) return;
    
    const cart = JSON.parse(localStorage.getItem('luxe_cart') || '[]');
    cart.splice(index, 1);
    
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
    renderCart();
    updateGlobalBadge();
}

function updateGlobalBadge() {
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
}

// ==========================================
// CHECKOUT LOGIC
// ==========================================

window.handleCheckout = async function() {
    const cart = JSON.parse(localStorage.getItem('luxe_cart') || '[]');
    
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    // 1. Authentication Check
    const user = JSON.parse(localStorage.getItem('luxe_current_user'));
    const token = localStorage.getItem('luxe_token');

    if (!user || !token) {
        if (confirm("You need to login to checkout. Go to login page?")) {
            window.location.href = '/Frontend/pages/login.html';
        }
        return;
    }

    // 2. Button Loading State
    const btn = document.querySelector('.checkout-button');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }

    try {
        // 3. Prepare Data
        const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
        const tax = subtotal * 0.05;
        const shipping = subtotal > 240 ? 0 : 20;
        const totalAmount = subtotal + tax + shipping;

        // 4. Validate and Format Items
        const validItems = cart.map(item => {
            const pId = item.id || item._id; // Handle both ID formats
            
            if (!pId) {
                console.error("Missing ID for item:", item);
                return null;
            }

            return {
                productId: pId,
                name: item.name || 'Unknown',
                qty: Number(item.quantity) || 1,
                price: Number(item.price) || 0
            };
        }).filter(item => item !== null); // Remove nulls

        if (validItems.length === 0) {
            throw new Error("Cart contains invalid items. Please clear cart and try again.");
        }

        const orderData = {
            customerName: user.name,
            customerEmail: user.email,
            totalAmount: Number(totalAmount.toFixed(2)),
            status: 'processing',
            items: validItems,
            shippingAddress: { 
                street: "123 Fashion St", 
                city: "Dubai", 
                country: "UAE" 
            }
        };

        console.log("Sending Order Payload:", orderData);

        // 5. Send to Backend
        const response = await fetch(ORDERS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();

        if (response.ok) {
            // Success
            localStorage.removeItem('luxe_cart');
            updateGlobalBadge();
            
            // Save to local history as backup (optional)
            const history = JSON.parse(localStorage.getItem('luxe_orders') || '[]');
            history.push(data);
            localStorage.setItem('luxe_orders', JSON.stringify(history));

            if (typeof displayMessageBox === 'function') {
                displayMessageBox('Order placed successfully! Redirecting...');
            } else {
                alert('Order placed successfully!');
            }

            setTimeout(() => {
                window.location.href = '/Frontend/pages/orders.html';
            }, 2000);

        } else {
            // Server Error
            console.error("Backend Error:", data);
            throw new Error(data.error || data.message || "Checkout failed");
        }

    } catch (error) {
        console.error("Checkout Error:", error);
        alert(`Checkout Failed: ${error.message}`);
        
        // Reset Button
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-lock"></i> Secure Checkout';
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});