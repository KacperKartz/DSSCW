

// Function to display generic error message
function genericMessage(isValid){

    // We handle the existing error message
    const existingError = document.querySelector("#login_error");
    if (existingError) {
        existingError.remove();
    }


    // If its valid return success
    if (isValid) {
        return "Success";
    } else {

        // we create an error message and insert it
        const error_msg = document.createElement("p");
        error_msg.id = "login_error";
        error_msg.textContent = "Incorrect Username or Password.";
        error_msg.classList.add("error");

        const loginBtn = document.querySelector("#login_btn");
        loginBtn.parentNode.insertBefore(error_msg, loginBtn);
        return "Failure";
    }
}


export {genericMessage};