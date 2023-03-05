const users = [];

function createUser(id, room, userData) {
    const user = userData;
    user.id = id;
    user.room = room;
    users.push(user);
    return user;
}

function getUser(id) {
    const user = users.find((user) => {
        return user.id === id;
    });
    return user;
}

function updateUser(id, param, value) {
    const index = users.findIndex((user) => {
        return user.id === id;
    });

    if(index !== -1) {
        users[index][param] = value;
        return users[index];
    }
}

function removeUser(id) {
    const index = users.findIndex((user) => {
        return user.id === id;
    });
    if(index !== -1) {
        return users.splice(index, 1)[0];
    }
}

function getUsersInRoom(room) {
    const roomUsers = users.filter((user) => {
        return user.room === room;
    });
    return roomUsers;
}

module.exports = {
    createUser,
    getUser,
    updateUser,
    removeUser,
    getUsersInRoom
}
