import express from 'express';
import * as authService from '../services/auth';
import * as profilesService from '../services/profiles';
import expressHandleWrapper from '../utilities/expressHandleWrapper';
import { CustomRequest, verifyUser } from '../utilities/expressAuth';

const router = express.Router();

router.route('/:id').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        // public logic here

        const user = await profilesService.getProfile(req.params.id);
        res.status(200).send(user);
    })
);

export default router;
