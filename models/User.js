const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    token: {
        type: String,
    },
    tokenExp: {
        type: Date,
    },
    lastLogin: {
        type: Date,
        default: Date.now,
    },
    active: {
        type: Boolean,
        default: false,
    },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
