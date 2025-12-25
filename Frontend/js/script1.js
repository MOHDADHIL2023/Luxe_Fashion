// Frontend/js/script1.js

// URL Config
const PRODUCTS_URL = typeof API_URL !== 'undefined' ? `${API_URL}/api/products` : 'http://localhost:5001/api/products';

let productData = [];
let activeCategory = 'all';

async function fetchProducts() {
    try {
        toggleLoading(true);
        const res = await fetch(PRODUCTS_URL);
        if (!res.ok) throw new Error("Failed to load products");
        
        productData = await res.json();
        console.log(`Loaded ${productData.length} products`);
        toggleLoading(false);
        applyFilters();
    } catch (err) {
        console.error(err);
        toggleLoading(false);
        document.getElementById('product-grid').innerHTML = '<p class="error">Failed to load products. Ensure backend is running.</p>';
    }
}

function toggleLoading(show) {
    const loader = document.getElementById('loading-state');
    if (loader) loader.classList.toggle('hidden', !show);
}

function applyFilters() {
    const sortBy = document.getElementById('sort-by') ? document.getElementById('sort-by').value : 'featured';
    
    let filtered = activeCategory === 'all' 
        ? [...productData] 
        : productData.filter(p => p.category === activeCategory);

    // Sorting
    if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);
    
    renderProducts(filtered);
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    const noProds = document.getElementById('no-products-state');
    const count = document.getElementById('product-count-display');

    if (!grid) return;
    grid.innerHTML = '';

    if (count) count.textContent = `Showing ${products.length} products`;

    if (products.length === 0) {
        if(noProds) noProds.classList.remove('hidden');
        grid.classList.add('hidden');
        return;
    }

    if(noProds) noProds.classList.add('hidden');
    grid.classList.remove('hidden');

    products.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${idx * 0.05}s`;

        const img = p.imageUrl || 'https://placehold.co/400x400?text=Product';
        
        card.innerHTML = `
            <div class="product-image-area" style="background-image: url('${img}');">
                ${p.isNew ? '<span class="tag new">NEW</span>' : ''}
                ${p.isSale ? '<span class="tag sale">SALE</span>' : ''}
            </div>
            <div class="product-info">
                <div class="category-label">
                    <span>${p.category.toUpperCase().replace('-', ' ')}</span>
                    <span class="rating">${p.rating} <i class="fas fa-star"></i></span>
                </div>
                <h3>${p.name}</h3>
            </div>
            <div class="product-details-bar">
                <span class="price">${p.price.toFixed(2)} DHS</span>
                <span class="status ${p.stock ? '' : 'out-of-stock'}">${p.stock ? 'In Stock' : 'Out'}</span>
                <button class="cart-icon"><i class="fas fa-shopping-cart"></i></button>
            </div>
        `;

        // Attach Event Listener to Button
        const btn = card.querySelector('.cart-icon');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.addToCartBtn) {
                window.addToCartBtn(p); // Calls global function in script.js
            } else {
                console.error("addToCartBtn function missing");
            }
        });

        grid.appendChild(card);
        setTimeout(() => card.classList.add('visible'), 10);
    });
}

// Filter Clicks
window.changeCategory = (cat, btn) => {
    activeCategory = cat;
    document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
};

window.resetFilters = () => {
    activeCategory = 'all';
    document.getElementById('sort-by').value = 'featured';
    document.querySelector('[data-category="all"]').click();
};

window.toggleViewMode = () => {
    const grid = document.getElementById('product-grid');
    grid.classList.toggle('list-view');
};

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    
    document.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', () => changeCategory(btn.dataset.category, btn));
    });
    
    const sort = document.getElementById('sort-by');
    if(sort) sort.addEventListener('change', applyFilters);
});