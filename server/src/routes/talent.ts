import express from 'express';
import * as authService from '../services/auth';
import * as talentService from '../services/talent';
import validateRequest from '../utilities/validateRequest';
import expressHandleWrapper from '../utilities/expressHandleWrapper';
import {
    CustomRequest,
    verifyUser,
    checkTalent,
} from '../utilities/expressAuth';

const router = express.Router();

router.use(verifyUser);
router.use(checkTalent);

router.route('/').patch(
    (req, res, next) => validateRequest(req, res, next, 'patchTalent'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                await (req.user as authService.TalentUser).updateTypeData(
                    req.body
                );
                res.status(200).send({
                    talentData: (req.user as authService.TalentUser).talentData,
                });
            }
        )
);

router.route('/:id').delete((req, res, next) => {
    return expressHandleWrapper(
        req,
        res,
        next,
        async (req: CustomRequest, res) => {
            await talentService.deleteAccount(req.params.id);
            res.status(200).end();
        }
    );
});

router.route('/clients/:id').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        const client = await talentService.getClient(req.params.id);
        res.status(200).send(client);
    })
);

router.route('/clients').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        const clients = await talentService.getClients();
        res.status(200).send(clients);
    })
);

router.route('/listings').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        const listings = await talentService.getListings(
            req.user as authService.TalentUser
        );
        res.status(200).send(listings);
    })
);

router
    .route('/applications')
    .get((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                const applications = await talentService.getApplications(
                    req.user as authService.TalentUser
                );
                res.status(200).send(applications);
            }
        )
    )
    .post(
        (req, res, next) =>
            validateRequest(req, res, next, 'listingApplication'),
        (req, res, next) =>
            expressHandleWrapper(
                req,
                res,
                next,
                async (req: CustomRequest, res) => {
                    res.status(201).send(
                        await talentService.postApplication(
                            req.user as authService.TalentUser,
                            req.body
                        )
                    );
                }
            )
    );

router.route('/bookmarks/clients').post(
    (req, res, next) => validateRequest(req, res, next, 'bookmarkClient'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                res.status(200).send(
                    await (req.user as authService.TalentUser).bookmarkClient(
                        req.body as any
                    )
                );
            }
        )
);

router.route('/bookmarks/listings').post(
    (req, res, next) => validateRequest(req, res, next, 'bookmarkListing'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                res.status(200).send(
                    await (req.user as authService.TalentUser).bookmarkListing(
                        req.body as any
                    )
                );
            }
        )
);

router
    .route('/visibility')
    .get((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                res.status(200).send({ visibility: !req.user?.profileHidden });
            }
        )
    )
    .patch(
        (req, res, next) => validateRequest(req, res, next, 'patchVisibility'),
        (req, res, next) =>
            expressHandleWrapper(
                req,
                res,
                next,
                async (req: CustomRequest, res) => {
                    await req.user.updateHidden(!req.body.visibility);
                    res.status(200).send({});
                }
            )
    );

export default router;
