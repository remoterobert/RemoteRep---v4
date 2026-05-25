import express from 'express';
import * as chatsService from '../services/chats';
import validateRequest from '../utilities/validateRequest';
import expressHandleWrapper from '../utilities/expressHandleWrapper';
import { CustomRequest, verifyUser } from '../utilities/expressAuth';

const router = express.Router();

router.use(verifyUser);

router
    .route('/')
    .get((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                res.status(200).send(await chatsService.getChats(req.user));
            }
        )
    )
    .post(
        (req, res, next) => validateRequest(req, res, next, 'createChat'),
        (req, res, next) =>
            expressHandleWrapper(
                req,
                res,
                next,
                async (req: CustomRequest, res) => {
                    res.status(201).send(
                        await chatsService.createChat(req.user, req.body.target)
                    );
                }
            )
    );

router
    .route('/:chatId')
    .post(
        (req, res, next) => validateRequest(req, res, next, 'sendMessage'),
        (req, res, next) =>
            expressHandleWrapper(
                req,
                res,
                next,
                async (req: CustomRequest, res) => {
                    res.status(201).send(
                        await chatsService.sendMessage(
                            req.user,
                            req.params.chatId,
                            req.body.message
                        )
                    );
                }
            )
    )
    .get((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                res.status(200).send(
                    await chatsService.getChatMessages(
                        req.user,
                        req.params.chatId
                    )
                );
            }
        )
    );

router.route('/:chatId/:messageId').patch(
    (req, res, next) => {
        validateRequest(req, res, next, 'editMessage');
    },
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                res.status(200).send(
                    await chatsService.editMessage(
                        req.user,
                        req.params.chatId,
                        req.params.messageId,
                        req.body.message
                    )
                );
            }
        )
);

router.route('/:chatId/:messageId').delete((req, res, next) =>
    expressHandleWrapper(req, res, next, async (req: CustomRequest, res) => {
        res.status(200).send(
            await chatsService.deleteMessage(
                req.user,
                req.params.chatId,
                req.params.messageId
            )
        );
    })
);

router
    .route('/:chatId/:messageId')
    .patch(
        (req, res, next) => validateRequest(req, res, next, 'editMessage'),
        (req, res, next) =>
            expressHandleWrapper(
                req,
                res,
                next,
                async (req: CustomRequest, res) => {
                    res.status(200).send(
                        await chatsService.editMessage(
                            req.user,
                            req.params.chatId,
                            req.params.messageId,
                            req.body.message
                        )
                    );
                }
            )
    )
    .delete((req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                res.status(200).send(
                    await chatsService.deleteMessage(
                        req.user,
                        req.params.chatId,
                        req.params.messageId
                    )
                );
            }
        )
    );

export default router;
