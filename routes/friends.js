import express from 'express';
import friendControl from '../controllers/friendsController';

const router = express.Router();

const { inviteFriend } = friendControl;

router.get('/invite', async (req, res) => {
    res.send('Invite endpoint reached');
});

router.post('/invite', inviteFriend);

export default router;
