import { getUserData, signOut } from '/javascripts/user.js'
init();

function init() {
    getUserData(handleNotSignIn, handleSignIn);
    
    document.getElementById('avatar-file').addEventListener('change', () => {
        const files = document.getElementById('avatar-file').files;
        if (files) {
            document.getElementById('avatar-preview').setAttribute('src', URL.createObjectURL(files[0]));
            
            document.getElementById('upload-avatar').disabled = false;
            document.getElementById('upload-avatar').classList.remove('visually-hidden');
            document.getElementById('upload-avatar').addEventListener('click', uploadAvatar);
        }
    });

    document.getElementById('edit-name').addEventListener('click', editName);
    document.getElementById('edit-password').addEventListener('click', editPassword);
    document.getElementById('upload-avatar').addEventListener('click', uploadAvatar);
    document.getElementById('sign-out').addEventListener('click', signOut);
}

function handleNotSignIn() {
    location.replace('/');
}

function handleSignIn(result) {
    document.getElementById('avatar').setAttribute('src',
        'https://d11qg9ema8a24g.cloudfront.net/' + result.data.avatar + '?' + new Date().getTime()
    );
    document.getElementById('avatar-preview').setAttribute('src',
        'https://d11qg9ema8a24g.cloudfront.net/' + result.data.avatar + '?' + new Date().getTime()
    );
    document.getElementById('email').textContent = result.data.email;
    document.getElementById('name').textContent = result.data.name;

    /* When loading finished */
    document.getElementById('loading').style.display = 'none';
}

async function uploadAvatar() {
    document.getElementById('upload-avatar').disabled = true;

    let formData = new FormData();
    const email = document.getElementById('email');
    const avatar = document.getElementById('avatar-file');
    formData.append('email', email.textContent);
    formData.append('avatar', avatar.files[0]);

    if(avatar.files[0] === undefined) {
        const message = 'No file chosen.';
        handleAvatarValidation.error(message);
    } else {
        const requestOptions = {
            method: 'POST',
            body: formData
        };
        try {
            const response = await fetch('/api/user/avatar', requestOptions);
            const result = await response.json();
            if(result.data) {
                handleAvatarValidation.success(result);
            } else {
                const message = 'Failed to upload, please try again.';
                handleAvatarValidation.error(message);
            }
        } catch(err) {
            console.log(err);
        }
    }
}

function editName() {
    const name = document.getElementById('name').textContent;
    document.getElementById('name').innerHTML = '';
    
    /* Create input for editing name */
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.className = 'form-control';
    input.setAttribute('id', 'input-name');
    input.setAttribute('value', name);
    /* Create div to show result */
    const msg = document.createElement('div');
    msg.setAttribute('id', 'name-action-msg');
    msg.style.fontSize = '0.85rem';

    document.getElementById('name').append(input, msg);

    /* Create button for editing name */
    document.getElementById('edit-name').removeEventListener('click', editName);
    document.getElementById('name-action').innerHTML = '';

    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.classList.add('btn', 'btn-primary', 'btn-sm');
    button.setAttribute('id', 'change-name');
    button.disabled = true;
    button.textContent = 'Change';
    document.getElementById('name-action').appendChild(button);

    /* If input changed, enable button */
    document.getElementById('input-name').addEventListener('input', () => {
        document.getElementById('change-name').disabled = false;
        document.getElementById('change-name').addEventListener('click', changeName);
    });
}

async function changeName() {
    document.getElementById('input-name').disabled = true;
    document.getElementById('change-name').disabled = true;

    const name = document.getElementById('input-name').value;
    if(name === '') {
        const message = 'Input cannot be empty!';
        handleNameValidation.error(message);
    } else {
        const requestOptions = {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify ({
                name: name,
            })
        };
        try{
            const response = await fetch('/api/user/name', requestOptions);
            const result = await response.json();
            if(result.ok === true) {
                handleNameValidation.success();
            } else {
                handleNameValidation.error(result.message);
            }
        } catch(err) {
            console.log(err);
        }
    }
}

