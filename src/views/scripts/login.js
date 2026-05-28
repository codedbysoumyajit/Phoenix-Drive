// views/scripts/login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorBox = document.getElementById('errorBox');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Clear previous errors
            if (errorBox) {
                errorBox.style.display = 'none';
                errorBox.textContent = '';
            }

            const formData = new FormData(loginForm);
            const params = new URLSearchParams(formData);

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: params.toString()
                });

                const data = await response.json();

                if (response.ok && data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                } else {
                    const errorMsg = data.error || 'Invalid username or password.';
                    if (errorBox) {
                        errorBox.textContent = errorMsg;
                        errorBox.style.display = 'block';
                        errorBox.classList.add('animate-shake');
                        setTimeout(() => errorBox.classList.remove('animate-shake'), 500);
                    } else {
                        alert(errorMsg);
                    }
                }
            } catch (error) {
                console.error('Login fetch error:', error);
                if (errorBox) {
                    errorBox.textContent = 'A connection error occurred. Please try again.';
                    errorBox.style.display = 'block';
                } else {
                    alert('A connection error occurred.');
                }
            }
        });
    }

    // Toggle password visibility
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');

    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', () => {
            const icon = passwordToggle.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            }
        });
    }
});
