// Function to add username in top right corner of every page after user has logged in
async function displayUsername() {
    try {
        const res = await fetch('/api/user');
        const data = await res.json();

        if (data.username) {
            document.querySelector("#login_link").textContent = data.username;
        } else {
            document.querySelector("#login_link").textContent = "Not logged in";
        }
    } catch (err) {
        console.error('Error fetching username:', err);
    }
}

displayUsername();