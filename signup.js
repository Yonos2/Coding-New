document.addEventListener('DOMContentLoaded', () => {
    // Mas robust nga paagi: Kung ang port dili 3000 (backend port), gamita ang full URL.
    // Kini mo-work bisan unsa pa ang port sa Live Server (e.g., 5500, 5501).
    const BASE_URL = window.location.port !== '3000' ? 'http://localhost:3000' : '';
    const signupForm = document.getElementById('signup-form');
    const signupMessage = document.getElementById('signup-message');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(signupForm);
        const customerData = Object.fromEntries(formData.entries());

        // Basic validation
        if (!customerData.name || !customerData.email || !customerData.password) {
            signupMessage.textContent = 'Please fill in all required fields.';
            signupMessage.className = 'message error';
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create customer.');
            }

            signupMessage.textContent = 'Signup successful! You can now login.';
            signupMessage.className = 'message success';
            signupForm.reset();

        } catch (error) {
            signupMessage.textContent = error.message;
            signupMessage.className = 'message error';
            console.error('Error during signup:', error);
        }
    });
});