import express from 'express';
import userControl from '../controllers/userController';

const router = express.Router();

const {
    registerUser,
    loginUser,
    confirmAccount,
    validateToken,
    resetPassword,
    resetWithToken,
} = userControl;

// Register Routes
router.post('/register', registerUser);

// Login Routes
router.post('/login', loginUser);

// Register Verify Routes
router.get('/login/:token', confirmAccount);

// TODO:THIS
router.post('/login/:token', validateToken);

// Forgot Password Routes
router.post('/reset', resetPassword);

// Deal with the reset token
router.post('/resetpassword/:token', resetWithToken);

export default router;
