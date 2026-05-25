import express from 'express';
import * as authService from '../services/auth';
import * as listingsService from '../services/listings';
import expressHandleWrapper from '../utilities/expressHandleWrapper';
import { CustomRequest, verifyUser } from '../utilities/expressAuth';

const router = express.Router();

router.route('/:id').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        const listing = await listingsService.getListing(req.params.id);

        if (req?.user?.id === listing?.client?.id) {
            res.status(200).send({
                ...listing,
                client: listing.client.toPrivateObject(),
            });
        } else {
            res.status(200).send({
                ...listing,
                calendarLink: undefined,
                client: listing.client.toPublicObject(),
            });
        }
    })
);

export default router;
