const express = require('express');
const user = express.Router();

const cookieParser = require('cookie-parser');
user.use(cookieParser());

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { signUp, uploadAvatar, changeName, changePassword } = require('../controllers/userController');
const { getUserData, signIn, signOut } = require('../controllers/authController');

user.post('/', express.json(), signUp);
user.post('/avatar', upload.single('avatar'), uploadAvatar);
user.patch('/name', express.json(), changeName);
user.patch('/password', express.json(), changePassword);

user.get('/auth', getUserData);
user.put('/auth', express.json(), signIn);
user.delete('/auth', signOut);

module.exports = user;