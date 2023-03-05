const User = require('../models/userModel');
const dotenv = require('dotenv');
dotenv.config();

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
const expiresIn = 604800 * 1000; // Expire after 7 days

async function getUserData(req, res) {
    if(req.cookies.token) {
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        if(decoded.email) {
            try {
                const user = await User.findOne({ email: decoded.email });
                if(user) {
                    const userData = {
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar
                    }
                    res.status(200).json({ data: userData });
                } else {
                    res.status(400).json({ error: true, message: 'User does not exist.' });
                }
            } catch(err) {
                res.status(500).json({ error: true, message: err });
            }          
        } else {
            res.status(200).json({ data: null }); // No sign-in
        }
    } else {
        res.status(200).json({ data: null }); // No sign-in
    }
}

async function signIn(req, res) {
    if(!req.body.email || !req.body.password) {
        res.status(400).json({ error: true, message: 'Input cannot be empty.' });
    } else {
        try {
            const user = await User.findOne({ email: req.body.email });
            if(!user) {
                res.status(400).json({ error: true, message: 'Email or password is incorrect.' });
            } else {
                const passwordMatched = await bcrypt.compare(req.body.password, user.password);
                if(passwordMatched) {
                    const token = jwt.sign({ email: req.body.email }, process.env.TOKEN_SECRET, { expiresIn: '7d' });
                    res.cookie('token', token, {
                        maxAge: expiresIn,
                        httpOnly: true,
                    });
                    res.status(200).json({ ok: true });
                } else {
                    res.status(400).json({ error: true, message: 'Email or password is incorrect.' });
                }
            }
        } catch(err) {
            res.status(500).json({ error: true, message: err });
        }
    }
}

async function signOut(req, res) {
    res.clearCookie('token').json({ ok: true });
}

module.exports = {
    getUserData,
    signIn,
    signOut
};