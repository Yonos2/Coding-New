document.getElementById('master-admin-login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    // Mas robust nga paagi: Kung ang port dili 3000 (backend port), gamita ang full URL.
    // Kini mo-work bisan unsa pa ang port sa Live Server (e.g., 5500, 5501).
    const BASE_URL = window.location.port !== '3000' ? 'http://localhost:3000' : '';

    errorMessage.textContent = '';

    try {
        const response = await fetch(`${BASE_URL}/api/master-admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Route not found (404). Please restart your Node.js server.');
            }

            let errorMessage = 'Login failed.';
            try {
                const result = await response.json();
                errorMessage = result.message || errorMessage;
            } catch (e) {
                errorMessage = `Login failed: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();

        // I-save ang master admin info sa localStorage
        localStorage.setItem('masterAdmin', JSON.stringify(result.masterAdmin));

        window.location.href = '/master_admin_dashboard.html';

    } catch (error) {
        console.error('Master Admin Login error:', error);
        errorMessage.textContent = error.message;
    }
});