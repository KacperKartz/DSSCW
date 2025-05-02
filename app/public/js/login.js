const form = document.getElementById('login_form');
const usernameInput = document.getElementById('username_input');
const passwordInput = document.getElementById('password_input');



/// Good ol' login stuff.


form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Could make it do some more checks to be fair
    if(!email || !password){
        alert('Please enter both email and password');
    }else{
        try{
            // throws the email and password to the server 
           const response = await fetch('/validateLogin', {
                method: 'POST',
                body: JSON.stringify({email, password}),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            // If the server likes it then it sends back a 200 and we can move on
            // And it uses the sessionStorage to store the email (temporarily) and yeah that's it
            // (it wasn't it) it redirects to mfa page
            if(response.ok){
               /// Correct login
               console.log(data.email);
               sessionStorage.setItem('email', data.email);
                window.location.href = '/mfaPage';
            }
            else{
                alert(data.error);
            }



        }catch(e){
            
        }

    }
})


