// Frontend/js/script.js

// Use config variable or fallback
const BASE_API = typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:5001';

document.addEventListener('DOMContentLoaded', () => {
    // 1. MOBILE MENU
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

    // 2. SMOOTH SCROLLING
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 3. CART BADGE
    updateCartCount();

    // 4. USER AUTH STATUS
    const user = JSON.parse(localStorage.getItem('luxe_current_user'));
    const authButton = document.querySelector('.Login-Signup-Button'); 

    if (user && authButton) {
        authButton.innerHTML = `<i class="fa fa-user"></i> Hi, ${user.name.split(' ')[0]}`;
        authButton.classList.add('user-logged-in');
        
        authButton.onclick = (e) => {
            e.preventDefault(); 
            if (confirm(`Log out ${user.name}?`)) {
                localStorage.removeItem('luxe_current_user');
                localStorage.removeItem('luxe_token');
                alert("Logged out successfully!");
                setTimeout(() => window.location.href = '/Frontend/index.html', 500);
            }
        };
    }
});

// === GLOBAL CART FUNCTIONS ===

// Get Cart
function getCart() {
    const cart = localStorage.getItem('luxe_cart');
    return cart ? JSON.parse(cart) : [];
}

// Save Cart
function saveCart(cart) {
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
    updateCartCount();
}

// Update Badge
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.querySelector('.cart-badge') || createBadge();
    
    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

function createBadge() {
    const btn = document.querySelector('.Cart-Button');
    if (!btn) return null;
    const span = document.createElement('span');
    span.className = 'cart-badge';
    btn.appendChild(span);
    return span;
}

// Add to Cart (Used by Product Page)
window.addToCartBtn = function(product = null) {
    if (product) {
        const cart = getCart();
        // Normalize ID: Backend uses _id, frontend might need id
        const productId = product._id || product.id; 
        
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId, // Standardize to 'id' for cart usage
                _id: productId, // Keep original just in case
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                category: product.category,
                quantity: 1
            });
        }
        
        saveCart(cart);
        
        // Visual Feedback
        if(typeof displayMessageBox === 'function') {
            displayMessageBox(`${product.name} added to cart!`);
        } else {
            alert(`${product.name} added to cart!`);
        }
    } else {
        // Navigation Logic
        const path = window.location.pathname;
        const isPages = path.includes('/pages/');
        window.location.href = isPages ? 'cart.html' : '/Frontend/pages/cart.html';
    }
}

// Nav Helpers
window.handleSearchClick = () => {
    const isPages = window.location.pathname.includes('/pages/');
    window.location.href = isPages ? 'products.html' : '/Frontend/pages/products.html';
}
window.handleLoginSignup = () => {
    const isPages = window.location.pathname.includes('/pages/');
    window.location.href = isPages ? 'login.html' : '/Frontend/pages/login.html';
}

// Message Box
window.displayMessageBox = function(message) {
    const oldBox = document.getElementById('message-box');
    if (oldBox) oldBox.remove();

    const box = document.createElement('div');
    box.id = 'message-box';
    box.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #333; color: white; padding: 1rem 2rem; border-radius: 5px;
        z-index: 9999; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        animation: fadeIn 0.3s;
    `;
    box.textContent = message;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
}

// Styles
const style = document.createElement('style');
style.textContent = `
    .cart-badge { position: absolute; top: -5px; right: -5px; background: #10b981; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 50%; }
    .Login-Signup-Button { position: relative; }
    .user-logged-in { background-color: #10b981 !important; color: white !important; }
    @keyframes fadeIn { from { opacity:0; transform:translate(-50%, -10px); } to { opacity:1; transform:translate(-50%, 0); } }
`;
document.head.appendChild(style);