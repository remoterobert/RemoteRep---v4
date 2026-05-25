import express from 'express';
import { CustomRequest } from '../utilities/expressAuth';
import expressHandleWrapper from '../utilities/expressHandleWrapper';
import * as stripeService from '../services/stripe';
import * as databaseService from '../services/database';
import * as affiliateService from '../services/affiliate';
import createError from '../utilities/createError';
import validateRequest from '../utilities/validateRequest';
import { ClientUser, generateUser, usersTable } from '../services/auth';
import { listingsTable } from '../services/client';
import { updateClientTags } from '../services/ghl';

const router = express.Router();

router.route('/verify').post(
    (req, res, next) => validateRequest(req, res, next, 'verifyPayment'),
    (req, res, next) =>
        expressHandleWrapper(
            req,
            res,
            next,
            async (req: CustomRequest, res) => {
                const session = await stripeService.getSession(
                    req.body.sessionId
                );

                if (session.status !== 'complete')
                    throw createError(400, 'Payment incomplete.');

                let userToBeUpdated: ClientUser;

                switch (req.body.product) {
                    case 'listing':
                        await databaseService.update({
                            TableName: listingsTable,
                            Key: { id: req.body.listingId },
                            UpdateExpression: 'set paidFor=:t',
                            ExpressionAttributeValues: {
                                ':t': true,
                            },
                        });

                        userToBeUpdated = generateUser(
                            (
                                await databaseService.get({
                                    TableName: usersTable,
                                    Key: { id: req.body.userId },
                                })
                            ).Item
                        ) as ClientUser;

                        await userToBeUpdated.updateLastAccess('listing');

                        await updateClientTags(userToBeUpdated.email, ['$299']);

                        if (userToBeUpdated.affiliateCode) {
                            await affiliateService.registerConversion(
                                userToBeUpdated
                            );
                            await affiliateService.registerFinancial(
                                userToBeUpdated,
                                session.amount_total,
                                session.amount_total / 2
                            );
                        }

                        res.status(200).send({
                            url: `${process.env.FRONTEND_BASE_URL}/app/client/browse-talent`,
                        });
                        break;
                    case 'access':
                        const user = await databaseService.get({
                            TableName: usersTable,
                            Key: { id: req.body.userId },
                        });

                        if (!user.Item?.stripe?.customerId)
                            throw createError(
                                400,
                                'Stripe customer ID not found'
                            );

                        const subscriptions =
                            await stripeService.getAccessSubscriptions(
                                user.Item.stripe.customerId
                            );

                        if (subscriptions.data.length !== 1)
                            throw createError(400, 'Subscription not found.');

                        if (subscriptions.data[0].status !== 'active')
                            throw createError(400, 'Subscription inactive.');

                        await databaseService.update({
                            TableName: usersTable,
                            Key: { id: req.body.userId },
                            UpdateExpression: 'set stripe=:s',
                            ExpressionAttributeValues: {
                                ':s': {
                                    ...user.Item.stripe,
                                    subscriptions: user.Item.stripe
                                        ?.subscriptions?.length
                                        ? [
                                              ...user.Item.stripe.subscriptions.filter(
                                                  (s) =>
                                                      s.id !==
                                                      subscriptions.data[0].id
                                              ),
                                              {
                                                  id: subscriptions.data[0].id,
                                                  priceId:
                                                      process.env
                                                          .STRIPE_ACCESS_PRICE,
                                                  dateExpires:
                                                      subscriptions.data[0]
                                                          .current_period_end *
                                                      1000,
                                              },
                                          ]
                                        : [
                                              {
                                                  id: subscriptions.data[0].id,
                                                  priceId:
                                                      process.env
                                                          .STRIPE_ACCESS_PRICE,
                                                  dateExpires:
                                                      subscriptions.data[0]
                                                          .current_period_end *
                                                      1000,
                                              },
                                          ],
                                },
                            },
                        });

                        userToBeUpdated = generateUser(
                            (
                                await databaseService.get({
                                    TableName: usersTable,
                                    Key: { id: req.body.userId },
                                })
                            ).Item
                        ) as ClientUser;

                        await userToBeUpdated.updateLastAccess('all');

                        await updateClientTags(userToBeUpdated.email, ['$780']);

                        if (userToBeUpdated.affiliateCode) {
                            await affiliateService.registerConversion(
                                userToBeUpdated
                            );
                            await affiliateService.registerFinancial(
                                userToBeUpdated,
                                session.amount_total,
                                session.amount_total / 2
                            );
                        }

                        res.status(200).send({
                            url: `${process.env.FRONTEND_BASE_URL}/app/client/browse-talent`,
                        });
                        break;
                    default:
                        res.status(400).send({});
                        break;
                }
            }
        )
);

export default router;
