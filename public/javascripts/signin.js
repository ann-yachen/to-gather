import { getUserData, signIn } from '/javascripts/user.js';

function init() {
    getUserData(handleNotSignIn, handleSignIn);
}

function handleNotSignIn() {
    document.getElementById('sign-in').addEventListener('click', signIn);
    document.getElementById('signin-form').querySelectorAll('input').forEach((input) => {
        input.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') {
                e.preventDefault();
                signIn();
            }
        });
    });
}
function handleSignIn() {
    document.querySelector('.alert').innerHTML = '';
    document.querySelector('.alert').classList.add('alert-success');

    const i = document.createElement('i');
    i.classList.add('bi', 'bi-check-circle-fill', 'me-2');
    const div = document.createElement('div');
    div.textContent = 'Have signed in, redirecting...';
    document.querySelector('.alert').append(i, div);

    setTimeout(() => { 
        if(document.referrer === '' || document.referrer.includes('signup')) {
            location.replace('/');
        } else {
            location.replace(document.referrer);
        }
    }, 1000);
}

export { init };