const express = require('express');
const router = express.Router();

//  Load controllers
const emailHelper = require('../../controllers/email');

router.get('/invite', async (req, res) => {
    res.send('Invite endpoint reached');
});

router.post('/invite', async (req, res) => {
    const { email } = req.query;
    
    const response = await emailHelper.sendEmail(
        'mappypals@gmail.com',
        email,
        'Invitation to Join',
        'You are receiving this because your friend has invited you to join mappypals.\n\n' +
        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
        'http://localhost:3000/signup \n\n',
    );
    res.status(200).json({
        message: 'Click on the link below',
        link: response,
    });
});

module.exports = router;
