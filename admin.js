document.addEventListener('DOMContentLoaded', () => { // Kini nga script para sa admin dashboard
    // Mas robust nga paagi: Kung ang port dili 3000 (backend port), gamita ang full URL.
    // Kini mo-work bisan unsa pa ang port sa Live Server (e.g., 5500, 5501).
    const BASE_URL = window.location.port !== '3000' ? 'http://localhost:3000' : '';
    
    // Mga Elemento sa Dashboard
    const nav = document.getElementById('dashboard-nav');
    const sections = document.querySelectorAll('.dashboard-section');

    // Mga Elemento sa  (Table)
    const productList = document.getElementById('product-list');
    const orderList = document.getElementById('order-list');
    const customerList = document.getElementById('customer-list');
    const orderItemsList = document.getElementById('order-items-list');
    const archivedProductList = document.getElementById('archived-product-list');
    const archivedCustomerList = document.getElementById('archived-customer-list');
    const archivedOrderItemsList = document.getElementById('archived-order-items-list');
    const archivedOrderList = document.getElementById('archived-order-list');
    
    // Mga Elemento sa Form
    const addProductForm = document.getElementById('add-product-form');
    const addProductFormContainer = document.getElementById('add-product-form-container');
    const showProductFormBtn = document.getElementById('show-add-product-form-btn');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    // Kuhaon ang Admin Data gikan sa login
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    if (!adminData || !adminData.id) {
        // Kung walay data, basin wala naka-login og tarong o daan nga session
        // Optional: window.location.href = '/'; 
    }

    // Inject Notification Tab and Section (Dynamically para dili na hilabtan ang HTML file)
    const notificationTabHtml = `
        <button class="list-group-item list-group-item-action" data-target="notifications-section">
            <i class="bi bi-bell"></i> Notifications <span id="notif-badge" class="badge bg-danger rounded-pill" style="display:none;">0</span>
        </button>
    `;
    nav.insertAdjacentHTML('beforeend', notificationTabHtml);

    const notificationSectionHtml = `
        <div id="notifications-section" class="dashboard-section" style="display: none;">
            <h2>Your Notifications</h2>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead><tr><th>Message</th><th>Date</th><th>Action</th></tr></thead>
                    <tbody id="notification-list"></tbody>
                </table>
            </div>
        </div>
    `;
    document.querySelector('main').insertAdjacentHTML('beforeend', notificationSectionHtml);
    const notificationList = document.getElementById('notification-list');
    const notifBadge = document.getElementById('notif-badge');

    // ===== MGA FUNCTIONS PARA SA PAGKUHA OG DATA =====

    async function fetchProducts() {
        try {
            const response = await fetch(`${BASE_URL}/api/products`);
            const result = await response.json();
            const products = result.products; // Kuhaon ang array gikan sa 'products' property

            productList.innerHTML = ''; // Limpyohan ang lista
            if (!products || products.length === 0) { // Susiha kung naay sulod ang array
                productList.innerHTML = `<tr><td colspan="8">No products found.</td></tr>`;
                return;
            }
            products.forEach(product => {
                const row = productList.insertRow();
                row.innerHTML = `
                    <td><strong>${product.name}</strong></td>
                    <td>${product.category || 'N/A'}</td>
                    <td>${product.brand || '---'}</td>
                    <td>${product.size || '---'}</td>
                    <td>₱${Number(product.price).toFixed(2)}</td>
                    <td>${product.stock}</td>
                    <td>${product.tags && product.tags.length > 0 ? product.tags.join(', ') : '---'}</td>
                    <td class="btn-group" role="group">
                        <button class="btn btn-info btn-sm add-stock-btn" data-id="${product.product_id}" title="Add Stock"><i class="bi bi-plus-square"></i></button>
                        <button class="btn btn-danger btn-sm archive-product-btn" data-id="${product.product_id}" title="Archive Product"><i class="bi bi-trash"></i></button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            productList.innerHTML = `<tr><td colspan="8">Failed to load products.</td></tr>`;
        }
    }

    async function fetchOrders() {
        try {
            const response = await fetch(`${BASE_URL}/api/orders`);
            const orders = await response.json();

            orderList.innerHTML = ''; // Limpyohan ang lista
            if (orders.length === 0) {
                orderList.innerHTML = `<tr><td colspan="6">No orders found.</td></tr>`;
                return;
            }
            orders.forEach(order => {
                const row = orderList.insertRow();
                // I-handle ang kaso kung ang order_date kay null o undefined
                const orderDate = order.order_date ? new Date(order.order_date).toLocaleDateString('en-US') : 'N/A';
                // I-parse ug i-display ang payment method gikan sa 'extra' (gi-ayo gikan sa .Payment ngadto sa .payment_method)
                const paymentMethod = order.extra && order.extra.payment_method ? order.extra.payment_method : 'N/A';
                row.innerHTML = `
                    <td>#${order.order_id}</td>
                    <td>${order.customer_id}</td>
                    <td>${order.customer_name || 'N/A'}</td>
                    <td>₱${Number(order.total_amount).toFixed(2)}</td>
                    <td>${orderDate}</td>
                    <td>${paymentMethod}</td>
                    <td><button class="btn btn-danger btn-sm archive-order-btn" data-id="${order.order_id}" title="Archive Order"><i class="bi bi-trash"></i></button></td>
                `;
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            orderList.innerHTML = `<tr><td colspan="6">Failed to load orders.</td></tr>`;
        }
    }

    async function fetchCustomers() {
        try {
            const response = await fetch(`${BASE_URL}/api/customers`);
            const customers = await response.json();

            customerList.innerHTML = ''; // Limpyohan ang lista
            if (customers.length === 0) {
                customerList.innerHTML = `<tr><td colspan="6">No customers found.</td></tr>`;
                return;
            }
            customers.forEach(customer => {
                const row = customerList.insertRow();
                row.dataset.customerId = customer.customer_id; // Idugang para dali ra pangitaon

                // I-proseso ang metadata para sa Membership ug Preferences
                const membership = customer.metadata && customer.metadata.membership ? customer.metadata.membership : '---';
                let preferences = '---';
                if (customer.metadata && customer.metadata.preferences) {
                    const prefs = customer.metadata.preferences;
                    const likesPromos = prefs.likes_promos ? 'Likes Promos' : '';
                    const favCategory = prefs.favorite_category ? `Fav: ${prefs.favorite_category}` : '';
                    preferences = [likesPromos, favCategory].filter(Boolean).join(', ') || '---';
                }

                row.innerHTML = `
                    <td>${customer.name}</td>
                    <td>${customer.email}</td>
                    <td>${customer.phone}</td>
                    <td>${membership}</td>
                    <td>${preferences}</td>
                    <td><button class="btn btn-danger btn-sm archive-customer-btn" data-id="${customer.customer_id}" title="Archive Customer"><i class="bi bi-trash"></i></button></td>
                `;
            });
        } catch (error) {
            console.error('Error fetching customers:', error);
            customerList.innerHTML = `<tr><td colspan="6">Failed to load customers.</td></tr>`;
        }
    }

    async function fetchOrderItems() {
        try {
            const response = await fetch(`${BASE_URL}/api/order-items`);
            const result = await response.json(); // Kuhaon ang tibuok response object
            const items = result.orderItems; // Kuhaon ang array gikan sa 'orderItems' property

            orderItemsList.innerHTML = ''; // Limpyohan ang lista
            // Susiha kung ang 'items' array kay valid ba
            if (!Array.isArray(items) || items.length === 0) {
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
                    <td><button class="btn btn-danger btn-sm archive-order-item-btn" data-id="${item.order_item_id}" title="Archive Item"><i class="bi bi-trash"></i></button></td>
                `;
            });
        } catch (error) {
            console.error('Error fetching order items:', error);
            orderItemsList.innerHTML = `<tr><td colspan="7">Failed to load order items.</td></tr>`;
        }
    }

    async function fetchNotifications() {
        if (!adminData || !adminData.id) return;
        try {
            const response = await fetch(`${BASE_URL}/api/admin/${adminData.id}/notifications`);
            
            if (!response.ok) {
                console.warn(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
                return;
            }

            const result = await response.json();
            const notifications = result.notifications || [];

            notificationList.innerHTML = '';
            let unreadCount = 0;

            if (notifications.length === 0) {
                notificationList.innerHTML = `<tr><td colspan="3">No notifications.</td></tr>`;
            } else {
                notifications.forEach(notif => {
                    if (!notif.is_read) unreadCount++;
                    const row = notificationList.insertRow();
                    const date = new Date(notif.created_at).toLocaleString();
                    const rowClass = notif.is_read ? 'text-muted' : 'fw-bold';
                    
                    row.innerHTML = `
                        <td class="${rowClass}">${notif.message}</td>
                        <td>${date}</td>
                        <td>
                            ${!notif.is_read ? `<button class="btn btn-sm btn-primary mark-read-btn" data-id="${notif.notification_id}">Mark Read</button>` : '<span class="badge bg-secondary">Read</span>'}
                        </td>
                    `;
                });
            }

            // Update Badge
            if (unreadCount > 0) {
                notifBadge.textContent = unreadCount;
                notifBadge.style.display = 'inline-block';
            } else {
                notifBadge.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    // ===== MGA FUNCTIONS PARA SA ARCHIVING =====

    async function fetchArchivedProducts() {
        try {
            const response = await fetch(`${BASE_URL}/api/products/archived`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch archived products. Server responded with ${response.status}: ${errorText}`);
            }
            const result = await response.json();
            const products = result.products; // Extract the array from the 'products' property

            archivedProductList.innerHTML = ''; // Limpyohan ang lista
            if (!products || products.length === 0) {
                archivedProductList.innerHTML = `<tr><td colspan="5">No archived products found.</td></tr>`;
                return;
            }
            products.forEach(product => {
                const row = archivedProductList.insertRow();
                const archivedDate = product.deleted_at ? new Date(product.deleted_at).toLocaleDateString('en-US') : 'N/A';
                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.category || 'N/A'}</td>
                    <td>₱${Number(product.price).toFixed(2)}</td>
                    <td>${product.stock}</td>
                    <td>${archivedDate}</td>
                `;
            });
        } catch (error) {
            console.error('Error fetching archived products:', error);
            archivedProductList.innerHTML = `<tr><td colspan="5">Failed to load archived products.</td></tr>`;
        }
    }

    async function fetchArchivedCustomers() {
        try {
            const response = await fetch(`${BASE_URL}/api/customers/archived`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch archived customers. Server responded with ${response.status}: ${errorText}`);
            }
            const customers = await response.json();

            archivedCustomerList.innerHTML = ''; // Limpyohan ang lista
            if (customers.length === 0) {
                archivedCustomerList.innerHTML = `<tr><td colspan="4">No archived customers found.</td></tr>`;
                return;
            }
            customers.forEach(customer => {
                const row = archivedCustomerList.insertRow();
                const archivedDate = customer.archived_at ? new Date(customer.archived_at).toLocaleDateString('en-US') : 'N/A';
                row.innerHTML = `
                    <td>${customer.name}</td>
                    <td>${customer.email}</td>
                    <td>${customer.phone}</td>
                    <td>${archivedDate}</td>
                    <td class="btn-group" role="group">
                        <button class="btn btn-outline-danger btn-sm hard-delete-customer-btn" data-id="${customer.customer_id}" title="Permanently Delete"><i class="bi bi-x-octagon-fill"></i> Hard Delete</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error fetching archived customers:', error);
            archivedCustomerList.innerHTML = `<tr><td colspan="4">Failed to load archived customers.</td></tr>`;
        }
    }

    async function fetchArchivedOrderItems() {
        try {
            const response = await fetch(`${BASE_URL}/api/order-items/archived`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch archived order items. Server responded with ${response.status}: ${errorText}`);
            }
            const items = await response.json();

            archivedOrderItemsList.innerHTML = ''; // Limpyohan ang lista
            if (items.length === 0) {
                archivedOrderItemsList.innerHTML = `<tr><td colspan="8">No archived order items found.</td></tr>`;
                return;
            }
            items.forEach(item => {
                const row = archivedOrderItemsList.insertRow();
                const archivedDate = item.deleted_at ? new Date(item.deleted_at).toLocaleDateString('en-US') : 'N/A';
                row.innerHTML = `
                    <td>#${item.order_item_id}</td>
                    <td>#${item.order_id}</td>
                    <td>${item.product_name || 'N/A'}</td>
                    <td>${item.quantity}</td>
                    <td>₱${Number(item.price).toFixed(2)}</td>
                    <td>₱${Number(item.subtotal).toFixed(2)}</td>
                    <td>${archivedDate}</td>
                `;
            });
        } catch (error) {
            console.error('Error fetching archived order items:', error);
            archivedOrderItemsList.innerHTML = `<tr><td colspan="8">Failed to load archived order items.</td></tr>`;
        }
    }

    async function fetchArchivedOrders() {
        try {
            const response = await fetch(`${BASE_URL}/api/orders/archived`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch archived orders. Server responded with ${response.status}: ${errorText}`);
            }
            const orders = await response.json();

            archivedOrderList.innerHTML = ''; // Limpyohan ang lista
            if (orders.length === 0) {
                archivedOrderList.innerHTML = `<tr><td colspan="5">No archived orders found.</td></tr>`;
                return;
            }
            orders.forEach(order => {
                const row = archivedOrderList.insertRow();
                const archivedDate = order.deleted_at ? new Date(order.deleted_at).toLocaleDateString('en-US') : 'N/A';
                row.innerHTML = `
                    <td>#${order.order_id}</td>
                    <td>${order.customer_id}</td>
                    <td>${order.customer_name || 'N/A'}</td>
                    <td>₱${Number(order.total_amount).toFixed(2)}</td>
                    <td>${archivedDate}</td>
                `;
            });
        } catch (error) {
            console.error('Error fetching archived orders:', error);
            archivedOrderList.innerHTML = `<tr><td colspan="5">Failed to load archived orders.</td></tr>`;
        }
    }

    // Function para mag-archive og customer
    async function archiveCustomer(customerId) {
        // Pangutan-on una ang admin kung sigurado ba siya
        if (!confirm('Are you sure you want to archive this customer? They will be moved to the archive list.')) {
            return;
        }

        try {
            // I-assume nga ang endpoint para sa pag-archive kay gi-usab sa backend
            const response = await fetch(`${BASE_URL}/api/customers/${customerId}/archive`, {
                method: 'DELETE',
            });

            // Susiha kung ang tubag kay OK ba, bisan walay JSON content
            if (!response.ok) {
                const errorText = await response.text(); // Gamiton ang .text() para malikayan ang JSON error
                throw new Error(`Failed to archive customer. Server says: ${errorText}`);
            }
            
            alert('Customer archived successfully.');
            fetchCustomers(); // I-refresh ang customer list

        } catch (error) {
            console.error('Error archiving customer:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Function para mag-hard delete og customer
    async function hardDeleteCustomer(customerId) {
        if (!confirm('WARNING: This will permanently delete the customer and all their associated orders. This action cannot be undone. Are you sure?')) {
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/customers/${customerId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to permanently delete customer.');
            }

            alert('Customer permanently deleted successfully.');
            fetchArchivedCustomers(); // I-refresh ang archived customer list

        } catch (error) {
            console.error('Error hard deleting customer:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Function para mag-archive og produkto
    async function archiveProduct(productId) {
        if (!confirm('Are you sure you want to archive this product?')) {
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/products/${productId}/archive`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // Kung naay error, kuhaon ang JSON gikan sa response para sa detalye
                const errorResult = await response.json();
                // Ipakita ang specific error message gikan sa server
                throw new Error(errorResult.message || 'Failed to archive product.');
            }

            const result = await response.json();
            alert(result.message);
            fetchProducts(); // I-refresh ang product list

        } catch (error) {
            console.error('Error archiving product:', error);
            // Ipakita ang error message sa user sa usa ka alert
            alert(error.message);
        }
    }

    // Function para mag-archive og order
    async function archiveOrder(orderId) {
        if (!confirm('Are you sure you want to archive this order?')) {
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/orders/${orderId}/archive`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to archive order.');
            }
            
            alert('Order archived successfully.');
            fetchOrders(); // I-refresh ang order list

        } catch (error) {
            console.error('Error archiving order:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Function para mag-archive og order item
    async function archiveOrderItem(orderItemId) {
        if (!confirm('Are you sure you want to archive this order item?')) {
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/order-items/${orderItemId}/archive`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to archive order item.');
            alert('Order item archived successfully.');
            fetchOrderItems(); // I-refresh ang listahan
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    // Function para magdugang og stock sa produkto
    async function addStockToProduct(productId) {
        const quantityToAdd = prompt("Enter the quantity to add to stock:");

        if (quantityToAdd === null || quantityToAdd.trim() === "") {
            return; // User cancelled or entered nothing
        }

        const quantity = parseInt(quantityToAdd, 10);
        if (isNaN(quantity) || quantity <= 0) {
            alert("Please enter a valid positive number for the quantity.");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/products/${productId}/add-stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quantity }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to add stock.');
            }

            alert(result.message || 'Stock added successfully.');
            fetchProducts(); // I-refresh ang product list
        } catch (error) {
            console.error('Error adding stock:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Function para i-marka nga read ang notification
    async function markNotificationAsRead(id) {
        try {
            await fetch(`${BASE_URL}/api/admin/notifications/${id}/read`, { method: 'PUT' });
            fetchNotifications(); // Refresh list
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }



    // Function para magdugang og bag-ong produkto
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(addProductForm);
        const productData = Object.fromEntries(formData.entries());

        // I-convert ang comma-separated tags string ngadto sa array
        if (productData.tags) {
            productData.tags = productData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else {
            productData.tags = []; // Ibutang isip empty array kung walay sulod
        }

        try {
            const response = await fetch(`${BASE_URL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) {
                throw new Error('Failed to add product');
            }

            addProductForm.reset(); // Limpyohan ang form
            addProductFormContainer.style.display = 'none'; // Tagoan ang form human ma-save
            fetchProducts(); // I-refresh ang product list
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Error adding product. Please check the console.');
        }
    });

    // Ipakita/itago ang "Add Product" form
    showProductFormBtn.addEventListener('click', () => {
        const isVisible = addProductFormContainer.style.display === 'block';
        addProductFormContainer.style.display = isVisible ? 'none' : 'block';
    });

    // Logout functionality
    adminLogoutBtn.addEventListener('click', () => {
        // Sa tinuod nga app, dinhi nimo i-clear ang session o token
        localStorage.removeItem('adminData');
        localStorage.removeItem('adminToken');
        window.location.href = '/'; // Redirect sa home page
    });

    // ===== LOGIC PARA SA DASHBOARD NAVIGATION =====

    nav.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-target], .dropdown-item[data-target]');
        if (button) {
            const targetId = button.dataset.target;

            // Hide all sections
            sections.forEach(section => section.style.display = 'none');
            
            // Show the target section
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }

            // Update active state for main nav buttons
            nav.querySelectorAll('.list-group-item-action').forEach(btn => btn.classList.remove('active'));
            
            // Pangitaon ang main button para himoong active (bisan kung dropdown item ang gi-klik)
            const mainButton = e.target.closest('.list-group-item');
            if(mainButton && !mainButton.classList.contains('dropdown')){
                 mainButton.classList.add('active');
            }

            // Fetch data for the selected tab
            switch (targetId) {
                case 'products-section': fetchProducts(); break;
                case 'orders-section': fetchOrders(); break;
                case 'customers-section': fetchCustomers(); break;
                case 'order-items-section': fetchOrderItems(); break;
                case 'archived-products-section': fetchArchivedProducts(); break;
                case 'archived-customers-section': fetchArchivedCustomers(); break;
                case 'archived-order-items-section': fetchArchivedOrderItems(); break;
                case 'archived-orders-section': fetchArchivedOrders(); break;
                case 'notifications-section': fetchNotifications(); break;
            }
        }
    });

    // Event listener para sa mga archive buttons sa customer list (gamit ang event delegation)
    customerList.addEventListener('click', (e) => {
        if (e.target.classList.contains('archive-customer-btn')) {
            const customerId = e.target.dataset.id;
            archiveCustomer(customerId);
        }
    });

    // Event listener para sa mga archive buttons sa product list
    productList.addEventListener('click', (e) => {
        if (e.target.classList.contains('archive-product-btn')) {
            const productId = parseInt(e.target.dataset.id, 10);
            archiveProduct(productId);
        }
        if (e.target.classList.contains('add-stock-btn')) {
            const productId = parseInt(e.target.dataset.id, 10);
            addStockToProduct(productId);
        }
    });

    // Event listener para sa archive buttons sa order list
    orderList.addEventListener('click', (e) => {
        if (e.target.classList.contains('archive-order-btn')) {
            const orderId = e.target.dataset.id;
            archiveOrder(orderId);
        }
    });

    // Event listener para sa archive buttons sa order items list
    orderItemsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('archive-order-item-btn')) {
            const orderItemId = e.target.dataset.id;
            archiveOrderItem(orderItemId);
        }
    });

    // Event listener para sa hard delete button sa archived customers list
    archivedCustomerList.addEventListener('click', (e) => {
        if (e.target.classList.contains('hard-delete-customer-btn')) {
            const customerId = e.target.dataset.id;
            hardDeleteCustomer(customerId);
        }
    });

    // Event listener para sa notifications
    if (notificationList) {
        notificationList.addEventListener('click', (e) => {
            if (e.target.classList.contains('mark-read-btn')) {
                markNotificationAsRead(e.target.dataset.id);
            }
        });
    }

    // Inisyal nga pag-load sa data
    // Kuhaon ang mga produkto inig abli sa page
    fetchProducts();
    fetchNotifications(); // Check notifications on load
});