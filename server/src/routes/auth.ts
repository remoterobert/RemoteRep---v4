import express from 'express';
import * as authService from '../services/auth';
import validateRequest from '../utilities/validateRequest';
import expressHandleWrapper from '../utilities/expressHandleWrapper';
import { CustomRequest, verifyUser } from '../utilities/expressAuth';

const router = express.Router();

router.route('/register').post(
    (req, res, next) => validateRequest(req, res, next, 'register'),
    (req, res, next) =>
        expressHandleWrapper(req, res, next, async (req, res) => {
            const user = await authService.register(req.body);
            res.status(201).send({ token: await user.generateJwtToken() });
        })
);

router.route('/login').post(
    (req, res, next) => validateRequest(req, res, next, 'login'),
    (req, res, next) =>
        expressHandleWrapper(req, res, next, async (req, res) => {
            const user = await authService.login(req.body);
            res.status(200).send({ token: await user.generateJwtToken() });
        })
);

router.route('/verify').get(verifyUser, (req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        await req.user.updateDateLastOnline();
        res.status(200).send({ user: req.user.toPrivateObject() });
    })
);

router.route('/verify-email').post(
    (req, res, next) => validateRequest(req, res, next, 'verifyEmail'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                const user = await authService.verifyEmail(
                    req.body.id,
                    req.body.code
                );
                res.status(200).send({ token: await user.generateJwtToken() });
            }
        )
);

router.route('/forgot-password').post(
    (req, res, next) => validateRequest(req, res, next, 'forgotPassword'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                await authService.sendPasswordReset(req.body);
                res.status(200).send();
            }
        )
);

router.route('/reset-password').post(
    (req, res, next) => validateRequest(req, res, next, 'resetPassword'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                await authService.resetPassword(req.body);
                res.status(200).send();
            }
        )
);

router.route('/change-password').post(
    verifyUser,
    (req, res, next) => validateRequest(req, res, next, 'changePassword'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                await authService.changePassword(req.user, req.body);
                res.status(200).send();
            }
        )
);

router.route('/change-email-request').post(
    verifyUser,
    (req, res, next) => validateRequest(req, res, next, 'changeEmailRequest'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                await authService.sendChangeEmail(req.user, req.body.email);
                res.status(200).send();
            }
        )
);

router.route('/change-email').post(
    verifyUser,
    (req, res, next) => validateRequest(req, res, next, 'changeEmail'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                await authService.changeEmail(req.body);
                res.status(200).send();
            }
        )
);

router.route('/edit-contact').post(
    verifyUser,
    (req, res, next) => validateRequest(req, res, next, 'editContact'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                await authService.editContact(req.user, req.body);
                res.status(200).send();
            }
        )
);

export default router;
