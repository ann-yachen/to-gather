async function signUp () {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    document.getElementById('sign-up').disabled = true;

    if(name === '' || email === '' || password === '') {
        const message = 'Input cannot be empty!';
        handleValidation.error(message);

        document.getElementById('sign-up').disabled = false;
    } else {
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify ({
                name: name,
                email: email,
                password: password
            })
        };
        try{
            const response = await fetch('/api/user', requestOptions);
            const result = await response.json();
    
            if(result.ok === true) {
                handleValidation.success();

                setTimeout(() => { location.replace('/'); }, 1000);
            } else {
                handleValidation.error(result.message);

                document.getElementById('sign-up').disabled = false;
            }
        } catch(err) {
            console.log(err);
        }
    }


}

async function getUserData(handleNotSignIn, handleSignIn){
    try {
        const response = await fetch('/api/user/auth');
        const result = await response.json();

        if(result.data === null) {
            /* If header exists */
            if(document.querySelector('header')) {
                document.getElementById('nav-user').innerHTML = '';

                const a = document.createElement('a');
                a.classList.add('btn', 'btn-outline-secondary', 'border-0');
                a.setAttribute('href', '/signin');
                a.setAttribute('role', 'button');
                a.textContent = 'Sign in';
                document.getElementById('nav-user').appendChild(a);

                document.getElementById('nav-start-meeting').setAttribute('href', '/signin');                
            }

            if(handleNotSignIn !== undefined) {
                handleNotSignIn();                    
            }
        } else {
            /* If header exists */
            if(document.querySelector('header')) {
                document.getElementById('nav-user').classList.add('dropdown');
                document.getElementById('avatar-icon').setAttribute('src',
                    'https://d11qg9ema8a24g.cloudfront.net/' + result.data.avatar + '?' + new Date().getTime()
                );
                document.getElementById('avatar-icon').className = 'border';
                document.getElementById('nav-dropdown-signout').addEventListener('click', signOut);

                document.getElementById('nav-start-meeting').setAttribute('href', '/new');                
            }

            if(handleSignIn !== undefined) {
                handleSignIn(result);
            }
        }
    } catch(err) {
        console.log(err);
    }
}

async function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    document.getElementById('sign-in').disabled = true;

    if(email === '' || password === '') {
        const message = 'Input cannot be empty!';
        handleValidation.error(message);

        document.getElementById('sign-in').disabled = false;
    } else {
        const requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify ({
                email: email,
                password: password
            })
        };
        try {
            const response = await fetch('/api/user/auth', requestOptions);
            const result = await response.json();
    
            if(result.ok === true ){
                handleValidation.success();

                setTimeout(() => { 
                    if(document.referrer === '' || document.referrer.includes('signup')) {
                        location.replace('/');
                    } else {
                        location.replace(document.referrer);
                    }
                }, 1000);
            } else {
                handleValidation.error(result.message);

                document.getElementById('sign-in').disabled = false;
            }
        } catch(err) {
            console.log(err);
        }        
    }
}

async function signOut() {
    const requestOptions = { method: 'DELETE' };
    try {
        const response = await fetch('/api/user/auth', requestOptions);
        const result = await response.json();
        if(result.ok === true) {
            location.href = '/';
        } else {
            console.log(result.message);
        }
    } catch(err) {
        console.log(err);
    }
}

const handleValidation = {
    success: function() {
        document.querySelector('.alert').innerHTML = '';
        document.querySelector('.alert').classList.remove('alert-danger');
        document.querySelector('.alert').classList.add('alert-success');

        const i = document.createElement('i');
        i.classList.add('bi', 'bi-check-circle-fill', 'me-2');
        const div = document.createElement('div');
        div.textContent = 'Signed in successfully, redirecting...';
        document.querySelector('.alert').append(i, div);
    },

    error: function(message) {
        document.querySelector('.alert').innerHTML = '';
        document.querySelector('.alert').classList.remove('alert-success');
        document.querySelector('.alert').classList.add('alert-danger');

        const i = document.createElement('i');
        i.classList.add('bi', 'bi-exclamation-triangle-fill', 'me-2');
        const div = document.createElement('div');
        div.textContent = message;
        document.querySelector('.alert').append(i, div);
    }
}

export {
    signUp,
    getUserData,
    signIn,
    signOut
};