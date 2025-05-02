const form = document.getElementById('mfa_form');
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

    if (res.ok) {
        sessionStorage.removeItem('email');
        window.location.href = '/';
    } else {
        alert(data.error || 'Incorrect code');
    }
});
