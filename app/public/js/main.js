// Function to add username in top right corner of every page after user has logged in
async function displayUsername() {
    const response = await fetch("../json/login_attempt.json");
    const user_data = await response.json();

    document.querySelector("#login_link").textContent = user_data.username;
}

displayUsername();