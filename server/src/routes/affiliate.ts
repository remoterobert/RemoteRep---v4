import express from 'express';
import * as affiliateService from '../services/affiliate';
import validateRequest from '../utilities/validateRequest';
import expressHandleWrapper from '../utilities/expressHandleWrapper';
import {
    CustomRequest,
    verifyUser,
    checkAffiliate,
    checkAdministrator,
} from '../utilities/expressAuth';

const router = express.Router();

router.route('/access').get(verifyUser, (req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        res.status(200).send({
            affiliateAccess: req.user?.affiliateAccess || 'inactive',
        });
    })
);

router.route('/activate').get(verifyUser, (req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        await affiliateService.activate(req.user);
        res.status(200).send();
    })
);

router.route('/code').get(verifyUser, checkAffiliate, (req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        const code = await affiliateService.getCode(req.user);
        res.status(200).send({ code });
    })
);

router.route('/clicks/:code').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        await affiliateService.registerClick(req.params.code);
        res.status(200).send({});
    })
);

router.route('/referred').get(verifyUser, checkAffiliate, (req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        const referred = await affiliateService.getReferred(req.user);
        res.status(200).send({ ...referred });
    })
);

router.route('/codes').get(verifyUser, checkAdministrator, (req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        const codes = await affiliateService.getCodes();
        res.status(200).send({ codes });
    })
);

router.route('/affiliates/:code').patch(
    verifyUser,
    checkAdministrator,
    (req, res, next) => validateRequest(req, res, next, 'patchAffiliate'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                await affiliateService.patchAffiliate(
                    req.params.code,
                    req.body
                );
                res.status(200).send({});
            }
        )
);

router
    .route('/connect')
    .get(verifyUser, checkAffiliate, (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                const { url } = await affiliateService.expressLogin(req.user);
                res.status(200).send({ url });
            }
        )
    )
    .post(verifyUser, checkAffiliate, (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                const { url } = await affiliateService.connect(req.user);
                res.status(201).send({ url });
            }
        )
    );

export default router;