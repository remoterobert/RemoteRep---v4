import express from 'express';
import * as authService from '../services/auth';
import * as notificationsService from '../services/notifications';
import expressHandleWrapper from '../utilities/expressHandleWrapper';
import { CustomRequest, verifyUser } from '../utilities/expressAuth';

const router = express.Router();

router.use(verifyUser);

router.route('/').get((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        const notifications = await notificationsService.getNotifications(
            req.user
        );

        res.status(200).send(notifications);
    })
);

router
    .route('/:id')
    .patch((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                const notifications =
                    await notificationsService.markNotificationAsSeen(
                        req.user,
                        req.params.id
                    );

                res.status(200).send(notifications);
            }
        )
    )
    .delete((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                const notifications =
                    await notificationsService.deleteNotification(
                        req.user,
                        req.params.id
                    );

                res.status(200).send(notifications);
            }
        )
    );

export default router;
