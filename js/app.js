// Default Products to show when the site is first opened
const defaultProducts = [
    {
        id: "default-1",
        name: "Midnight Stealth Hoodie",
        category: "hoodies",
        price: 2499,
        originalPrice: 3499,
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800",
        description: "Premium heavyweight cotton hoodie in matte black. Features a relaxed fit and reinforced stitching for ultimate street style."
    },
    {
        id: "default-2",
        name: "Urban Nomad Oversized",
        category: "hoodies",
        price: 2999,
        originalPrice: 3999,
        image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800",
        description: "Comfort meets style with our signature oversized hoodie. Crafted from breathable fleece for year-round wear."
    },
    {
        id: "default-3",
        name: "Street Spirit Sleeveless",
        category: "sleeveless",
        price: 1899,
        originalPrice: 2499,
        image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=800",
        description: "Edge out your competition with our sleeveless performance hoodie. Perfect for layering or showing off your gains."
    },
    {
        id: "default-4",
        name: "Cyberpunk Edition Hoodie",
        category: "hoodies",
        price: 3499,
        originalPrice: 4999,
        image: "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&q=80&w=800",
        description: "A limited edition drop featuring futuristic accents and premium tech-fleece material."
    }
];

// Load Products from LocalStorage or use defaults
let products = JSON.parse(localStorage.getItem('manseek_inventory'));
if (!products || products.length === 0) {
    products = defaultProducts;
    localStorage.setItem('manseek_inventory', JSON.stringify(products));
}

// App State
let cart = JSON.parse(localStorage.getItem('manseek_cart')) || [];

// DOM Elements
const header = document.getElementById('main-header');
const featuredGrid = document.getElementById('featured-products');
let cartTrigger, cartDrawer, cartClose, cartOverlay, cartItemsContainer, cartCountElements, totalAmountElement;

function initDOMElements() {
    cartTrigger = document.querySelector('.cart-trigger');
    cartDrawer = document.querySelector('.cart-drawer');
    cartClose = document.querySelector('.close-cart');
    cartOverlay = document.querySelector('.cart-drawer-overlay');
    cartItemsContainer = document.querySelector('.cart-items');
    cartCountElements = document.querySelectorAll('.cart-count');
    totalAmountElement = document.querySelector('.total-amount');
}

// Ensure Cart Structure exists
function ensureCartStructure() {
    const drawer = document.querySelector('.cart-drawer');
    if (!drawer) return;

    if (!drawer.querySelector('.cart-items')) {
        drawer.innerHTML = `
            <div class="cart-header">
                <h3>Shopping Bag (<span class="cart-count">0</span>)</h3>
                <button class="close-cart">&times;</button>
            </div>
            <div class="cart-items">
                <!-- Cart items injected by JS -->
                <div class="empty-cart-msg">Your bag is empty</div>
            </div>
            <div class="cart-footer">
                <div class="cart-total">
                    <span>Subtotal</span>
                    <span class="total-amount">₹0.00</span>
                </div>
                <button class="btn btn-primary btn-block" onclick="location.href='checkout.html'">Checkout</button>
            </div>
        `;
        // Re-initialize elements after injection
        initDOMElements();
        
        // Re-attach close event if needed
        if (cartClose) cartClose.addEventListener('click', toggleCart);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    ensureCartStructure();
    renderFeaturedProducts();
    updateCartUI();
    
    // Scroll Event
    window.addEventListener('scroll', () => {
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });

    // Cart Events
    if (cartTrigger) cartTrigger.addEventListener('click', toggleCart);
    if (cartClose) cartClose.addEventListener('click', toggleCart);
    if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);

    // User Profile Event
    const userBtn = document.getElementById('user-btn');
    if (userBtn) {
        userBtn.addEventListener('click', () => {
            const currentUser = localStorage.getItem('manseek_current_user');
            if (currentUser) {
                location.href = 'account.html';
            } else {
                location.href = 'customer-login.html';
            }
        });
    }
});

