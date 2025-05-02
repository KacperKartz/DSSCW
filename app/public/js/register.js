const form = document.getElementById('register_form');
const usernameInput = document.getElementById('username_input');
const passwordInput = document.getElementById('password_input');




form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = usernameInput.value.trim();
    const password = passwordInput.value.trim();


})
