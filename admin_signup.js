document.getElementById('admin-signup-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const signupMessage = document.getElementById('signup-message');
    // Mas robust nga paagi: Kung ang port dili 3000 (backend port), gamita ang full URL.
    // Kini mo-work bisan unsa pa ang port sa Live Server (e.g., 5500, 5501).
    const BASE_URL = window.location.port !== '3000' ? 'http://localhost:3000' : '';

    signupMessage.textContent = '';
    signupMessage.style.color = 'red';

    const signupData = { username, password }; // Updated to send correct data

    try {
        const response = await fetch(`${BASE_URL}/api/admin/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Signup failed.');
        }

        signupMessage.textContent = 'Admin account created successfully! You can now login.';
        signupMessage.style.color = 'green';
        document.getElementById('admin-signup-form').reset();

    } catch (error) {
        console.error('Admin signup error:', error);
        signupMessage.textContent = error.message;
    }
});