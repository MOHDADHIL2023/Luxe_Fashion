// ==========================================
// SHOPPING CART MANAGEMENT SYSTEM
// ==========================================

const API_URL = 'http://localhost:5001';

// ==========================================
// CART UTILITY FUNCTIONS
// ==========================================

function getCart() {
    const cart = localStorage.getItem('luxe_cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartButton = document.querySelector('.Cart-Button');
    if (cartButton) {
        let badge = cartButton.querySelector('.cart-badge');
        if (!badge && totalItems > 0) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            cartButton.appendChild(badge);
        }
        if (badge) {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    }
}

// ==========================================
// RENDER CART
// ==========================================

function renderCart() {
    const cart = getCart();
    const emptyCartArea = document.getElementById('empty-cart-area');
    const fullCartView = document.getElementById('full-cart-view');

    if (cart.length === 0) {
        // Show empty cart message
        if (emptyCartArea) emptyCartArea.classList.remove('hidden');
        if (fullCartView) fullCartView.classList.add('hidden');
        return;
    }

    // Hide empty cart, show full cart
    if (emptyCartArea) emptyCartArea.classList.add('hidden');
    if (fullCartView) fullCartView.classList.remove('hidden');

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05; // 5% tax
    const shipping = subtotal > 240 ? 0 : 20; // Free shipping over 240 DHS
    const total = subtotal + tax + shipping;

    // Build cart HTML
    let cartHTML = `
        <div class="cart-layout">
            <!-- Left Section: Cart Items -->
            <div class="cart-items-section">
                <h2 class="section-heading">
                    <i class="fas fa-shopping-cart"></i> 
                    Shopping Cart (${cart.reduce((sum, item) => sum + item.quantity, 0)} items)
                </h2>
                
                <div class="cart-items-list">
    `;

    // Render each cart item
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        const imageUrl = item.imageUrl || 'https://placehold.co/150x150/F0F0F0/0A0A0A?text=' + encodeURIComponent(item.name);

        cartHTML += `
            <div class="cart-item-card" data-index="${index}">
                <div class="item-image">
                    <img src="${imageUrl}" alt="${item.name}" onerror="this.src='https://placehold.co/150x150/F0F0F0/0A0A0A?text=Product'">
                </div>
                
                <div class="item-info">
                    <h3 class="item-name">${item.name}</h3>
                    <p class="item-category">${(item.category || 'Fashion').replace('-', ' ').toUpperCase()}</p>
                    <p class="item-price">${item.price.toFixed(2)} DHS</p>
                </div>

                <div class="item-quantity-controls">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)" title="Decrease">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)" title="Increase">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>

                <div class="item-total-price">
                    <strong>${itemTotal.toFixed(2)} DHS</strong>
                </div>

                <button class="item-remove-btn" onclick="removeItem(${index})" title="Remove item">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    });

    cartHTML += `
                </div>
            </div>

            <!-- Right Section: Order Summary -->
            <div class="order-summary-section">
                <h2 class="section-heading">
                    <i class="fas fa-receipt"></i> Order Summary
                </h2>
                
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
                    
                    ${subtotal > 0 && subtotal < 240 ? `
                        <div class="shipping-notice">
                            <i class="fas fa-info-circle"></i>
                            Add ${(240 - subtotal).toFixed(2)} DHS more for free shipping!
                        </div>
                    ` : ''}
                    
                    <div class="summary-divider"></div>
                    
                    <div class="summary-row summary-total">
                        <span>Total:</span>
                        <span class="total-amount">${total.toFixed(2)} DHS</span>
                    </div>
                </div>

                <button class="checkout-button" onclick="handleCheckout()">
                    <i class="fas fa-lock"></i> Proceed to Checkout
                </button>

                <a href="/Frontend/pages/products.html" class="continue-shopping-link">
                    <i class="fas fa-arrow-left"></i> Continue Shopping
                </a>

                <div class="secure-checkout-info">
                    <i class="fas fa-shield-alt"></i>
                    <span>Secure Checkout - Your information is protected</span>
                </div>
            </div>
        </div>
    `;

    fullCartView.innerHTML = cartHTML;
}

// ==========================================
// UPDATE QUANTITY
// ==========================================

window.updateQuantity = function(index, change) {
    const cart = getCart();
    
    if (cart[index]) {
        cart[index].quantity += change;
        
        if (cart[index].quantity <= 0) {
            if (confirm('Remove this item from cart?')) {
                cart.splice(index, 1);
            } else {
                cart[index].quantity = 1; // Keep at least 1
            }
        }
        
        saveCart(cart);
        renderCart();
    }
}

// ==========================================
// REMOVE ITEM
// ==========================================

window.removeItem = function(index) {
    if (confirm('Are you sure you want to remove this item from your cart?')) {
        const cart = getCart();
        const removedItem = cart[index];
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
        displayMessageBox(` ${removedItem.name} removed from cart`);
    }
}

// ==========================================
// CHECKOUT HANDLER
// ==========================================

window.handleCheckout = async function() {
    const cart = getCart();
    
    if (cart.length === 0) {
        displayMessageBox(' Your cart is empty!');
        return;
    }

    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('luxe_current_user'));
    
    if (!user) {
        if (confirm('⚠️ Please login to complete your order. Redirect to login page?')) {
            window.location.href = '/Frontend/pages/login.html';
        }
        return;
    }

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05;
    const shipping = subtotal > 240 ? 0 : 20;
    const totalAmount = subtotal + tax + shipping;

    // Prepare order data for backend
    const orderData = {
        customerName: user.name,
        customerEmail: user.email,
        totalAmount: totalAmount,
        status: 'processing',
        date: new Date().toISOString(),
        items: cart.map(item => ({
            productId: item.id || item._id,
            name: item.name,
            qty: item.quantity,
            price: item.price
        }))
    };

    // Show loading state
    const checkoutButton = document.querySelector('.checkout-button');
    if (checkoutButton) {
        const originalText = checkoutButton.innerHTML;
        checkoutButton.disabled = true;
        checkoutButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Order...';

        try {

            // === GET THE TOKEN ===
            const token = localStorage.getItem('luxe_token');
            
            if (!token) {
                throw new Error("Authentication token missing. Please log in again.");
            }

            // Send order to backend
            const response = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // === ADD THIS LINE ===
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const savedOrder = await response.json();
                console.log(' Order saved to backend:', savedOrder);

                // Also save to localStorage for quick access
                const localOrders = JSON.parse(localStorage.getItem('luxe_orders') || '[]');
                localOrders.push({
                    id: savedOrder._id,
                    _id: savedOrder._id,
                    ...orderData
                });
                localStorage.setItem('luxe_orders', JSON.stringify(localOrders));

                // Clear cart
                localStorage.removeItem('luxe_cart');
                updateCartBadge();

                // Show success message
                displayMessageBox(
                    ` Order placed successfully!<br><br>` +
                    `<strong>Order ID:</strong> ${savedOrder._id.substring(0, 8)}...<br>` +
                    `<strong>Total:</strong> ${totalAmount.toFixed(2)} DHS<br><br>` +
                    `Redirecting to your orders...`
                );

                // Redirect to orders page
                setTimeout(() => {
                    window.location.href = '/Frontend/pages/orders.html';
                }, 2500);

            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to place order');
            }

        } catch (error) {
            console.error('Checkout error:', error);
            displayMessageBox(' Failed to place order. Please try again or contact support.');
            
            // Re-enable button
            checkoutButton.disabled = false;
            checkoutButton.innerHTML = originalText;
        }
    }
}

// ==========================================
// MESSAGE BOX
// ==========================================

window.displayMessageBox = function(message) {
    const existingBox = document.getElementById('message-box');
    if (existingBox) existingBox.remove();

    const messageBox = document.createElement('div');
    messageBox.id = 'message-box';
    messageBox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s;
    `;
    
    messageBox.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 8px; 
                    max-width: 450px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <p style="font-weight: 600; margin-bottom: 1.5rem; color: #333; font-size: 1.1rem; line-height: 1.6;">
                ${message}
            </p>
            <button onclick="document.getElementById('message-box').remove()" 
                style="background: #10b981; color: white; border: none; 
                       padding: 0.75rem 2rem; border-radius: 5px; cursor: pointer; 
                       font-weight: bold; font-size: 1rem; transition: background 0.3s;"
                onmouseover="this.style.background='#0d9668'"
                onmouseout="this.style.background='#10b981'">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(messageBox);

    // Close on background click
    messageBox.addEventListener('click', (e) => {
        if (e.target === messageBox) {
            messageBox.remove();
        }
    });
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🛒 Cart Page Loaded');
    renderCart();
    updateCartBadge();
});

