document.addEventListener('DOMContentLoaded', () => {
    // Mas robust nga paagi: Kung ang port dili 3000 (backend port), gamita ang full URL.
    // Kini mo-work bisan unsa pa ang port sa Live Server (e.g., 5500, 5501).
    const BASE_URL = window.location.port !== '3000' ? 'http://localhost:3000' : ''; // Kini nga script para sa customer view

    const customerProductList = document.getElementById('customer-product-list');

    // Susiha kung naka-login ba. Kung wala, i-redirect sa login page.
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = '/login.html';
        return; // Hunungon ang pag-execute sa script
    }

    const customerLogoutBtn = document.getElementById('customer-logout-btn');

    // Tipiganan sa tanang produkto para dali ma-access
    let allProducts = [];

    // Fetch and Display Products for Customer
    async function fetchAndDisplayProducts() {
        try {
            const response = await fetch(`${BASE_URL}/api/products`);
            const result = await response.json();
            const products = result.products; // Kuhaon ang array gikan sa 'products' property

            customerProductList.innerHTML = '';
            if (!products || products.length === 0) {
                customerProductList.innerHTML = '<p>No products available.</p>';
                return;
            }

            allProducts = products; // I-save ang saktong array sa mga produkto
            renderProducts(); // Tawagon ang function para i-display sila

        } catch (error) {
            console.error('Error fetching customer products:', error);
            customerProductList.innerHTML = '<p>Failed to load products.</p>';
        }
    }

    // Function para i-render (o i-redraw) ang mga produkto
    function renderProducts() {
        customerProductList.innerHTML = '';
        const cart = JSON.parse(localStorage.getItem('cart')) || [];

        allProducts.forEach(product => {
            const cartItem = cart.find(item => item.product_id === product.product_id);
            const currentStock = product.stock - (cartItem ? cartItem.quantity : 0);

            const productCol = document.createElement('div');
            productCol.className = 'col';

            productCol.innerHTML = `
                <div class="card h-100 product-card-bs">
                    <div class="card-body d-flex flex-column p-2">
                        <h5 class="card-title product-name-bs">${product.name}</h5>
                        <p class="card-text price-bs mb-2">₱${Number(product.price).toFixed(2)}</p>
                        <div class="d-flex justify-content-between text-muted small mt-auto">
                            <span>Stock: ${currentStock}</span>
                            <span>Sold: ${product.sold_count || 0}</span>
                        </div>
                    </div>
                    <div class="card-footer p-1 border-0 bg-transparent">
                        <button class="btn btn-danger btn-sm w-100 add-to-cart-btn" data-product-id="${product.product_id}" ${currentStock <= 0 ? 'disabled' : ''}>
                            ${currentStock <= 0 ? 'Out of Stock' : '<i class="bi bi-cart-plus"></i> Add to Cart'}
                        </button>
                    </div>
                </div>
            `;
            customerProductList.appendChild(productCol);
        });

        // I-attach pag-usab ang mga event listeners sa mga bag-ong buttons
        attachAddToCartListeners();
    }

    // Function para magdugang og produkto sa cart
    function addToCart(productId) {
        const product = allProducts.find(p => p.product_id === productId);
        if (!product) return;

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.product_id === product.product_id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        alert(`Added ${product.name} to cart!`);
        renderProducts(); // I-redraw ang mga produkto para ma-update ang stock display
    }

    // Function para i-attach ang event listeners sa "Add to Cart" buttons
    function attachAddToCartListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = parseInt(btn.dataset.productId, 10);
                addToCart(productId);
            });
        });
    }

    // Kuhaon dayon ang mga produkto inig load sa page
    fetchAndDisplayProducts();

    // Logout functionality
    customerLogoutBtn.addEventListener('click', () => {
        localStorage.removeItem('customer');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('cart');
        window.location.href = '/'; // Redirect sa home page
    });
});