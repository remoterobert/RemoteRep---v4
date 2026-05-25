import express from 'express';
import auth from './auth';
import files from './files';
import talent from './talent';
import client from './client';
import admin from './admin';
import chats from './chats';
import profiles from './profiles';
import listings from './listings';
import notifications from './notifications';
import payments from './payments';
import vapid from './vapid';
import affiliate from './affiliate';

const router = express.Router();

router.use('/auth', auth);
router.use('/files', files);
router.use('/talent', talent);
router.use('/client', client);
router.use('/admin', admin);
router.use('/chats', chats);
router.use('/profiles', profiles);
router.use('/listings', listings);
router.use('/notifications', notifications);
router.use('/payments', payments);
router.use('/vapid', vapid);
router.use('/affiliate', affiliate);

export default router;
