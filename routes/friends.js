import express from 'express';
import friendControl from '../controllers/friendController';

const router = express.Router();

const { inviteFriends } = friendControl;
router.get('/invite', async (req, res) => {
    res.send('Invite endpoint reached');
});

router.post('/invite', inviteFriends);

export default router;
