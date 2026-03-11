document.addEventListener('DOMContentLoaded', () => {
    // Mas robust nga paagi: Kung ang port dili 3000 (backend port), gamita ang full URL.
    // Kini mo-work bisan unsa pa ang port sa Live Server (e.g., 5500, 5501).
    const BASE_URL = window.location.port !== '3000' ? 'http://localhost:3000' : '';
    const profileForm = document.getElementById('profile-form');
    const profileMessage = document.getElementById('profile-message');

    // Susiha kung naka-login ba
    let customerData = JSON.parse(localStorage.getItem('customer'));
    if (!customerData || !customerData.customer_id) {
        window.location.href = '/login.html';
        return;
    }

    const customerId = customerData.customer_id;

    // Function para i-populate ang form
    async function fetchAndDisplayProfile() {
        try {
            const response = await fetch(`${BASE_URL}/api/customers/${customerId}`);
            if (!response.ok) throw new Error('Failed to fetch profile data.');
            
            const customer = await response.json();

            // I-populate ang main fields
            profileForm.name.value = customer.name || '';
            profileForm.email.value = customer.email || '';
            profileForm.phone.value = customer.phone || '';
            profileForm.address.value = customer.address || '';

            // I-populate ang metadata fields
            if (customer.metadata) {
                profileForm.membership.value = customer.metadata.membership || '';
                if (customer.metadata.preferences) {
                    profileForm.likes_promos.checked = customer.metadata.preferences.likes_promos || false;
                    profileForm.favorite_category.value = customer.metadata.preferences.favorite_category || '';
                }
            }
        } catch (error) {
            profileMessage.textContent = error.message;
            profileMessage.innerHTML = `<div class="alert alert-danger" role="alert">${error.message}</div>`;
        }
    }

    // Handle form submission
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(profileForm);
        const data = Object.fromEntries(formData.entries());

        // I-grupo ang metadata
        const updatedData = {
            name: data.name,
            email: data.email, // Idugang ang email sa data nga ipadala
            phone: data.phone,
            address: data.address,
            metadata: {
                membership: data.membership,
                preferences: {
                    likes_promos: data.likes_promos === 'on', // Handle checkbox value
                    favorite_category: data.favorite_category
                }
            }
        };

        try {
            const response = await fetch(`${BASE_URL}/api/customers/${customerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) throw new Error('Failed to update profile.');

            profileMessage.innerHTML = `<div class="alert alert-success" role="alert">Profile updated successfully!</div>`;
        } catch (error) {
            profileMessage.innerHTML = `<div class="alert alert-danger" role="alert">${error.message}</div>`;
        }
    });

    // Kuhaon ang data inig load sa page
    fetchAndDisplayProfile();
});