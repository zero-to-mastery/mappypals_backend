import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import asyncMod from 'async';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import User from '../models/User';

class UserController {
    static registerUser(req, res) {
        const { name, lastname, email, password } = req.body;

        User.findOne({ email: email }).then(user => {
            if (user) {
                return res.status(401).json({
                    error: 'User already exists for this email account.',
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
                            active: false, // remove after testing
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
                            tls: {
                                rejectUnauthorized: false
                            }
                        });

                        let info = await transporter.sendMail({
                            from: 'mappypals@gmail.com',
                            to: newUser.email,
                            subject: 'Confirm Registration',
                            html:
                                'You are receiving this because you(or someone else) have requested to register to Mappypals.\n\n' +
                                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                                `<a href="${process.env.FRONT_END_URL ||
                                    'http://localhost:3000'}/login/${token}>${process
                                    .env.FRONT_END_URL ||
                                    'http://localhost:3000'}/login/${token}</a>` +
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
                                return res
                                    .status(401)
                                    .json({ Error: `Bcrypt error: ${err}` });
                            } else {
                                bcrypt.hash(
                                    newUser.password,
                                    salt,
                                    (err, hash) => {
                                        if (err) {
                                            return res.status(401).json({
                                                Error: `Bcrypt error: ${err}`,
                                            });
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
                                                    return res
                                                        .status(401)
                                                        .json({
                                                            Error: `Bcrypt error: ${err}`,
                                                        });
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

        User.findOne({ email: email }).then((user,err) => {
            if (!user) {
                res.statusMessage = `Email ${email} not found.`;
                return res.status(401).json();
            }
            if (!user.active) {
                res.statusMessage = `Account not active. Did you use our emailed link?`;
                return res.status(401).json();
            }
            if (err) {
                res.statusMessage = err.message;
                return res.status(500).json();
            }
            bcrypt.compare(password, user.password, function(err, resp) {
                if (err) {
                    res.statusMessage = 'Something went wrong with that email/password combination.';
                    return res.status(401).json();
                }
            });
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
            var newVal1 = token.toString();
            var newVal2 = user._id.toString();
            return res.status(200).json({token: newVal1, userId: newVal2});
        });
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
                    tls: {
                        rejectUnauthorized: false
                    }
                });

                const mailOptions = {
                    from: `team.mappypals@gmail.com`,
                    to: `${user.email}`,
                    subject: `Forgotten Password - Link to Reset Password`,
                    text:
                        'You are receiving this because you(or someone else) have requested the reset of the password for your account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        `${process.env.FRONT_END_URL ||
                            'http://localhost:3000'}/resetpassword/` +
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

    static contactFormMsg(req, res) {
        let mailOpts, smtpTrans;
        try {
            smtpTrans = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_ADDRESS,
                    pass: process.env.EMAIL_PASSWORD,
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
        } catch {
            return res
                .status(500)
                .json({ err: 'Unknown gmail error. Please resend' });
        }
        mailOpts = {
            from: req.body.name + ' &lt;' + req.body.email + '&gt;',
            to: process.env.EMAIL_ADDRESS,
            subject: req.body.subject + 'Message from Contact Form',
            text: `${req.body.name} (${req.body.email}) says: ${
                req.body.message
            }`,
        };
        try {
            smtpTrans.sendMail(mailOpts, function(err, resp) {
                //gmail errors have unjsonfriendly "" to be returned to ky/frontend
                let str = '';
                if (err) {
                    str = String(err);
                    str = str.replace(/"/g, "'"); //replace " with '
                    res.statusMessage = `${str}`;
                    return res.status(401).json();
                } else {
                    return res.status(200).json();
                }
            });
        } catch {
            return res
                .status(500)
                .json({ err: 'Unknown error. Please resend' });
        }
    }
}

export default UserController;
