import express from 'express';
import * as authService from '../services/auth';
import * as adminService from '../services/admin';
import validateRequest from '../utilities/validateRequest';
import expressHandleWrapper from '../utilities/expressHandleWrapper';
import {
    CustomRequest,
    verifyUser,
    checkAdministrator,
} from '../utilities/expressAuth';

const router = express.Router();

router.use(verifyUser);
router.use(checkAdministrator);

router
    .route('/users')
    .get((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                const users = await adminService.getUsers();
                res.status(200).send(users);
            }
        )
    )
    .post(
        (req, res, next) => validateRequest(req, res, next, 'adminRegister'),
        (req, res, next) =>
            expressHandleWrapper(
                req,
                res,
                next,
                async (req: CustomRequest, res) => {
                    await adminService.registerUser(req.user, req.body);
                    res.status(201).send();
                }
            )
    );

router
    .route('/users/:id')
    .patch(
        (req, res, next) => validateRequest(req, res, next, 'adminPatchUser'),
        (req, res, next) =>
            expressHandleWrapper(
                req,
                res,
                next,
                async (req: CustomRequest, res) => {
                    await adminService.patchUser(
                        req.user,
                        req.params.id,
                        req.body
                    );
                    res.status(200).send();
                }
            )
    )
    .delete((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                await adminService.deleteUser(req.user, req.params.id);
                res.status(200).send();
            }
        )
    );

router
    .route('/users/:id/reset-password')
    .get((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                await adminService.resetPassword(req.user, req.params.id);
                res.status(200).send();
            }
        )
    )
    .post(
        (req, res, next) =>
            validateRequest(req, res, next, 'adminResetPassword'),
        (req, res, next) =>
            expressHandleWrapper(
                req,
                res,
                next,
                async (req: CustomRequest, res) => {
                    await adminService.changePassword(
                        req.user,
                        req.params.id,
                        req.body
                    );
                    res.status(200).send();
                }
            )
    );

router.route('/users/:id/impersonate').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        res.status(200).send(
            await adminService.impersonate(req.user, req.params.id)
        );
    })
);

router.route('/counts').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        res.status(200).send(await adminService.getCounts());
    })
);

router.route('/payment-counts').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        res.status(200).send(await adminService.getPaymentCounts());
    })
);

export default router;
