const express = require('express');
const http = require('http');
const path = require('path');
const user = require('./routes/user');
const Database = require('./database/database');

const { v4: uuidV4, validate: uuidValidate, version: uuidVersion } = require('uuid');

const app = express();
const server = http.Server(app);
Database.connect();

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', './views');
app.set('view engine', 'ejs');

app.use('/api/user', user);

app.get('/', (req, res) => {
    res.render('index');
});
app.get('/signin', (req, res) => {
    res.render('signin');
});
app.get('/signup', (req, res) => {
    res.render('signup');
});
app.get('/user', (req, res) => {
    res.render('user');
});
app.get('/new', (req, res) => {
    res.redirect(`/room/${uuidV4()}`);
});
app.get('/room/:room', (req, res) => {
    if(uuidValidate(req.params.room) && uuidVersion(req.params.room) === 4) {
        res.render('room', { room: req.params.room });
    } else {
        res.render('404');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = server;