import express from 'express';
import expressHandleWrapper from '../utilities/expressHandleWrapper';
import validateRequest from '../utilities/validateRequest';
import * as databaseService from '../services/database';
import { usersTable } from '../services/auth';
import createError from '../utilities/createError';

const router = express.Router();

router.route('/').post(
    (req, res, next) => validateRequest(req, res, next, 'vapid'),
    (req, res, next) =>
        expressHandleWrapper(req, res, next, async (req, res) => {
            const user = await databaseService.get({
                TableName: usersTable,
                Key: { id: req.body.userId },
            });

            if (!user?.Item) throw createError(404, 'User not found.');

            const vapids = user.Item?.vapid || [];

            if (req.body.keys) {
                if (!vapids.some((v) => v.endpoint === req.body.endpoint)) {
                    vapids.push({
                        endpoint: req.body.endpoint,
                        keys: req.body.keys,
                    });

                    await databaseService.update({
                        TableName: usersTable,
                        Key: { id: user.Item.id },
                        UpdateExpression: `set vapid = :v`,
                        ExpressionAttributeValues: {
                            ':v': vapids,
                        },
                    });
                    res.status(201).send();
                } else {
                    res.status(200).send();
                }
            } else {
                await databaseService.update({
                    TableName: usersTable,
                    Key: { id: user.Item.id },
                    UpdateExpression: `set vapid = :v`,
                    ExpressionAttributeValues: {
                        ':v': vapids.filter(
                            (v) => v.endpoint !== req.body.endpoint
                        ),
                    },
                });
                res.status(200).send();
            }
        })
);

export default router;
