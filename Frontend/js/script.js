// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. MOBILE MENU FUNCTIONALITY
    // ==========================================
    const menuButton = document.getElementById('menu-button');
    const closeMenuButton = document.getElementById('close-menu-button');
    const mobileMenu = document.getElementById('menu-mobile');
    const body = document.body;

    function toggleMobileMenu() {
        if (!mobileMenu) return; 
        const isMenuOpen = mobileMenu.classList.toggle('is-open');
        body.style.overflow = isMenuOpen ? 'hidden' : '';
        if (menuButton) menuButton.setAttribute('aria-expanded', isMenuOpen);
    }

    if (menuButton) menuButton.addEventListener('click', toggleMobileMenu);
    if (closeMenuButton) closeMenuButton.addEventListener('click', toggleMobileMenu);

    // ==========================================
    // 2. SMOOTH SCROLLING
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // ==========================================
    // 3. CART BADGE INITIALIZATION
    // ==========================================
    updateCartCount();

    // ==========================================
    // 4. USER LOGIN STATUS & HEADER UPDATE
    // ==========================================
    const user = JSON.parse(localStorage.getItem('luxe_current_user'));
    const authButton = document.querySelector('.Login-Signup-Button'); 

    if (user && authButton) {
        // Change button to show user name
        authButton.innerHTML = `<i class="fa fa-user"></i> Hi, ${user.name.split(' ')[0]}`;
        authButton.classList.add('user-logged-in');
        
        // Override click to handle logout
        authButton.onclick = (e) => {
            e.preventDefault(); 
            
            if (confirm(`Logged in as ${user.name}. Do you want to log out?`)) {
                // Call backend to update status
                fetch('http://localhost:5001/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email })
                }).catch(err => console.error("Logout error:", err));

                // Clear localStorage
                localStorage.removeItem('luxe_current_user');
                localStorage.removeItem('luxe_token');

                displayMessageBox(" Logged out successfully!");
                
                // Refresh page
                setTimeout(() => window.location.reload(), 1000);
            }
        };
    }
});

// ==========================================
// GLOBAL UTILITY FUNCTIONS
// ==========================================

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem('luxe_cart');
    return cart ? JSON.parse(cart) : [];
}

// Update cart badge count
function updateCartCount() {
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

// Add to cart function
window.addToCartBtn = function(product = null) {
    if (product) {
        // Add specific product to cart
        const cart = getCart();
        const productId = product.id || product._id;
        const existingItem = cart.find(item => (item.id === productId || item._id === productId));
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ 
                ...product, 
                quantity: 1,
                id: productId // Ensure id is set
            });
        }
        
        localStorage.setItem('luxe_cart', JSON.stringify(cart));
        displayMessageBox(` ${product.name} added to cart!`);
        updateCartCount();
    } else {
        // Navigate to cart page
        const currentPath = window.location.pathname;
        const isInPagesFolder = currentPath.includes('/pages/');
        window.location.href = isInPagesFolder ? 'cart.html' : '/Frontend/pages/cart.html';
    }
}

// Search navigation
window.handleSearchClick = function() {
    const currentPath = window.location.pathname;
    const isInPagesFolder = currentPath.includes('/pages/');
    window.location.href = isInPagesFolder ? 'products.html' : '/Frontend/pages/products.html';
}
            
// Login navigation
window.handleLoginSignup = function() {
    const currentPath = window.location.pathname;
    const isInPagesFolder = currentPath.includes('/pages/');
    window.location.href = isInPagesFolder ? 'login.html' : '/Frontend/pages/login.html';
}

// Newsletter subscription
window.handleNewsletterSubscription = function(event) {
    event.preventDefault();
    const email = document.getElementById('newsletter-email').value;
    if (email) {
        displayMessageBox(` Subscribed! Updates will be sent to ${email}`);
        document.getElementById('newsletter-email').value = '';
    }
}

// Message box display
window.displayMessageBox = function(message) {
    const existingBox = document.getElementById('message-box');
    if (existingBox) existingBox.remove();

    const messageBox = document.createElement('div');
    messageBox.id = 'message-box';
    messageBox.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background-color: #333; color: white; padding: 1rem 2rem;
        border-radius: 5px; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: sans-serif; font-weight: bold; animation: fadeIn 0.3s;
    `;
    messageBox.textContent = message;
    document.body.appendChild(messageBox);
    
    setTimeout(() => {
        if (messageBox) messageBox.remove();
    }, 3000);
}

// ==========================================
// DYNAMIC CSS INJECTION
// ==========================================
const style = document.createElement('style');
style.textContent = `
    .cart-badge {
        position: absolute; top: -5px; right: -5px;
        background-color: #10b981; color: white;
        font-size: 0.7rem; font-weight: bold;
        padding: 2px 5px; border-radius: 50%;
        min-width: 15px; text-align: center;
    }
    .Login-Signup-Button { position: relative; }
    .user-logged-in {
        background-color: #10b981 !important;
        color: white !important;
    }
    @keyframes fadeIn { 
        from { opacity:0; transform:translate(-50%, -10px); } 
        to { opacity:1; transform:translate(-50%, 0); } 
    }
`;
document.head.appendChild(style);

window.addToCartBtn = function(product = null) {
    if (product) {
        const cart = getCart();
        // Backend products have '_id', frontend seeds might have 'id'
        const productId = product._id || product.id; 
        
        const existingItem = cart.find(item => (item._id === productId || item.id === productId));
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ 
                ...product, 
                id: productId, // Standardize ID for the cart
                _id: productId,
                quantity: 1 
            });
        }
        
        localStorage.setItem('luxe_cart', JSON.stringify(cart));
        displayMessageBox(` ${product.name} added to cart!`);
        updateCartCount();
    } else {
        // Navigate to cart page logic...
        const currentPath = window.location.pathname;
        const isInPagesFolder = currentPath.includes('/pages/');
        window.location.href = isInPagesFolder ? 'cart.html' : '/Frontend/pages/cart.html';
    }
}