function editPassword() {
    document.getElementById('password').innerHTML = '';

    const div = document.createElement('div');
    div.setAttribute('id', 'input-password');
    
    /* Create input for editing password */
    const passwordInputList = [
        {
            id: 'input-old-password',
            placeholder: 'Old password'
        },
        {
            id: 'input-new-password',
            placeholder: 'New password'
        },
        {
            id: 'input-new-password-confirm',
            placeholder: 'Confirm new password'
        }
    ];
    passwordInputList.forEach((passwordInput) => {
        const input = document.createElement('input');
        input.setAttribute('type', 'password');
        input.className = 'form-control';
        input.setAttribute('id', passwordInput.id);
        input.setAttribute('placeholder', passwordInput.placeholder);
        div.appendChild(input);
    });
    /* Create div to show result */
    const msg = document.createElement('div');
    msg.setAttribute('id', 'password-action-msg');
    msg.style.fontSize = '0.85rem';

    document.getElementById('password').append(div, msg);

    /* Create button for editing password */
    document.getElementById('edit-password').removeEventListener('click', editPassword);
    document.getElementById('password-action').innerHTML = '';

    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.classList.add('btn', 'btn-primary', 'btn-sm');
    button.setAttribute('id', 'change-password');
    button.disabled = true;
    button.textContent = 'Change';
    document.getElementById('password-action').appendChild(button);

    /* If all input changed, enable button */
    document.getElementById('input-password').addEventListener('input', () => {
        if(
            document.getElementById('input-old-password').value !== ''
            && document.getElementById('input-new-password').value !== ''
            && document.getElementById('input-new-password-confirm').value !== ''
        ) {
            document.getElementById('change-password').disabled = false;
            document.getElementById('change-password').addEventListener('click', changePassword);                        
        }
    });
}

async function changePassword() {
    document.getElementById('input-password').querySelectorAll('input').forEach((input) => {
        input.disabled = true;
    });
    document.getElementById('change-password').disabled = true;

    const password = document.getElementById('input-old-password').value;
    const passwordNew = document.getElementById('input-new-password').value;
    const passwordNewConfirm = document.getElementById('input-new-password-confirm').value;

    if(password === '' || passwordNew === '' || passwordNewConfirm === '') {
        const message = 'Input cannot be empty!';
        handlePasswordValidation.error(message);
    } else if(password === passwordNew) {
        const message = 'New password is same as old password!';
        handlePasswordValidation.error(message);
    } else if(passwordNew !== passwordNewConfirm) {
        const message = 'Password confirmation does not match!';
        handlePasswordValidation.error(message);
    } else {
        const requestOptions = {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify ({
                password: password,
                passwordNew: passwordNew,
                passwordNewConfirm: passwordNewConfirm
            })
        };
        try{
            const response = await fetch('/api/user/password', requestOptions);
            const result = await response.json();
            if(result.ok === true) {
                handlePasswordValidation.success();
            } else {
                handlePasswordValidation.error(result.message);
            }
        } catch(err) {
            console.log(err);
        }
    }
}

const handleAvatarValidation = {
    success: function(result) {
        document.getElementById('avatar-action-msg').className = 'text-success';
        document.getElementById('avatar-action-msg').textContent = 'Uploaded successfully!';

        document.getElementById('avatar-file').value = '';

        /* Update avatar */
        document.getElementById('avatar-icon').setAttribute('src',
            'https://d11qg9ema8a24g.cloudfront.net/' + result.data.avatar + '?' + new Date().getTime()
        );
        document.getElementById('avatar').setAttribute('src',
            'https://d11qg9ema8a24g.cloudfront.net/' + result.data.avatar + '?' + new Date().getTime()
        );
        document.getElementById('avatar-preview').setAttribute('src',
            'https://d11qg9ema8a24g.cloudfront.net/' + result.data.avatar + '?' + new Date().getTime()
        );

        setTimeout(() => { document.getElementById('avatar-action-msg').textContent = ''; }, 1000);
    },

    error: function(message) {
        document.getElementById('avatar-action-msg').className = 'text-danger';
        document.getElementById('avatar-action-msg').textContent = message;
        document.getElementById('upload-avatar').disabled = false;
    }
}

const handleNameValidation = {
    success: function() {
        document.getElementById('name-action-msg').className = 'text-success';
        document.getElementById('name-action-msg').textContent = 'Changed successfully, refreshing...';

        setTimeout(() => { location.reload(); }, 1000);
    },

    error: function(message) {
        document.getElementById('name-action-msg').className = 'text-danger';
        document.getElementById('name-action-msg').textContent = message;

        document.getElementById('input-name').disabled = false;
        document.getElementById('change-name').disabled = false;
    }
};

const handlePasswordValidation = {
    success: function() {
        document.getElementById('password-action-msg').className = 'text-success';
        document.getElementById('password-action-msg').textContent = 'Changed successfully, refreshing...';

        setTimeout(() => { location.reload(); }, 1000);
    },

    error: function(message) {
        document.getElementById('password-action-msg').className = 'text-danger';
        document.getElementById('password-action-msg').textContent = message;
    
        document.getElementById('input-password').querySelectorAll('input').forEach((input) => {
            input.disabled = false;
        });
        document.getElementById('change-password').disabled = false;
    }
};