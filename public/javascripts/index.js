import { getUserData } from '/javascripts/user.js';

const joinMeetingLink = document.getElementById('join-meeting');

function init() {
    getUserData(handleNotSignIn, handleSignIn);
}

function handleNotSignIn() {
    document.getElementById('start-meeting').setAttribute('href', '/signin');

    joinMeetingLink.setAttribute('href', '/signin');
}

function handleSignIn() {
    document.getElementById('start-meeting').setAttribute('href', '/new');

    const meetingCode = document.getElementById('meeting-code');
    joinMeetingLink.addEventListener('click', () => {
        if(meetingCode.value !== '') {
            joinMeetingLink.setAttribute('href', '/room/' + meetingCode.value);
        }
    });
}

export { init };