document.addEventListener('DOMContentLoaded', () => {
    // Mas robust nga paagi: Kung ang port dili 3000 (backend port), gamita ang full URL.
    // Kini mo-work bisan unsa pa ang port sa Live Server (e.g., 5500, 5501).
    const BASE_URL = window.location.port !== '3000' ? 'http://localhost:3000' : '';

    // Susiha kung naka-login ba ang master admin
    if (!localStorage.getItem('masterAdmin')) {
        alert('Access denied. Please login as Master Admin.');
        window.location.href = '/master_admin_login.html';
        return;
    }

    // Mga elemento sa dashboard
    const nav = document.getElementById('dashboard-nav');
    const sections = document.querySelectorAll('.dashboard-section');
    const productList = document.getElementById('product-list');
    const sellerList = document.getElementById('seller-list');
    const customerList = document.getElementById('customer-list');
    const orderList = document.getElementById('order-list');
    const orderItemsList = document.getElementById('order-items-list');
    const logoutBtn = document.getElementById('master-admin-logout-btn');
    
    // Modal element
    const orderDetailsModal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));

    // Kuhaon tanang produkto (gikan sa tanang sellers)
    async function fetchAllProducts() {
        try {
            const response = await fetch(`${BASE_URL}/api/products`);
            const result = await response.json();
            productList.innerHTML = '';
            if (!result.products || result.products.length === 0) {
                productList.innerHTML = `<tr><td colspan="7">No products found.</td></tr>`;
                return;
            }
            result.products.forEach(product => {
                const row = productList.insertRow();
                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.seller_id || 'N/A'}</td>
                    <td>₱${Number(product.price).toFixed(2)}</td>
                    <td>${product.stock}</td>
                    <td>${product.category || 'N/A'}</td>
                    <td>${product.brand || 'N/A'}</td>
                    <td><button class="btn btn-sm btn-danger delete-product-btn" data-id="${product.product_id}">Delete</button></td>
                `;
            });
        } catch (error) {
            console.error('Error fetching all products:', error);
            productList.innerHTML = `<tr><td colspan="7">Failed to load products.</td></tr>`;
        }
    }

    // Kuhaon tanang sellers (kanhi admins)
    async function fetchAllSellers() {
        try {
            const response = await fetch(`${BASE_URL}/api/admin`);
            const result = await response.json();
            sellerList.innerHTML = '';
            if (!result.admins || result.admins.length === 0) {
                sellerList.innerHTML = `<tr><td colspan="4">No sellers found.</td></tr>`;
                return;
            }
            result.admins.forEach(seller => {
                const row = sellerList.insertRow();
                const createdAt = new Date(seller.created_at).toLocaleDateString();
                row.innerHTML = `
                    <td>${seller.admin_id}</td>
                    <td>${seller.username}</td>
                    <td>${createdAt}</td>
                    <td><button class="btn btn-sm btn-danger delete-seller-btn" data-id="${seller.admin_id}">Delete</button></td>
                `;
            });
        } catch (error) {
            console.error('Error fetching sellers:', error);
            sellerList.innerHTML = `<tr><td colspan="4">Failed to load sellers.</td></tr>`;
        }
    }

    // Kuhaon tanang customers
    async function fetchAllCustomers() {
        try {
            const response = await fetch(`${BASE_URL}/api/customers`);
            const customers = await response.json();
            customerList.innerHTML = '';
            if (customers.length === 0) {
                customerList.innerHTML = `<tr><td colspan="5">No customers found.</td></tr>`;
                return;
            }
            customers.forEach(customer => {
                const row = customerList.insertRow();
                row.innerHTML = `
                    <td>${customer.name}</td>
                    <td>${customer.email}</td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td>${customer.metadata?.membership || 'N/A'}</td>
                    <td><button class="btn btn-sm btn-danger delete-customer-btn" data-id="${customer.customer_id}">Delete</button></td>
                `;
            });
        } catch (error) {
            console.error('Error fetching customers:', error);
            customerList.innerHTML = `<tr><td colspan="5">Failed to load customers.</td></tr>`;
        }
    }

    // Kuhaon tanang orders
    async function fetchAllOrders() {
        try {
            const response = await fetch(`${BASE_URL}/api/orders`);
            const orders = await response.json();
            orderList.innerHTML = '';
            if (orders.length === 0) {
                orderList.innerHTML = `<tr><td colspan="6">No orders found.</td></tr>`;
                return;
            }
            orders.forEach(order => {
                const row = orderList.insertRow();
                const orderDate = new Date(order.order_date).toLocaleDateString();
                row.innerHTML = `
                    <td>#${order.order_id}</td>
                    <td>${order.customer_name || 'N/A'}</td>
                    <td>₱${Number(order.total_amount).toFixed(2)}</td>
                    <td>${orderDate}</td>
                    <td>${order.extra?.payment_method || 'N/A'}</td>
                    <td><button class="btn btn-sm btn-info view-order-btn" data-id="${order.order_id}">View Items</button></td>
                `;
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            orderList.innerHTML = `<tr><td colspan="6">Failed to load orders.</td></tr>`;
        }
    }

    // Function to view order details in modal
    async function viewOrderDetails(orderId) {
        const modalBody = document.getElementById('modal-order-items');
        modalBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';
        orderDetailsModal.show();

        try {
            // Fetch all order items and filter (Simple approach)
            const response = await fetch(`${BASE_URL}/api/order-items`);
            const result = await response.json();
            const allItems = result.orderItems || [];
            
            // Filter items for this specific order
            const orderItems = allItems.filter(item => item.order_id == orderId);

            modalBody.innerHTML = '';
            if (orderItems.length === 0) {
                modalBody.innerHTML = '<tr><td colspan="4" class="text-center">No items found for this order.</td></tr>';
                return;
            }

            orderItems.forEach(item => {
                modalBody.innerHTML += `
                    <tr>
                        <td>${item.product_name}</td>
                        <td>${item.quantity}</td>
                        <td>₱${Number(item.price).toFixed(2)}</td>
                        <td>₱${Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error('Error fetching order details:', error);
            modalBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Failed to load details.</td></tr>';
        }
    }

    // Kuhaon tanang order items
    async function fetchAllOrderItems() {
        try {
            const response = await fetch(`${BASE_URL}/api/order-items`);
            const result = await response.json();
            const items = result.orderItems || [];
            
            orderItemsList.innerHTML = '';
            if (items.length === 0) {
                orderItemsList.innerHTML = `<tr><td colspan="7">No order items found.</td></tr>`;
                return;
            }

            items.forEach(item => {
                const row = orderItemsList.insertRow();
                row.innerHTML = `
                    <td>#${item.order_item_id}</td>
                    <td>#${item.order_id}</td>
                    <td>${item.product_name || 'N/A'}</td>
                    <td>${item.quantity}</td>
                    <td>₱${Number(item.price).toFixed(2)}</td>
                    <td>₱${Number(item.subtotal).toFixed(2)}</td>
                    <td><button class="btn btn-sm btn-secondary" disabled>View</button></td>
                `;
            });
        } catch (error) {
            console.error('Error fetching all order items:', error);
            orderItemsList.innerHTML = `<tr><td colspan="7">Failed to load order items.</td></tr>`;
        }
    }

    // Generic Delete Function
    async function deleteItem(url, type) {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            const response = await fetch(url, { method: 'DELETE' });
            if (response.ok) {
                alert(`${type} deleted successfully.`);
                // Refresh lists
                if (type === 'Product') fetchAllProducts();
                if (type === 'Seller') fetchAllSellers();
                if (type === 'Customer') fetchAllCustomers();
            } else {
                alert(`Failed to delete ${type}.`);
            }
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            alert(`Error deleting ${type}.`);
        }
    }

    // Event Delegation for Buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-product-btn')) {
            deleteItem(`${BASE_URL}/api/products/${e.target.dataset.id}`, 'Product');
        }
        if (e.target.classList.contains('delete-seller-btn')) {
            deleteItem(`${BASE_URL}/api/admin/${e.target.dataset.id}`, 'Seller');
        }
        if (e.target.classList.contains('delete-customer-btn')) {
            deleteItem(`${BASE_URL}/api/customers/${e.target.dataset.id}`, 'Customer');
        }
        if (e.target.classList.contains('view-order-btn')) {
            viewOrderDetails(e.target.dataset.id);
        }
    });

    // Logic para sa navigation
    nav.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-target]');
        if (button) {
            const targetId = button.dataset.target;
            sections.forEach(section => section.style.display = 'none');
            document.getElementById(targetId).style.display = 'block';
            nav.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            switch (targetId) {
                case 'products-section': fetchAllProducts(); break;
                case 'sellers-section': fetchAllSellers(); break;
                case 'customers-section': fetchAllCustomers(); break;
                case 'orders-section': fetchAllOrders(); break;
                case 'order-items-section': fetchAllOrderItems(); break;
            }
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('masterAdmin');
        window.location.href = '/';
    });

    fetchAllProducts();
});