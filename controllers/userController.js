const User = require('../models/userModel');

const { v4: uuidV4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

const bcrypt = require('bcrypt');
const saltRounds = 10;

const jwt = require('jsonwebtoken');
const expiresIn = 604800 * 1000; // Expire after 7 days

const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');


async function signUp(req, res) {
    if(!req.body.name || !req.body.email || !req.body.password) {
        res.status(400).json({ error: true, message: 'Input cannot be empty.' });
    } else {
        try{
            const user = await User.findOne({ email: req.body.email });
            if(user) {
                res.status(400).json({ error: true, message: 'Email has been registered.' });
            } else {
                const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
                const newUser = new User({
                    id: uuidV4(),
                    name: req.body.name,
                    email: req.body.email,
                    password: hashedPassword,
                    avatar: 'person-fill.svg'
                });
                await newUser.save();
                
                const token = jwt.sign({ email: req.body.email }, process.env.TOKEN_SECRET, { expiresIn: '7d' });
                res.cookie('token', token, {
                    maxAge: expiresIn,
                    httpOnly: true,
                });
                
                res.status(200).json({ ok: true });
            }
        } catch(err) {
            res.status(500).json({ error: true, message: err });
        }        
    }
}

/* For S3Client */
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey
    },
    region: bucketRegion
});

/* Create image name by random creating for S3 storage */
const randomImageName = () => crypto.randomBytes(32).toString('hex'); // Bytes = 32

async function uploadAvatar(req, res) {
    if(req.cookies.token && req.file !== undefined){
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        if(decoded.email) {
            try {
                const user = await User.findOne({ email: decoded.email });
                if(user) {
                    let avatar = user.avatar;
                    if(user.avatar === 'person-fill.svg') {
                        avatar = randomImageName(); // Create random image name for 1st avatar uploading
                    }
                    /* Send to S3 */
                    const params = {
                        Bucket: bucketName,
                        Key: avatar,
                        Body: req.file.buffer, // Store in multer buffer
                        ContentType: req.file.mimetype
                    };
                    const command = new PutObjectCommand(params);
                    try {
                        await s3.send(command);
                        const user = await User.findOneAndUpdate({ email: req.body.email }, { avatar: avatar }, { new: true });
                        const data = { avatar: user.avatar };
                        res.status(200).json({ data: data });
                    } catch(err) {
                        console.log('S3: ', err);
                        res.status(500).json({ error: true, message: err });
                    }
                } else {
                    res.status(400).json({ error: true, message: 'User does not exist.' });
                }
            } catch(err) {
                console.log('Mongoose: ', err);
                res.status(500).json({ error: true, message: err });
            }            
        } else {
            res.status(403).json({ error: true, message: 'Access denied.' }); // No sign-in
        }
    } else {
        res.status(403).json({ error: true, message: 'Access denied.' }); // No sign-in
    }
};

async function changeName(req, res) {
    if(req.cookies.token){
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        if(decoded.email) {
            try {
                const user = await User.findOne({ email: decoded.email });
                if(user) {
                    user.name = req.body.name;
                    await user.save();
                    res.status(200).json({ ok: true });
                } else {
                    res.status(400).json({ error: true, message: 'User does not exist.' });
                }
            } catch(err) {
                res.status(500).json({ error: true, message: err });
            }
        } else {
            res.status(403).json({ error: true, message: 'Access denied.' }); // No sign-in
        }
    } else {
        res.status(403).json({ error: true, message: 'Access denied.' }); // No sign-in
    }
}

async function changePassword(req, res) {
    if(req.cookies.token){
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        if(decoded.email) {
            try {
                const user = await User.findOne({ email: decoded.email });
                if(user) {
                    const passwordMatched = await bcrypt.compare(req.body.password, user.password);
                    if(passwordMatched && req.body.passwordNew === req.body.passwordNewConfirm) {
                        const hashedPassword = await bcrypt.hash(req.body.passwordNew, saltRounds);
                        user.password = hashedPassword;
                        await user.save();
                        res.status(200).json({ ok: true });
                    } else {
                        res.status(400).json({ error: true, message: 'Password is incorrect.' });
                    }
                } else {
                    res.status(400).json({ error: true, message: 'User does not exist.' });
                }
            } catch(err) {
                res.status(500).json({ error: true, message: err });
            }
        } else {
            res.status(403).json({ error: true, message: 'Access denied.' }); // No sign-in
        }
    } else {
        res.status(403).json({ error: true, message: 'Access denied.' }); // No sign-in
    }
}

module.exports = {
    signUp,
    uploadAvatar,
    changeName,
    changePassword
};