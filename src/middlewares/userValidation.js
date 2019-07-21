class UserValidation {
    static signupValidation(req, res, next) {
        req.checkBody('email')
            .notEmpty()
            .withMessage('Email is required')
            .trim()
            .isEmail()
            .withMessage('Invalid Email address')
            .customSanitizer(email => email.toLowerCase());

        req.checkBody('firstName')
            .notEmpty()
            .withMessage('First name is required')
            .trim()
            .isAlpha()
            .withMessage('Name should only contain alphabets');

        req.checkBody('lastName')
            .notEmpty()
            .withMessage('last name is required')
            .trim()
            .isAlpha()
            .withMessage('Name should only contain alphabets');

        req.checkBody('password')
            .notEmpty()
            .withMessage('Password is required')
            .trim()
            .matches('[0-9]')
            .matches('[a-z]')
            .matches('[A-Z]')
            .withMessage(
                'Password should contain atleast 1 number and have upper and lowercase characters'
            )
            .isLength({ min: 6 })
            .withMessage('Password should be at least 6 character');

        const error = req.validationErrors();
        if (error) {
            return res.status(400).json({
                status: 400,
                error: error[0].msg,
            });
        }
        return next();
    }
}

export default UserValidation;
