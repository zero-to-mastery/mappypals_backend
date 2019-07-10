import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import asyncMod from 'async';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import User from '../models/User';

class UserController {
    static registerUser(req, res) {
        const { name, lastname, email, password, confirmPassword } = req.body;

        if (!name || !lastname || !email || !password || !confirmPassword) {
            console.log('Error: Enter all fields');
            return false;
        }

        if (password !== confirmPassword) {
            console.log('Error: Passwords do not match');
            return false;
        }

        User.findOne({ email }).then(user => {
            if (user) {
                return res.status(401).json('This email already exists');
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
                            active: true, //remove after testing
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
                                bcrypt.hash(
                                    newUser.password,
                                    salt,
                                    (err, hash) => {
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

    // checks user's input email in the database
    // if there is such an email, it will send an email with reset password link
    static resetPassword(req, res) {
        const { email } = req.body;

        User.findOne({ email }).then(user => {
            if (!user) {
                return res
                    .status(401)
                    .json({ error: 'This email is not in database' });
            } else {
                const token = crypto.randomBytes(20).toString('hex');
                user.token = token;
                user.tokenExp = Date.now() + 900000;
                user.save();
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_ADDRESS,
                        pass: process.env.EMAIL_PASSWORD,
                    },
                });

                const mailOptions = {
                    from: `team.mappypals@gmail.com`,
                    to: `${user.email}`,
                    subject: `Forgotten Password - Link to Reset Password`,
                    text:
                        'You are receiving this because you(or someone else) have requested the reset of the password for your account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'http://localhost:3000/resetpassword/' +
                        token +
                        '\n\n' +
                        'If you did not request this, please ignore this email and your password will remain unchanged.\n',
                };

                transporter.sendMail(mailOptions, function(err, response) {
                    if (err) {
                        console.error('there was an error', err);
                        return res.status(401).json({
                            error: `Couldn't send reset password link.`,
                        });
                    } else {
                        return res.status(200).json('Recovery email sent.');
                    }
                });
            }
        });
    }

    // gets user's email from database when user clicks on the reset password link
    static resetWithToken(req, res, next) {
        User.findOne({
            token: req.query.resetPasswordToken,
            tokenExp: { $gte: Date.now() },
        }).then(user => {
            if (!user) {
                return res.json(
                    'Password reset link is invalid or has expired'
                );
            } else {
                return res.status(200).send({
                    email: user.email,
                    message: 'password reset link a-ok',
                });
            }
        });
    }

    // updates user password with newly set password
    // currently being used in Reset/Forgotten password
    static updatePassword(req, res, next) {
        const BCRYPT_SALT_ROUNDS = 12;
        const { password, email } = req.body;

        User.findOne({ email })
            .then(user => {
                if (!user) {
                    res.status(404).json(
                        'There is no user in the database which needs updated.'
                    );
                } else {
                    bcrypt
                        .hash(password, BCRYPT_SALT_ROUNDS)
                        .then(hashedPassword => {
                            user.update({
                                password: hashedPassword,
                                token: null,
                                tokenExp: null,
                            });
                        })
                        .then(() => {
                            res.status(200).send({
                                message: 'password-updated',
                            });
                        })
                        .catch(err =>
                            res
                                .status(401)
                                .json({ error: 'Could not update password' })
                        );
                }
            })
            .catch(err =>
                res
                    .status(401)
                    .json({ error: 'Could not check user in database' })
            );
    }

    // receives email from front-end
    // and checks if it's already in db
    static validateEmail(req, res) {
        const { email } = req.body;

        User.findOne({ email })
            .then(user => {
                if (!user) res.status(200).json('Valid');
                else res.status(401).json('Email already exists');
            })
            .catch(err => res.status(401).json({ error: err }));
    }
}

export default UserController;