// Functions
function renderFeaturedProducts() {
    if (!featuredGrid) return;
    
    if (products.length === 0) {
        featuredGrid.style.display = 'block';
        featuredGrid.innerHTML = `
            <div class="empty-shop-msg" style="text-align: center; padding: 100px 0; grid-column: 1/-1; width: 100%;">
                <h3 class="playfair" style="font-size: 24px; margin-bottom: 20px;">Your Collection is Empty</h3>
                <p style="color: var(--text-muted); margin-bottom: 30px;">Add your first products from the Admin Dashboard.</p>
                <a href="admin.html" class="btn btn-outline">Go to Admin</a>
            </div>
        `;
        return;
    }
    
    featuredGrid.style.display = 'grid';
    featuredGrid.innerHTML = products.map(product => `
        <div class="product-card" data-aos="fade-up">
            <div class="product-img-wrapper">
                <a href="product.html?id=${product.id}">
                    <img src="${product.image}" alt="${product.name}">
                </a>
                <div class="product-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); addToCart('${product.id}')">
                        <i class="icon-shopping-cart"></i>
                    </button>
                    <button class="action-btn">
                        <i class="icon-heart"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <a href="product.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                    <h3>${product.name}</h3>
                </a>
                <div class="product-price">
                    <span class="old-price">₹${product.originalPrice}</span>
                    <span class="current-price">₹${product.price.toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleCart() {
    if (cartDrawer) cartDrawer.classList.toggle('open');
    if (cartOverlay) cartOverlay.classList.toggle('open');
}

window.addToCart = function(productId, customData = null) {
    // Convert to string for consistent comparison
    const pId = String(productId);
    const product = products.find(p => String(p.id) === pId);
    
    if (!product) {
        console.error("Product not found:", productId);
        return;
    }

    if (customData) {
        // Create a unique entry for custom product
        const customItem = {
            ...product,
            id: `custom-${Date.now()}`,
            baseId: productId,
            name: `Custom ${product.name}`,
            price: 3499,
            custom: customData,
            image: customData.preview || product.image,
            quantity: 1
        };
        cart.push(customItem);
    } else {
        const existingItem = cart.find(item => String(item.id) === pId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
    }

    saveCart();
    updateCartUI();
    if (cartDrawer && !cartDrawer.classList.contains('open')) toggleCart();
};

window.removeFromCart = function(id) {
    cart = cart.filter(item => String(item.id) !== String(id));
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('manseek_cart', JSON.stringify(cart));
}

window.updateQuantity = function(id, delta) {
    const item = cart.find(i => String(i.id) === String(id));
    if (item) {
        item.quantity += delta;
        if (item.quantity < 1) {
            window.removeFromCart(id);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function updateCartUI() {
    // Re-check elements in case they were injected
    if (!cartItemsContainer) initDOMElements();
    if (!cartItemsContainer) return;

    // Update Counts
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElements.forEach(el => el.textContent = totalItems);

    // Update Items List
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-msg" style="padding: 40px 0; text-align: center; opacity: 0.6;">
                <p>Your bag is empty</p>
                <a href="shop.html" class="btn btn-outline" style="margin-top: 15px; display: inline-block; font-size: 12px;">Shop Now</a>
            </div>`;
        const checkoutBtn = document.querySelector('.cart-footer .btn-primary');
        if (checkoutBtn) {
            checkoutBtn.style.opacity = '0.5';
            checkoutBtn.style.pointerEvents = 'none';
        }
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-img">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-info" style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h4 style="margin: 0; font-size: 13px;">${item.name}</h4>
                        <button onclick="removeFromCart('${item.id}')" style="background: none; border: none; color: #f43f5e; font-size: 10px; cursor: pointer;">Remove</button>
                    </div>
                    ${item.custom ? `<p style="font-size: 10px; color: var(--primary-color); margin: 2px 0;">Customized</p>` : ''}
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <div class="qty-control" style="display: flex; align-items: center; border: 1px solid #eee; border-radius: 4px;">
                            <button onclick="updateQuantity('${item.id}', -1)" style="padding: 2px 8px; background: none; border: none; cursor: pointer;">-</button>
                            <span style="padding: 0 8px; font-size: 12px;">${item.quantity}</span>
                            <button onclick="updateQuantity('${item.id}', 1)" style="padding: 2px 8px; background: none; border: none; cursor: pointer;">+</button>
                        </div>
                        <p style="margin: 0; font-weight: 700; font-size: 13px;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>
        `).join('');
        const checkoutBtn = document.querySelector('.cart-footer .btn-primary');
        if (checkoutBtn) {
            checkoutBtn.style.opacity = '1';
            checkoutBtn.style.pointerEvents = 'all';
        }
    }

    // Update Total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (totalAmountElement) totalAmountElement.textContent = `₹${total.toLocaleString('en-IN')}`;
}

// Inline styles for cart items and structural fixes
const style = document.createElement('style');
style.textContent = `
    .cart-drawer {
        display: flex;
        flex-direction: column;
    }
    .cart-items {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
    }
    .cart-header {
        padding: 20px;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .cart-footer {
        padding: 20px;
        border-top: 1px solid #f1f5f9;
        background: #fff;
    }
    .cart-total {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        font-weight: 700;
    }
    .cart-item {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        align-items: flex-start;
        animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
    }
    .cart-item-img {
        width: 60px;
        height: 80px;
        background: #f5f5f5;
        overflow: hidden;
        border-radius: 8px;
    }
    .cart-item-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .close-cart {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-muted);
    }
    .qty-control button:hover {
        background: #f8fafc;
    }
`;
document.head.appendChild(style);

