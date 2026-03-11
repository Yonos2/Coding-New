document.addEventListener('DOMContentLoaded', () => {
    // Mas robust nga paagi: Kung ang port dili 3000 (backend port), gamita ang full URL.
    // Kini mo-work bisan unsa pa ang port sa Live Server (e.g., 5500, 5501).
    const BASE_URL = window.location.port !== '3000' ? 'http://localhost:3000' : '';
    const customerLoginForm = document.getElementById('customer-login-form');
    const loginMessage = document.getElementById('login-message');

    customerLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${BASE_URL}/api/customers/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed.');
            }

            // I-save ang customer info sa localStorage para magamit sa ubang pages
            localStorage.setItem('customer', JSON.stringify(result.customer));
            localStorage.setItem('isLoggedIn', 'true');

            // Kung successful ang login, i-redirect sa customer page
            window.location.href = '/customer.html';

        } catch (error) {
            loginMessage.textContent = error.message;
            loginMessage.className = 'message error';
            console.error('Login error:', error);
        }
    });
});