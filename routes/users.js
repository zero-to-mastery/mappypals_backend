const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const asyncMod = require('async');
const nodemailer = require('nodemailer');
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const User = require('../models/User');

const bcrypt = require('bcryptjs');
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Load validator
const validateRegisterInput = require('../validator/register');
const validateResetPasswordInput = require('../validator/resetPassword');

//Google Imports
/* const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
    process.env.CLIENT_ID, // ClientID
    process.env.CLIENT_SECRET, // Client Secret
    "https://developers.google.com/oauthplayground" // Redirect URL
);

oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

const tokens = oauth2Client.getRequestHeaders()  */

// Register Routes
router.post('/register', (req, res) => {
    const { errors, isValid } = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

    User.findOne({ email }).then(user => {
        if (user) {
            console.log('User already registered');
        } else {
            asyncMod.waterfall([
                done => {
                    crypto.randomBytes(20, (err, code) => {
                        let token = code.toString('hex');
                        done(err, token);
                    });
                },

                async (token, done) => {
                    const newUser = new User({
                        name,
                        lastname,
                        email,
                        password,
                        token,
                        tokenExp: Date.now() + 3600000,
                    });

router.post('/register', (req, res) => {
    const { errors, isValid } = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }
    
    User.findOne ({ email }).then(user => {
        if(user) {
            console.log("User already registered");
        }
        else {
            const newUser = new User({
                name,
                lastname,
                email,
                password
            });

                    let testAccount = await nodemailer.createTestAccount();

                    let transporter = await nodemailer.createTransport({
                        host: 'smtp.ethereal.email',
                        port: 587,
                        secure: false, // true for 465, false for other ports
                        auth: {
                            user: testAccount.user, // generated ethereal user
                            pass: testAccount.pass, // generated ethereal password
                        },
                    });

                    let info = await transporter.sendMail({
                        from: 'mappypals@gmail.com',
                        to: newUser.email,
                        subject: 'Confirm Registration',
                        text:
                            'You are receiving this because you(or someone else) have requested to register to Mappypals.\n\n' +
                            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                            'http://localhost:3000/login/' +
                            token +
                            '\n\n' +
                            'If you did not request this, please ignore this email and your account will not be created.\n',
                    });

                    console.log(
                        'Preview URL: %s',
                        nodemailer.getTestMessageUrl(info)
                    );
                    res.status(200).json({
                        message: 'Click on the link below',
                        link: nodemailer.getTestMessageUrl(info),
                    });


                    bcrypt.genSalt(10, (err, salt) => {
                        if (err) {
                            console.log(`Bcrypt genSalt error: ${err}`);
                        } else {
                            bcrypt.hash(newUser.password, salt, (err, hash) => {
                                if (err) {
                                    console.log(`Bcrypt error: ${err}`);
                                } else {
                                    newUser.password = hash;
                                    newUser
                                        .save()
                                        .then(user => {
                                            console.log(
                                                `Successfully registered ${user}`
                                            );
                                        })
                                        .catch(err => console.log(err));
                                }
                            });
                        }
                    });
                },
            ]);
        }
    });
});

// Login Routes
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res
                .status(401)
                .json({ error: 'Something went wrong.', user });
        }

        if (!user.active) {
            return res.status(401).json({
                error: 'Please confirm your account before logging in.',
            });
        }

        const isEqual = await bcrypt.compare(password, user.password);

        if (!isEqual) {
            return res.status(401).json({ error: 'Something went wrong.' });
        }

        const token = jwt.sign(
            {
                name: user.name,
                lastname: user.lastname,
                email: user.email,
                userId: user._id.toString(),
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({ token, userId: user._id.toString() });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Register Verify Routes
router.get('/login/:token', (req, res) => {
    User.findOne(
        { token: req.params.token, tokenExp: { $gt: Date.now() } },
        (err, user) => {
            if (err || !user) {
                res.send('Token is invalid or expired.');
            }
            res.send('Your account is confirmed.');
        }
    );
});

// TODO:THIS
router.post('/login/:token', (req, res) => {
    User.findOne(
        { token: req.params.token, tokenExp: { $gt: Date.now() } },
        (err, user) => {
            if (err || !user) {
                res.send('Token is invalid or expired.');
            } else {
                user.active = true;
                user.token = undefined;
                user.save();
                console.log('Account confirmed');
                res.status(200).json({ redirect: true });
            }
        }
    );
});

router.post("/reset", (req, res, next) => {
   
    const { email } = req.body;
    
    async.waterfall([
        (done) => {

// Forgot Password Routes
router.post('/reset', (req, res, next) => {
    const { email } = req.body;

    asyncMod.waterfall([
        done => {
            crypto.randomBytes(20, (err, code) => {
                let token = code.toString('hex');
                done(err, token);
            });
        },

        (token, done) => {
            User.findOne({ email }, function(err, user) {
                if (err || !user) {
                    console.log('No user of associated to this email');
                }
                user.token = token;
                // 1 Hour valid
                user.tokenExp = Date.now() + 3600000;
                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },

        async (token, user, done) => {
            let testAccount = await nodemailer.createTestAccount();

            /* let transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    type: "OAuth2",
                    user: process.env.EMAIL_ID,
                    clientId: process.env.CLIENT_ID,
                    clientSecret: process.env.CLIENT_SECRET,
                    refreshToken: process.env.REFRESH_TOKEN,
                    accessToken: accessToken,
                }
            }); */

            let transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: testAccount.user, // generated ethereal user
                    pass: testAccount.pass, // generated ethereal password
                },
            });

            let info = await transporter.sendMail({
                from: 'mappypals@gmail.com',
                to: user.email,
                subject: 'Reset Password',
                text:
                    'You are receiving this because you(or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://localhost:3000/resetpassword/' +
                    token +
                    '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n',
            });

            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            res.status(200).json({
                message: 'Click on the link below',
                link: nodemailer.getTestMessageUrl(info),
            });
        },
    ]);
});

// Deal with the reset token
router.post('/resetpassword/:token', (req, res) => {
    const { errors, isValid } = validateResetPasswordInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
    const { password, checkPassword } = req.body;

    User.findOne(
        { token: req.params.token, tokenExp: { $gt: Date.now() } },
        (err, user) => {
            if (err) {
                console.log(`Gen salt error: ${err}`);
                return res.status(401).json({ error: err });
            }

            if (!user) {
                res.send('Password Reset Token is invalid or expired.');
            } else if (password === checkPassword) {
                bcrypt.genSalt(5, (err, salt) => {
                    if (err) {
                        console.log(`Gen salt error: ${err}`);
                    } else {
                        bcrypt.hash(password, salt, (err, hash) => {
                            if (err) {
                                console.log(`Bcrypt error: ${err}`);
                            } else {
                                user.password = hash;
                                user.save()
                                    .then(user => {
                                        console.log(
                                            `Successfully updated ${user}`
                                        );
                                        res.status(200).json({
                                            redirect: true,
                                        });
                                    })
                                    .catch(err => console.log(err));
                            }
                        });
                    }
                });
            }
        }
    );
});

module.exports = router;
