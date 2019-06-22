// All base ("/") routes go in here
import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.send('Reached root end point here');
});

export default router;
