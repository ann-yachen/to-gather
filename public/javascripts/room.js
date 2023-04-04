const userData = {};

let localStream = new MediaStream;
const connectedPeers = {};

const micBtn = document.getElementById('mic-btn');
const cameraBtn = document.getElementById('camera-btn');
const leaveBtn = document.getElementById('leave-btn');

const textForm = document.getElementById('text-form');

const socket = io();
init();

socket.on('roomUsers', (roomUsers) => {
    showUserList(roomUsers);
});

socket.on('updatePeerStream', (peer, param, value) => {
    if(param === 'audio') {
        switch(value){
            case true:
                document.getElementById(`${peer}-audio`).setAttribute('style', 'display: none;');
                break;
            case false:
                document.getElementById(`${peer}-audio`).setAttribute('style', 'display: flex;');
                break;
        }
    }
    if(param === 'video') {
        switch(value){
            case true:
                document.getElementById(`${peer}`).style.display = 'block';
                break;
            case false:
                document.getElementById(`${peer}`).style.display = 'none';
                break;
        }
    }
});

socket.on('peerDisconnect', (peer, id) => {
    if (connectedPeers[peer]) {
        connectedPeers[peer].close(); // Close peer
        delete connectedPeers[peer];

        const video = document.getElementById(peer);
        video.remove(); // Remove video

        const videoContainer = document.getElementById(id);
        videoContainer.remove();

        resizeVideoContainer();
    }
});

socket.on('message', (message) => {
    showMessage(message);
});

async function init() {
    /* Get user data then join the room */
    try {
        const response = await fetch('/api/user/auth');
        const result = await response.json();
        if(result.data !== null) {
            userData.name = result.data.name;
            userData.avatar = result.data.avatar;

            startVideoCall();

            /* For texting message */
            textForm.addEventListener('submit', (e) => {
                e.preventDefault();
                sendTextMessage();
            });
        } else {
            location.href = '/signin';
        }
    } catch(err) {
        console.log(err);
    }
}

// ###################################################
// VIDEO CALL
// ###################################################

function createVideo(video, stream, user) {
    video.classList.add('position-absolute', 'bottom-0', 'start-0');
    video.setAttribute('id', user.peer);
    video.setAttribute('style', 'display: block;');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    return video;
}

function createVideoContainer(user) {
    const div = document.createElement('div');
    div.classList.add('video-container', 'position-relative', 'bg-dark');
    div.setAttribute('id', user.id);

    const avatar = document.createElement('div');
    avatar.className = 'video-container-avatar';
    avatar.setAttribute('id', `${user.id}-avatar`);

    const img = document.createElement('img');
    let src = 'https://d11qg9ema8a24g.cloudfront.net/person-fill.svg';
    if(user.avatar !== undefined) {
        src = `https://d11qg9ema8a24g.cloudfront.net/${user.avatar}`;
    }
    img.setAttribute('src', src);
    avatar.appendChild(img);

    const audio = document.createElement('div');
    audio.classList.add('video-container-mic', 'position-absolute', 'top-0', 'end-0', 'rounded-circle', 'bg-secondary', 'm-2');
    audio.setAttribute('id', `${user.peer}-audio`);
    audio.innerHTML = `<i class="bi bi-mic-mute-fill"></i>`;
    if(user.audio === true) {
        audio.setAttribute('style', 'display: none');
    }
    
    const name = document.createElement('div');
    name.classList.add('position-absolute', 'bottom-0', 'start-0', 'p-3');
    if(user.id) {
        name.setAttribute('id', `${user.id}-name`);
    }
    name.setAttribute('style', 'z-index: 100;');
    name.textContent = user.name;

    div.append(avatar, name, audio);
    return div;
}

function resizeVideoContainer() {
    const containers = document.querySelectorAll('.video-container');
    if(containers.length > 9 && containers.length <= 20) {
        containers.forEach((div) => {
            div.style.width = '17%';
            div.style.height = '20%';
        });
    } else if (containers.length > 20) {
        containers.forEach((div) => {
            div.style.width = '15%';
            div.style.height = '20%';
        });
    } else {
        containers.forEach((div) => {
            div.removeAttribute('style');
        });
    }
}

