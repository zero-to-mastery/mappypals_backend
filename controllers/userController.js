/* eslint-disable linebreak-style */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import asyncMod from 'async';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import User from '../models/User';

class UserController {
    static registerUser(req, res) {
        const { name, lastname, email, password } = req.body;

        User.findOne({ email }).then(user => {
            if (user) {
                return res.status(401).json({ 
                    error: 'User already exists for this email account.' 
                });
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

                        // let testAccount = await nodemailer.createTestAccount();

                        let transporter = await nodemailer.createTransport({
                            // host: 'smtp.ethereal.email',
                            // port: 587,
                            // secure: false, // true for 465, false for other ports
                            // auth: {
                            //     user: testAccount.user, // generated ethereal user
                            //     pass: testAccount.pass, // generated ethereal password
                            // },
                            host: process.env.MAIL_HOST,
                            port: process.env.MAIL_PORT,
                            auth: {
                                user: process.env.MAIL_USER,
                                pass: process.env.MAIL_PASS,
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
                                return res.status(401).json({ Error: `Bcrypt error: ${err}` });
                            } else {
                                bcrypt.hash(
                                    newUser.password,
                                    salt,
                                    (err, hash) => {
                                        if (err) {
                                            return res.status(401).json({ Error: `Bcrypt error: ${err}` });
                                        } else {
                                            newUser.password = hash;
                                            newUser
                                                .save()
                                                .then(user => {
                                                    console.log(
                                                        `Successfully registered ${user}`
                                                    );
                                                })
                                                .catch(err => { 
                                                    return res.status(401).json({ Error: `Bcrypt error: ${err}` })
                                                });
                                        }
                                    }
                                );
                            }
                        });
                    },
                ]);
            }
        });
    }
    static async loginUser(req, res) {
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
    }
    static confirmAccount(req, res) {
        User.findOne(
            { token: req.params.token, tokenExp: { $gt: Date.now() } },
            (err, user) => {
                if (err || !user) {
                    res.send('Token is invalid or expired.');
                }
                res.send('Your account is confirmed.');
            }
        );
    }
    static validateToken(req, res) {
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
    }
    static resetPassword(req, res) {
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
                // let testAccount = await nodemailer.createTestAccount();

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
                    // host: 'smtp.ethereal.email',
                    // port: 587,
                    // secure: false, // true for 465, false for other ports
                    // auth: {
                    //     user: testAccount.user, // generated ethereal user
                    //     pass: testAccount.pass, // generated ethereal password
                    // },
                    host: process.env.MAIL_HOST,
                    port: process.env.MAIL_PORT,
                    auth: {
                        user: process.env.MAIL_USER,
                        pass: process.env.MAIL_PASS,
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

                console.log(
                    'Preview URL: %s',
                    nodemailer.getTestMessageUrl(info)
                );
                res.status(200).json({
                    message: 'Click on the link below',
                    link: nodemailer.getTestMessageUrl(info),
                });
            },
        ]);
    }
    static resetWithToken(req, res) {
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
    }
}

export default UserController;
