// ========================================
// PRODUCT DATA MANAGEMENT (Backend Connected)
// ========================================
let productData = [];
let activeCategory = 'all';
let viewMode = 'grid';

const API_URL = 'http://localhost:5001';

// ========================================
// FETCH PRODUCTS FROM BACKEND
// ========================================
async function fetchProducts() {
    try {
        showLoading(true);
        const response = await fetch(`${API_URL}/api/products`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        productData = await response.json();
        console.log(` Loaded ${productData.length} products from backend`);
        
        showLoading(false);
        applyFiltersAndSort();
        
    } catch (error) {
        console.error('Error fetching products:', error);
        showLoading(false);
        displayMessageBox(' Could not load products. Please check if backend is running on http://localhost:5001');
    }
}

// ========================================
// LOADING STATE
// ========================================
function showLoading(show) {
    const loadingState = document.getElementById('loading-state');
    const productGrid = document.getElementById('product-grid');
    
    if (loadingState) {
        loadingState.classList.toggle('hidden', !show);
    }
    if (productGrid) {
        productGrid.classList.toggle('hidden', show);
    }
}

// ========================================
// CART MANAGEMENT
// ========================================
function getCart() {
    const cart = localStorage.getItem('luxe_cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
}

function addToCart(product) {
    const cart = getCart();
    const productId = product.id || product._id;
    const existingItem = cart.find(item => {
        const itemId = item.id || item._id;
        return itemId === productId;
    });
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ 
            ...product, 
            id: productId,
            _id: productId,
            quantity: 1 
        });
    }
    
    saveCart(cart);
    updateCartCount();
    displayMessageBox(` ${product.name} added to cart!`);
}

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

// ========================================
// VIEW MODE TOGGLE
// ========================================
window.toggleViewMode = function() {
    viewMode = viewMode === 'grid' ? 'list' : 'grid';
    const grid = document.getElementById('product-grid');
    const icon = document.getElementById('view-mode-icon');
    
    if (viewMode === 'list') {
        grid.classList.add('list-view');
        icon.className = 'fas fa-th-large';
    } else {
        grid.classList.remove('list-view');
        icon.className = 'fas fa-th';
    }
}

// ========================================
// RESET FILTERS
// ========================================
window.resetFilters = function() {
    activeCategory = 'all';
    const sortSelect = document.getElementById('sort-by');
    if(sortSelect) sortSelect.value = 'featured';
    
    document.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
    const allBtn = document.querySelector('[data-category="all"]');
    if (allBtn) allBtn.classList.add('active');
    
    applyFiltersAndSort();
}

// ========================================
// UPDATE PRODUCT COUNT
// ========================================
function updateProductCount(count) {
    const display = document.getElementById('product-count-display');
    if (!display) return;

    if (count === 0) {
        display.textContent = 'No products found';
    } else if (count === productData.length) {
        display.textContent = `Showing all ${count} products`;
    } else {
        display.textContent = `Showing ${count} of ${productData.length} products`;
    }
}

// ========================================
// MESSAGE BOX
// ========================================
window.displayMessageBox = function(message) {
    const existingBox = document.getElementById('message-box');
    if (existingBox) existingBox.remove();

    const messageBox = document.createElement('div');
    messageBox.id = 'message-box';
    messageBox.className = 'message-box-overlay';
    messageBox.innerHTML = `
        <div class="message-box-content">
            <i class="fas fa-check-circle message-icon"></i>
            <p class="message-text">${message}</p>
            <button class="message-close-btn" onclick="document.getElementById('message-box').remove()">
                Close
            </button>
        </div>
    `;
    document.body.appendChild(messageBox);
    
    setTimeout(() => {
        if (document.getElementById('message-box')) {
            document.getElementById('message-box').remove();
        }
    }, 3000);
}

