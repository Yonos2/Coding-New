document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = window.location.port !== '3000' ? 'http://localhost:3000' : '';
    const ordersListContainer = document.getElementById('orders-list-container');
    const customerLogoutBtn = document.getElementById('customer-logout-btn');

    // Check login
    const customer = JSON.parse(localStorage.getItem('customer'));
    if (!customer || !customer.customer_id) {
        window.location.href = '/login.html';
        return;
    }

    async function fetchOrders() {
        try {
            const response = await fetch(`${BASE_URL}/api/orders/customer/${customer.customer_id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Order history route not found (404). The server might need a restart.');
                }
                let errorMessage = 'Failed to fetch orders.';
                try {
                    const errorResult = await response.json();
                    errorMessage = errorResult.message || errorMessage;
                } catch (e) {
                    // Ignore if response is not JSON
                }
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            const orders = result.orders;

            ordersListContainer.innerHTML = '';
            if (!orders || orders.length === 0) {
                ordersListContainer.innerHTML = `
                    <div class="text-center p-5">
                        <i class="bi bi-bag-x display-1 text-muted"></i>
                        <p class="mt-3 lead">No purchases found.</p>
                        <a href="/customer.html" class="btn btn-danger">Start Shopping</a>
                    </div>
                `;
                return;
            }

            // Sort orders by date (newest first)
            orders.sort((a, b) => b.order_id - a.order_id);

            for (const order of orders) {
                const date = new Date(order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                const orderCard = document.createElement('div');
                orderCard.className = 'card mb-3 shadow-sm';
                
                // Fetch items for this order
                let itemsHtml = '<div class="p-3 text-muted small">Loading items...</div>';
                try {
                    const itemsResponse = await fetch(`${BASE_URL}/api/orders/${order.order_id}/items`);
                    const itemsResult = await itemsResponse.json();
                    // Handle response whether it's a direct array or wrapped in an object
                    const items = Array.isArray(itemsResult) ? itemsResult : (itemsResult.orderItems || []);
                    
                    if (items.length > 0) {
                        itemsHtml = '<ul class="list-group list-group-flush">';
                        items.forEach(item => {
                            itemsHtml += `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <div class="d-flex align-items-center">
                                        <i class="bi bi-box-seam me-3 text-secondary" style="font-size: 1.5rem;"></i>
                                        <div>
                                            <span class="fw-bold d-block">${item.product_name}</span>
                                            <span class="text-muted small">Qty: ${item.quantity}</span>
                                        </div>
                                    </div>
                                    <span class="fw-semibold">₱${Number(item.subtotal).toFixed(2)}</span>
                                </li>
                            `;
                        });
                        itemsHtml += '</ul>';
                    } else {
                        itemsHtml = '<div class="p-3 text-muted">No items found.</div>';
                    }
                } catch (err) {
                    itemsHtml = '<div class="p-3 text-danger">Failed to load items.</div>';
                }

                orderCard.innerHTML = `
                    <div class="card-header d-flex justify-content-between align-items-center bg-white py-3">
                        <div>
                            <span class="fw-bold text-primary">Order #${order.order_id}</span>
                            <span class="text-muted small ms-2">| ${date}</span>
                        </div>
                    <div>
                        <span class="badge bg-success me-2">Completed</span>
                        <button class="btn btn-outline-danger btn-sm remove-order-btn" data-id="${order.order_id}" title="Remove from history"><i class="bi bi-trash"></i></button>
                    </div>
                    </div>
                    ${itemsHtml}
                    <div class="card-footer bg-light d-flex justify-content-between align-items-center py-3">
                        <span class="text-muted small">Payment: ${order.extra?.payment_method || 'COD'}</span>
                        <div class="text-end">
                            <span class="text-muted me-2">Order Total:</span>
                            <span class="fw-bold text-danger fs-5">₱${Number(order.total_amount).toFixed(2)}</span>
                        </div>
                    </div>
                `;
                ordersListContainer.appendChild(orderCard);
            }

        } catch (error) {
            console.error('Error fetching orders:', error);
            ordersListContainer.innerHTML = '<div class="alert alert-danger">Failed to load your orders.</div>';
        }
    }

    // Function to remove (archive) an order
    async function removeOrder(orderId) {
        if (!confirm('Are you sure you want to remove this order from your history?')) {
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/orders/${orderId}/archive`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Order removed successfully.');
                fetchOrders(); // Refresh the list
            } else {
                const result = await response.json();
                throw new Error(result.message || 'Failed to remove order.');
            }
        } catch (error) {
            console.error('Error removing order:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Use event delegation for remove buttons
    ordersListContainer.addEventListener('click', e => {
        const removeBtn = e.target.closest('.remove-order-btn');
        if (removeBtn) {
            removeOrder(removeBtn.dataset.id);
        }
    });

    fetchOrders();

    customerLogoutBtn.addEventListener('click', () => {
        localStorage.removeItem('customer');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('cart');
        window.location.href = '/';
    });
});