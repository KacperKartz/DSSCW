const form = document.getElementById('mfa_form');


// Basically the same thing as login but different 
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const code = document.getElementById('mfa_input').value;
    const email = sessionStorage.getItem('email');


    const res = await fetch('/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mfaUserCode: code })
    });

    const data = await res.json();
    // If the server likes it then it sends back a 200
    // Despite liking it, We do infact part ways with the email on the client side. (idk if this is right or not but hey it works)
    if (res.ok) {
        sessionStorage.removeItem('email');
        window.location.href = '/';
    } else {
        alert(data.error || 'Incorrect code');
    }
});
