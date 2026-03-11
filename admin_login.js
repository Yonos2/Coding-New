document.getElementById('admin-login-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevents the form from submitting the traditional way

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    // Mas robust nga paagi: Kung ang port dili 3000 (backend port), gamita ang full URL.
    // Kini mo-work bisan unsa pa ang port sa Live Server (e.g., 5500, 5501).
    const BASE_URL = window.location.port !== '3000' ? 'http://localhost:3000' : '';

    errorMessage.textContent = ''; // Limpyohan ang error message

    try {
        const response = await fetch(`${BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            // Kung naay error gikan sa server (e.g., 401 Unauthorized)
            throw new Error(result.message || 'Login failed.');
        }

        // Kung successful, i-save ang token sa localStorage
        localStorage.setItem('adminToken', result.token);
        localStorage.setItem('adminData', JSON.stringify(result.admin)); // I-save ang admin details (ID, username)

        // I-redirect sa admin dashboard
        window.location.href = '/admin.html';

    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = error.message;
    }
});