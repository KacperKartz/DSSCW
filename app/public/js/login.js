const form = document.getElementById('login_form');
const usernameInput = document.getElementById('username_input');
const passwordInput = document.getElementById('password_input');




form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if(!email || !password){
        alert('Please enter both email and password');
    }else{
        try{

           const response = await fetch('/validateLogin', {
                method: 'POST',
                body: JSON.stringify({email, password}),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

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


