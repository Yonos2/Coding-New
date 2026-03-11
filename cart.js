document.addEventListener('DOMContentLoaded', () => {
    // Mas robust nga paagi: Kung ang port dili 3000 (backend port), gamita ang full URL.
    // Kini mo-work bisan unsa pa ang port sa Live Server (e.g., 5500, 5501).
    const BASE_URL = window.location.port !== '3000' ? 'http://localhost:3000' : '';
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const paymentOptions = document.getElementsByName('payment');

    // Kuhaon ang cart gikan sa localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Function para i-render ang mga items sa cart
    function renderCartItems() {
        cartItemsList.innerHTML = ''; // Limpyohan ang kasamtangang listahan
        let total = 0;

        if (cart.length === 0) {
            cartItemsList.innerHTML = '<tr><td colspan="5">Your cart is empty.</td></tr>';
            cartTotalElement.textContent = '₱0.00';
            checkoutBtn.disabled = true; // I-disable ang checkout button kung walay sulod ang cart
            return;
        }

        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;

            const cartRow = document.createElement('tr');
            cartRow.innerHTML = `
                <td>${item.name}</td>
                <td>₱${Number(item.price).toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>₱${subtotal.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger remove-item-btn" data-product-id="${item.product_id}" title="Remove item"><i class="bi bi-trash"></i></button>
                </td>
            `;
            cartItemsList.appendChild(cartRow);
        });

        cartTotalElement.textContent = `₱${total.toFixed(2)}`;
        checkoutBtn.disabled = false;
    }

    // Function para i-remove ang item sa cart
    function handleRemoveItem(productId) {
        // I-filter ang cart para makuha ang tanang items gawas sa gi-remove
        cart = cart.filter(item => item.product_id !== productId);
        
        // I-update ang localStorage
        localStorage.setItem('cart', JSON.stringify(cart));

        // I-render pag-usab ang cart para ma-update ang display
        renderCartItems();

        alert('Item removed from cart.');
    }

    // Function para sa pag-checkout
    async function handleCheckout() {
        const customer = JSON.parse(localStorage.getItem('customer'));
        if (!customer || !customer.customer_id) {
            alert('Please log in to proceed with checkout.');
            window.location.href = '/login.html';
            return;
        }

        if (cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        let selectedPaymentMethod = 'Cash on Delivery'; // Default
        for (const option of paymentOptions) {
            if (option.checked) {
                selectedPaymentMethod = option.value;
                break;
            }
        }

        const orderData = {
            customer_id: customer.customer_id,
            items: cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            })),
            extra: {
                payment_method: selectedPaymentMethod
            }
        };

        try {
            // I-ayo ang endpoint gikan sa /api/orders ngadto sa /api/orders/checkout
            const response = await fetch(`${BASE_URL}/api/orders/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                alert('Checkout successful! Your order has been placed.');
                localStorage.removeItem('cart'); // Limpyohan ang cart human sa checkout
                window.location.href = '/customer.html'; // I-redirect pabalik sa product page
            } else {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to place order.');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert(`An error occurred during checkout: ${error.message}`);
        }
    }

    // I-attach ang event listener sa checkout button
    checkoutBtn.addEventListener('click', handleCheckout);

    // I-attach ang event listener sa tibuok listahan para sa "Remove" buttons (Event Delegation)
    cartItemsList.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('remove-item-btn')) {
            const productId = parseInt(e.target.dataset.productId, 10);
            handleRemoveItem(productId);
        }
    });

    // I-render dayon ang cart items inig load sa page
    renderCartItems();
});