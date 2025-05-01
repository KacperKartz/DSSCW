// Function to add username in top right corner of every page after user has logged in
async function displayUsername() {
    const response = await fetch("/api/user");
    const user_data = await response.json();

    document.querySelector("#login_link").textContent = user_data.nickname;
}

document.addEventListener("DOMContentLoaded", displayUsername);