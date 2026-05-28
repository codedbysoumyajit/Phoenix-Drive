// views/scripts/register.js

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorBox = document.getElementById('errorBox');

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Clear previous errors
            errorBox.style.display = 'none';
            errorBox.textContent = '';

            const formData = new FormData(registerForm);
            const params = new URLSearchParams(formData);

            try {
                const response = await fetch('/register', {
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
                    errorBox.textContent = data.error || 'Registration failed. Please try again.';
                    errorBox.style.display = 'block';
                    errorBox.classList.add('animate-shake');
                    setTimeout(() => errorBox.classList.remove('animate-shake'), 500);
                }
            } catch (error) {
                console.error('Registration fetch error:', error);
                errorBox.textContent = 'A connection error occurred. Please try again.';
                errorBox.style.display = 'block';
            }
        });
    }

    // Toggle password visibility
    const toggleButtons = document.querySelectorAll('.password-toggle-btn');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            
            if (targetInput) {
                const icon = btn.querySelector('i');
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    icon.classList.remove('bi-eye-slash');
                    icon.classList.add('bi-eye');
                } else {
                    targetInput.type = 'password';
                    icon.classList.remove('bi-eye');
                    icon.classList.add('bi-eye-slash');
                }
            }
        });
    });
});
