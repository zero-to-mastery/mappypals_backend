const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../models/User');

router.get('/invite', async (req, res) => {
    res.send("Invite endpoint reached");
})

router.post('/invite', (req, res) => {
    const { email } = req.query;
        let testAccount = await nodemailer.createTestAccount();

        /*let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL_ID,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken,
            }
        });*/

        let transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass // generated ethereal password
            }
        });

        let info = await transporter.sendMail({
            from: 'mappypals@gmail.com',
            to: email,
            subject: 'Reset Password',
            text: `You are receiving this because your friend has invited you to join mappypals.\n\n` +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://localhost:3000/signup \n\n'
        });

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        res.status(200).json({ message: `Click on the link below`, link: nodemailer.getTestMessageUrl(info) })

});

module.exports = router;