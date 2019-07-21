const nodemailer = require('nodemailer');

exports.sendEmail = async (from, email, subject, text) => {
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // True for 465, false for other ports
        auth: {
            user: testAccount.user, // Generated ethereal user
            pass: testAccount.pass, // Generated ethereal password
        },
    });

    const info = await transporter.sendMail({
        from,
        to: email,
        subject,
        text,
    });

    const link = nodemailer.getTestMessageUrl(info);
    return link;
};
