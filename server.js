// Should be server.js but since we are not allowed to delete other people's code, a new file.
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { isAuthenticated } = require('./config/middleware');

const app = express();
dotenv.config();
// CORS
app.use(cors());

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
const users = require('./routes/users');

// DB config
const db = require('./config/db').mongoURI;

mongoose
    .connect(db, { useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.use('/users', users);

const PORT = process.env.PORT || 3001;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