// ==========================================
// DYNAMIC CSS STYLES
// ==========================================

const cartStyles = document.createElement('style');
cartStyles.textContent = `
    /* Hide utility class */
    .hidden { display: none !important; }

    /* Cart Badge */
    .cart-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background-color: #10b981;
        color: white;
        font-size: 0.7rem;
        font-weight: bold;
        padding: 2px 5px;
        border-radius: 50%;
        min-width: 15px;
        text-align: center;
    }

    /* Empty Cart Section */
    .empty-cart-section {
        text-align: center;
        padding: 5rem 2rem;
    }

    .empty-cart-section i {
        font-size: 5rem;
        color: #d1d5db;
        margin-bottom: 1.5rem;
    }

    .empty-cart-section h2 {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 1rem;
        color: #1f2937;
    }

    .empty-cart-section p {
        font-size: 1.1rem;
        color: #6b7280;
        margin-bottom: 2rem;
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
    }

    .shop-now-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background-color: #10b981;
        color: white;
        padding: 0.75rem 2rem;
        border-radius: 0.5rem;
        text-decoration: none;
        font-weight: 700;
        transition: background-color 0.3s;
    }

    .shop-now-btn:hover {
        background-color: #0d9668;
    }

    /* Cart Layout */
    .cart-layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2rem;
        max-width: 1280px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    @media (min-width: 1024px) {
        .cart-layout {
            grid-template-columns: 2fr 1fr;
        }
    }

    /* Section Heading */
    .section-heading {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1.5rem;
        color: #1f2937;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    /* Cart Items Section */
    .cart-items-section {
        background: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .cart-items-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    /* Cart Item Card */
    .cart-item-card {
        display: grid;
        grid-template-columns: 100px 1fr auto auto auto;
        gap: 1rem;
        align-items: center;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }

    @media (max-width: 768px) {
        .cart-item-card {
            grid-template-columns: 80px 1fr;
            gap: 0.75rem;
        }
        
        .item-quantity-controls,
        .item-total-price {
            grid-column: 2 / 3;
        }
        
        .item-remove-btn {
            grid-column: 2 / 3;
            justify-self: end;
        }
    }

    .item-image img {
        width: 100%;
        height: 100px;
        object-fit: cover;
        border-radius: 0.375rem;
    }

    .item-info h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
    }

    .item-category {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 0.5rem;
    }

    .item-price {
        font-size: 1rem;
        font-weight: 600;
        color: #10b981;
    }

    /* Quantity Controls */
    .item-quantity-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: white;
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        border: 1px solid #d1d5db;
    }

    .qty-btn {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        transition: color 0.2s;
    }

    .qty-btn:hover {
        color: #10b981;
    }

    .qty-value {
        font-weight: 600;
        min-width: 30px;
        text-align: center;
        color: #1f2937;
    }

    .item-total-price {
        font-size: 1.125rem;
        font-weight: 700;
        color: #1f2937;
    }

    .item-remove-btn {
        background: #fef2f2;
        color: #dc2626;
        border: none;
        padding: 0.5rem;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .item-remove-btn:hover {
        background: #fee2e2;
    }

    /* Order Summary Section */
    .order-summary-section {
        background: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        height: fit-content;
        position: sticky;
        top: 5rem;
    }

    .summary-details {
        margin-bottom: 1.5rem;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        font-size: 1rem;
        color: #4b5563;
    }

    .summary-divider {
        height: 1px;
        background-color: #e5e7eb;
        margin: 1rem 0;
    }

    .summary-total {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1f2937;
    }

    .total-amount {
        color: #10b981;
    }

    .shipping-notice {
        background: #fef3c7;
        color: #92400e;
        padding: 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        margin: 1rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .checkout-button {
        width: 100%;
        background-color: #10b981;
        color: white;
        padding: 1rem;
        border: none;
        border-radius: 0.5rem;
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .checkout-button:hover:not(:disabled) {
        background-color: #0d9668;
    }

    .checkout-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .continue-shopping-link {
        display: block;
        text-align: center;
        margin-top: 1rem;
        color: #6b7280;
        text-decoration: none;
        font-weight: 600;
        transition: color 0.2s;
    }

    .continue-shopping-link:hover {
        color: #10b981;
    }

    .secure-checkout-info {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
        font-size: 0.875rem;
        color: #6b7280;
    }

    /* Animations */
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .fa-spinner {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(cartStyles);