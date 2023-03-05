// ###################################################
// USER
// ###################################################

function showUserList(roomUsers) {
    users.innerHTML = '';

    const fragment = document.createDocumentFragment();

    roomUsers.forEach((user) => {
        const div = document.createElement('div');
        div.classList.add('d-flex', 'align-items-center', 'my-2');
        
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        const img = document.createElement('img');
        let src = 'https://d11qg9ema8a24g.cloudfront.net/person-fill.svg';
        if(user.avatar !== undefined) {
            src = `https://d11qg9ema8a24g.cloudfront.net/${user.avatar}`;
        }
        img.setAttribute('src', src);
        avatar.appendChild(img);

        const name = document.createElement('div');
        name.classList.add('flex-grow-1', 'px-4');
        name.textContent = user.name;

        const audio = document.createElement('div');
        audio.className = 'px-4';
        if(user.audio === false) {
            audio.innerHTML = `<i class="bi bi-mic-mute-fill"></i>`;
        }
        div.append(avatar, name, audio);
        fragment.appendChild(div);
    });

    document.getElementById('users').appendChild(fragment);
    document.getElementById('user-count').textContent = roomUsers.length; // Show user count
}

// ###################################################
// TEXTING MESSAGE
// ###################################################

function sendTextMessage() {
    const message = document.getElementById('text-msg').value;
    socket.emit('textMessage', message);

    document.getElementById('text-msg').value = '';
}

function showMessage(message) {
    console.log(message);

    if(message.name === 'system') { // Show user join or leave
        document.getElementById('user-message').textContent = message.text;
        const toastNode = document.querySelector('.toast');
        const userStatusToast = new bootstrap.Toast(toastNode);

        userStatusToast.show();
    } else {
        const div = document.createElement('div');
        div.className = 'text-message';

        const header = document.createElement('div');
        const name = document.createElement('span');
        name.textContent = message.name;
        const time = document.createElement('span');
        time.classList.add('text-message-time', 'text-secondary', 'mx-2', 'text-uppercase');
        time.textContent = message.time;
        header.append(name, time);

        const p = document.createElement('p');
        p.textContent = message.text;

        div.append(header, p);

        document.getElementById('text-messages').appendChild(div);        
    }
}

// ###################################################
// WHITEBOARD
// ###################################################

const canvas = document.querySelector('.whiteboard');
const ctx = canvas.getContext('2d');

const current = { color: 'black' };
let isDrawing = false;

canvas.addEventListener('mousedown', mouseDown);
canvas.addEventListener('mousemove', throttle(mouseMove, 10));
canvas.addEventListener('mouseup', mouseUp);
canvas.addEventListener('mouseout', mouseUp);

/* For mobile */
canvas.addEventListener('touchstart', mouseDown);
canvas.addEventListener('touchmove', throttle(mouseMove, 10));
canvas.addEventListener('touchend', mouseUp);
canvas.addEventListener('touchcancel', mouseUp);

/* Choose color */
document.querySelectorAll('.color').forEach((color) => {
    color.addEventListener('click', changeColor);
});

/* Listen to drawing event */
socket.on('drawing', drawing);

function drawLine(x0, y0, x1, y1, color, emit) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    if(color === 'white') { // For eraser
        ctx.lineWidth = 10;        
    } else {
        ctx.lineWidth = 2;        
    }
    ctx.stroke();
    ctx.closePath();

    if(emit) {
        socket.emit('drawing', { x0: x0, y0: y0, x1: x1, y1: y1, color: color });
    }
}

function mouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    scaleX = canvas.width / rect.width;
    scaleY = canvas.height / rect.height;

    current.x = e.offsetX * scaleX;
    current.y = e.offsetY * scaleY;

    isDrawing = true;
}

function mouseMove(e) {
    if(isDrawing) {
        const rect = canvas.getBoundingClientRect();
        scaleX = canvas.width / rect.width;
        scaleY = canvas.height / rect.height;

        drawLine(
            current.x,
            current.y,
            (e.offsetX || e.touches[0].clientX) * scaleX,
            (e.offsetY || e.touches[0].clientY) * scaleY,
            current.color,
            true
        );
        current.x = (e.offsetX || e.touches[0].clientX) * scaleX;
        current.y = (e.offsetY || e.touches[0].clientY) * scaleY;
    }
}

function mouseUp(e) {
    if(isDrawing) {
        const rect = canvas.getBoundingClientRect();
        scaleX = canvas.width / rect.width;
        scaleY = canvas.height / rect.height;

        drawLine(
            current.x,
            current.y,
            (e.offsetX || e.touches[0].clientX) * scaleX,
            (e.offsetY || e.touches[0].clientY) * scaleY,
            current.color,
            true
        );
        isDrawing = false;
    }
}

function changeColor(e) {
    current.color = e.target.className.split(' ')[1];
}

/* Prevent too many events per second */
function throttle(callback, delay) {
    let previousTime = 0;
  
    return (...args) => {
      const nowTime = new Date().getTime();
      if((nowTime - previousTime) >= delay) {
            callback.apply(this, args);
            previousTime = nowTime;
        };
    };
}

function drawing(data) {
    drawLine(data.x0, data.y0, data.x1, data.y1, data.color);
}