import express from 'express';
import * as authService from '../services/auth';
import * as clientService from '../services/client';
import validateRequest from '../utilities/validateRequest';
import expressHandleWrapper from '../utilities/expressHandleWrapper';
import {
    CustomRequest,
    verifyUser,
    checkClient,
    checkPayingClient,
} from '../utilities/expressAuth';

const router = express.Router();

router.use(verifyUser);
router.use(checkClient);

router.route('/').patch(
    (req, res, next) => validateRequest(req, res, next, 'patchClient'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                await (req.user as authService.ClientUser).updateTypeData(
                    req.body
                );
                res.status(200).send({
                    clientData: (req.user as authService.ClientUser).clientData,
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
            await clientService.deleteAccount(req.params.id);
            res.status(200).end();
        }
    );
});

router
    .route('/listings')
    .get((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                res.status(200).send(
                    await clientService.getListings(
                        req.user as authService.ClientUser
                    )
                );
            }
        )
    )
    .post(
        (req, res, next) => validateRequest(req, res, next, 'createListing'),
        (req, res, next) =>
            expressHandleWrapper(
                req,
                res,
                next,
                async (req: CustomRequest, res) => {
                    res.status(201).send({
                        id: await clientService.createListing(
                            req.user as authService.ClientUser,
                            req.body
                        ),
                    });
                }
            )
    );

router
    .route('/listings/:id')
    .get((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                res.status(200).send(
                    await clientService.getListing(
                        req.user as authService.ClientUser,
                        req.params.id
                    )
                );
            }
        )
    )
    .patch(
        (req, res, next) => validateRequest(req, res, next, 'patchListing'),
        (req, res, next) =>
            expressHandleWrapper(
                req,
                res,
                next,
                async (req: CustomRequest, res) => {
                    res.status(200).send(
                        await clientService.patchListing(
                            req.user as authService.ClientUser,
                            req.params.id,
                            req.body
                        )
                    );
                }
            )
    );

    
router.route('/listings/:id/visibility').patch(
    (req, res, next) => checkPayingClient(req as any, res, next),
    (req, res, next) => validateRequest(req, res, next, 'patchVisibility'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                await clientService.updateListingVisibility(
                    req.params.id,
                    req.body
                );
                res.status(200).send({});
            }
        )
);

router
    .route('/listings/:id/applications')
    .get((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                res.status(200).send(
                    await clientService.getApplications(
                        req.user as authService.ClientUser,
                        req.params.id
                    )
                );
            }
        )
    )
    .patch(
        (req, res, next) => checkPayingClient(req as any, res, next),
        (req, res, next) => validateRequest(req, res, next, 'patchApplication'),
        (req, res, next) =>
            expressHandleWrapper(
                req,
                res,
                next,
                async (req: CustomRequest, res) => {
                    res.status(200).send(
                        await clientService.patchApplication(
                            req.user as authService.ClientUser,
                            req.params.id,
                            req.body.talentId,
                            req.body
                        )
                    );
                }
            )
    )
    .post(
        (req, res, next) => checkPayingClient(req as any, res, next),
        (req, res, next) => validateRequest(req, res, next, 'postApplication'),
        (req, res, next) =>
            expressHandleWrapper(
                req,
                res,
                next,
                async (req: CustomRequest, res) => {
                    res.status(200).send(
                        await clientService.postApplication(
                            req.user as authService.ClientUser,
                            req.params.id,
                            req.body.talentId
                        )
                    );
                }
            )
    );

router.route('/talent').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        const talent = await clientService.getTalent(
            req.user as authService.ClientUser
        );
        res.status(200).send(talent);
    })
);

router.route('/bookmarks/talent').post(
    // (req: CustomRequest, res, next) => checkPayingClient(req, res, next),
    (req, res, next) => validateRequest(req, res, next, 'bookmarkTalent'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                res.status(200).send(
                    await (req.user as authService.ClientUser).bookmarkTalent(
                        req.body as any
                    )
                );
            }
        )
);

router.route('/access').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        const access = await clientService.getAccess(
            req.user as authService.ClientUser
        );

        res.status(access.access ? 200 : 403).send(access);
    })
);

router
    .route('/subscription')
    .get((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                const subscription = await clientService.getSubscription(
                    req.user as authService.ClientUser
                );

                res.status(200).send(subscription);
            }
        )
    )
    .delete((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                const subscription = await clientService.cancelSubscription(
                    req.user as authService.ClientUser
                );

                res.status(200).send(subscription);
            }
        )
    )
    .patch((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                const subscription = await clientService.resumeSubscription(
                    req.user as authService.ClientUser
                );

                res.status(200).send(subscription);
            }
        )
    );

router.route('/payment-session/:id').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        const url = await clientService.getSession(
            req.user as authService.ClientUser,
            req.params.id
        );

        res.status(201).send({ url });
    })
);

router.route('/payment-session').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        const url = await clientService.getSession(
            req.user as authService.ClientUser
        );

        res.status(201).send({ url });
    })
);

router.route('/bulk-bookmark').post(
    (req, res, next) => validateRequest(req, res, next, 'bulkBookmark'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                res.status(200).send(
                    await (req.user as authService.ClientUser).bulkBookmark(
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