// ========================================
// RENDER PRODUCTS
// ========================================
function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    const noProductsState = document.getElementById('no-products-state');
    
    if(!grid) return;
    grid.innerHTML = '';

    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.category === activeCategory);

    updateProductCount(filteredProducts.length);

    if (filteredProducts.length === 0) {
        if(noProductsState) noProductsState.classList.remove('hidden');
        grid.classList.add('hidden');
        return;
    }
    
    if(noProductsState) noProductsState.classList.add('hidden');
    grid.classList.remove('hidden');

    filteredProducts.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.style.animationDelay = `${index * 0.05}s`;

        const productId = product.id || product._id;
        const stockStatus = product.stock
            ? '<span class="status">In Stock</span>' 
            : `<span class="status out-of-stock">Out of Stock</span>`;

        const newTag = product.isNew ? '<span class="tag new">NEW</span>' : '';
        const saleTag = product.isSale ? '<span class="tag sale">SALE</span>' : '';
        const ratingStars = `<span class="rating">${product.rating || 4.5} <i class="fas fa-star"></i></span>`;

        let imageSource = product.imageUrl;
        if (!imageSource || imageSource.trim() === '') {
            imageSource = `https://placehold.co/600x250/F0F0F0/0A0A0A?text=${encodeURIComponent(product.name)}`;
        }

        const productJson = encodeURIComponent(JSON.stringify(product));

        productCard.innerHTML = `
            <div class="product-image-area" style="background-image: url('${imageSource}');">
                ${newTag}
                ${saleTag}
            </div>
            <div class="product-info">
                <div class="category-label">
                    <span>${product.category.toUpperCase().replace('-', ' ')}</span>
                    ${ratingStars}
                </div>
                <h3>${product.name}</h3>
            </div>
            <div class="product-details-bar">
                <span class="price">${product.price.toFixed(2)} DHS</span>
                ${stockStatus}
                <button class="cart-icon" data-product-id="${productId}" title="Add to Cart">
                    <i class="fas fa-shopping-cart"></i>
                </button>
            </div>
        `;
        grid.appendChild(productCard);

        setTimeout(() => productCard.classList.add('visible'), 10);

        // Cart Click Event
        const cartBtn = productCard.querySelector('.cart-icon');
        cartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(product);
            
            cartBtn.style.transform = 'scale(1.3)';
            setTimeout(() => {
                cartBtn.style.transform = 'scale(1)';
            }, 200);
        });
    });
}

// ========================================
// SORT PRODUCTS
// ========================================
function sortProducts(products, sortBy) {
    const sorted = [...products];
    switch (sortBy) {
        case 'price-asc':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return sorted.sort((a, b) => b.price - a.price);
        case 'newest':
            return sorted.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });
        case 'rating':
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'featured':
        default:
            return sorted;
    }
}

// ========================================
// APPLY FILTERS AND SORT
// ========================================
function applyFiltersAndSort() {
    const sortSelect = document.getElementById('sort-by');
    const sortBy = sortSelect ? sortSelect.value : 'featured';
    const sorted = sortProducts(productData, sortBy);
    renderProducts(sorted);
}

// ========================================
// CHANGE CATEGORY
// ========================================
window.changeCategory = function(category, buttonElement) {
    activeCategory = category;
    document.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');
    applyFiltersAndSort();
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch products from backend
    fetchProducts();
    
    // 2. Setup Sort Listener
    const sortSelect = document.getElementById('sort-by');
    if(sortSelect) {
        sortSelect.addEventListener('change', applyFiltersAndSort);
    }
    
    // 3. Setup Category Filter Listeners
    document.querySelectorAll('.filter-tag').forEach(button => {
        button.addEventListener('click', () => {
            changeCategory(button.getAttribute('data-category'), button);
        });
    });

    // 4. Init Cart Count
    updateCartCount();
});

// CSS for dynamic elements
const productStyles = document.createElement('style');
productStyles.textContent = `
    .cart-badge {
        position: absolute; top: -5px; right: -5px;
        background-color: #10b981; color: white;
        font-size: 0.7rem; font-weight: bold;
        padding: 2px 5px; border-radius: 50%;
        min-width: 15px; text-align: center;
    }
    .message-box-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
    }
    .message-box-content {
        background: white; padding: 2rem; border-radius: 8px;
        text-align: center; max-width: 400px;
    }
    .message-icon {
        font-size: 3rem; color: #10b981; margin-bottom: 1rem;
    }
    .message-text {
        font-size: 1.1rem; margin-bottom: 1.5rem; color: #333;
    }
    .message-close-btn {
        background: #10b981; color: white; border: none;
        padding: 0.75rem 2rem; border-radius: 5px; cursor: pointer;
        font-weight: bold;
    }
`;
document.head.appendChild(productStyles);