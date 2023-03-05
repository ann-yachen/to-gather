const server = require('./app.js');
const formatMessage = require('./lib/message');
const { createUser, getUser, updateUser, removeUser, getUsersInRoom } = require('./lib/user');
const { Server } = require('socket.io');

const io = new Server(server);

/* WebSocket server */
io.on('connection', (socket) => {
    /* Join room */
    socket.on('joinRoom', (room, userData) => {
        const user = createUser(socket.id, room, userData);

        socket.join(user.room);

        socket.emit('updateUserId', user.id);
        socket.to(user.room).emit('message', formatMessage('system', `${user.name} has joined the room`));
        
        const roomUsers = getUsersInRoom(user.room);
        io.to(user.room).emit('roomUsers', roomUsers);
    });

    /* Update status after getUserMedia  */
    socket.on('updateStream', (param, value) => {
        const user = updateUser(socket.id, param, value);
    });

    /* Update peer id */
    socket.on('updatePeer', (id) => {
        const user = updateUser(socket.id, 'peer', id);

        if(user) {
            socket.to(user.room).emit('peerConnect', user);
        }
    });

    /* Toggle audio or video */
    socket.on('toggleStream', (param, value) => {
        const user = updateUser(socket.id, param, value);

        if(user) {
            io.to(user.room).emit('updatePeerStream', user.peer, param, user[param]);

            const roomUsers = getUsersInRoom(user.room);
            io.to(user.room).emit('roomUsers', roomUsers);
        }
    });

    /* Texting message */
    socket.on('textMessage', (message) => {
        const user = getUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(user.name, message));
        }
    });

    /* Whiteboard drawing */
    socket.on('drawing', (data) => {
        const user = getUser(socket.id);

        if(user) {
            socket.to(user.room).emit('drawing', data);
        }
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        
        if(user) {
            io.to(user.room).emit('message', formatMessage('system', `${user.name} has left the room`));

            socket.to(user.room).emit('peerDisconnect', user.peer, user.id);

            const roomUsers = getUsersInRoom(user.room);
            io.to(user.room).emit('roomUsers', roomUsers);
        }
    });
});