async function startVideoCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true, echoCancellation: true });
        userData.audio = true;
        userData.video = true;

        /* For peer connect */
        const peer = new Peer(); // Create peer object
        peer.on('open', (id) => {
            userData.peer = id;

            /* Join room */
            socket.emit('joinRoom', ROOM, userData);

            /* Get socket id */
            socket.on('updateUserId', (id) => {
                userData.id = id;
            });

            /* Create local video and container */
            const video = document.createElement('video');
            const localVideo = createVideo(video, localStream, userData);
            localVideo.muted = true;

            const localVideoContainer = createVideoContainer(userData);
            localVideoContainer.appendChild(localVideo);
            document.getElementById('videos').appendChild(localVideoContainer);

            /* Add eventlistener for controls */
            micBtn.addEventListener('click', toggleMic);
            cameraBtn.addEventListener('click', toggleCamera);
            leaveBtn.addEventListener('click', () => { location.href='/'; });

            /* When loading finished */
            document.getElementById('loading').style.display = 'none';
        });

        socket.on('peerConnect', (user) => {
            const call = peer.call(user.peer, localStream, { metadata: userData });

            const video = document.createElement('video');
            const remoteContainer = createVideoContainer(user);
            call.on('stream', (remoteStream) => {
                if(!connectedPeers[user.peer]) {
                    if(document.getElementsByClassName('video-container').length > 9) {

                        const div = document.createElement('div');
                        div.classList.add('video-container', 'position-relative', 'bg-dark');                        
                    }
                    
                    const video = document.createElement('video');
                    const remoteContainer = createVideoContainer(user);

                    /* Create remote video container then render */
                    const remoteVideo = createVideo(video, remoteStream, user);
                    remoteContainer.appendChild(remoteVideo);

                    document.getElementById('videos').appendChild(remoteContainer);

                    connectedPeers[user.peer] = call; // Record calls owned by each peer

                    resizeVideoContainer();
                }
            });
        });

        peer.on('call', (call) => {
            call.answer(localStream);

            const video = document.createElement('video');
            const remoteContainer = createVideoContainer(call.metadata);
            call.on('stream', (remoteStream) => {
                if(!connectedPeers[call.peer]) {
                    /* Create remote video container then render */
                    const remoteVideo = createVideo(video, remoteStream, call.metadata);
                    if(call.metadata.video === true) {
                        remoteVideo.setAttribute('style', 'display: block;');
                    } else {
                        remoteVideo.setAttribute('style', 'display: none;');
                    }
                    remoteContainer.appendChild(remoteVideo);
                    document.getElementById('videos').appendChild(remoteContainer);
                    
                    connectedPeers[call.peer] = call;

                    resizeVideoContainer();
                }
            });
        });
    } catch(err) {
        document.getElementById('loading').innerHTML = `<div><h3>Cannot Get Your Stream</h3>
        <div>Please check your device then try again</div></div>`;
    }
}

function toggleMic() {
    let audiolTracks = localStream.getAudioTracks();
    if(audiolTracks[0].enabled === true) {
        audiolTracks.forEach((track) => track.enabled = false);
        userData.audio = false;
        socket.emit('toggleStream', 'audio', false);

        micBtn.classList.remove('btn-secondary');
        micBtn.classList.add('btn-danger');
        micBtn.innerHTML = `<i class="bi bi-mic-mute-fill"></i>`;
    } else {
        audiolTracks.forEach((track) => track.enabled = true);
        userData.audio = true;
        socket.emit('toggleStream', 'audio', true);

        micBtn.classList.remove('btn-danger');
        micBtn.classList.add('btn-secondary');
        micBtn.innerHTML = `<i class="bi bi-mic-fill"></i>`;
    }
}

function toggleCamera() {
    let videolTracks = localStream.getVideoTracks();
    if(videolTracks[0].enabled === true) {
        videolTracks.forEach((track) => track.enabled = false);
        userData.video = false;
        socket.emit('toggleStream', 'video', false);

        cameraBtn.classList.remove('btn-secondary');
        cameraBtn.classList.add('btn-danger');
        cameraBtn.innerHTML = `<i class="bi bi-camera-video-off-fill"></i>`;
    } else {
        videolTracks.forEach((track) => track.enabled = true);
        userData.video = true;
        socket.emit('toggleStream', 'video', true);

        cameraBtn.classList.remove('btn-danger');
        cameraBtn.classList.add('btn-secondary');
        cameraBtn.innerHTML = `<i class="bi bi-camera-video-fill"></i>`;
    }
}