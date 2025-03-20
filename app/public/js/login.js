// Update error message based on login attempt
async function checkLoginAttempts() {
    const response = await fetch("../json/login_attempt.json");
    const form_data = await response.json();

    // Inform user they need to fill out the fields on the login form
    if(form_data.username === "null" || form_data.password === "null") {
        document.getElementById("login_error").parentNode.removeChild(document.getElementById("login_error"));
    }
    if(form_data.username === "" || form_data.password === "") {
        if(document.getElementById("login_error") !== null) {
            document.getElementById("login_error").parentNode.removeChild(document.getElementById("login_error"));
        }

        let error_msg = document.createElement("p");
        error_msg.id = "login_error";
        error_msg.textContent = "Please fill out the login fields.";
        error_msg.classList.add("error");
        document.querySelector("#login_btn").parentNode.insertBefore(error_msg, document.querySelector("#login_btn"));

    } else if(form_data.username !== "username") { // Inform user they have entered the incorrect username
        if(document.getElementById("login_error") !== null) {
            document.getElementById("login_error").parentNode.removeChild(document.getElementById("login_error"));
        }

        let error_msg = document.createElement("p");
        error_msg.id = "login_error";
        error_msg.textContent = "Incorrect username.";
        error_msg.classList.add("error");
        document.querySelector("#login_btn").parentNode.insertBefore(error_msg, document.querySelector("#login_btn"));

    } else if(form_data.password !== "password") { // Inform user they have entered the incorrect password

        if(document.getElementById("login_error") !== null) {
            document.getElementById("login_error").parentNode.removeChild(document.getElementById("login_error"));
        }

        let error_msg = document.createElement("p");
        error_msg.id = "login_error";
        error_msg.textContent = "Incorrect password.";
        error_msg.classList.add("error");
        document.querySelector("#login_btn").parentNode.insertBefore(error_msg, document.querySelector("#login_btn"));

    } else {
        if(document.getElementById("login_error") !== null) {
            document.getElementById("login_error").parentNode.removeChild(document.getElementById("login_error"));
        }
    }
}

checkLoginAttempts();
