import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Routes
import users from './routes/users';
import friends from './routes/friends';

import User from './models/User';

const app = express();
dotenv.config();
// CORS
app.use(cors());

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// DB config
const db = require('./config/db').mongoURI;

mongoose
    .connect(db, { useNewUrlParser: true })
    .then(() => {
        console.log('MongoDB Connected');
    })
    .catch(err => console.log(err));

app.use('/users', users);
app.use('/friends', friends);

const PORT = process.env.PORT || 3001;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
