import * as databaseService from './database';
import * as stripeService from './stripe';
import { usersTable, TalentUser, ClientUser, generateUser, User } from './auth';
import randomHex from '../utilities/randomHex';
import createError from '../utilities/createError';
import _ from 'lodash';
import * as notificationsService from './notifications';
import * as emailService from './email';
import * as affiliateService from './affiliate';
import { sendNotifications } from './pushNotifications';

const listingsTable = `v3-listings-${process.env.DEPLOYMENT_STAGE}`;

const idExists = async (id: string, tableName: string): Promise<boolean> => {
    try {
        const get = await databaseService.get({
            TableName: tableName,
            Key: {
                id,
            },
        });

        return !!get?.Item;
    } catch {
        console.error(`idExists failed for ${id}`);
        return true;
    }
};

const generateId = async (tableName: string) => {
    let cache = randomHex(8);
    if (await idExists(cache, tableName)) return await generateId(tableName);
    return cache;
};

const checkAccess = async (user: ClientUser) => {
    const listingsScan = await databaseService.scan({
        TableName: listingsTable,
    });

    return !!(
        user &&
        (user?.privilegedAccount ||
            user?.stripe?.subscriptions?.find(
                (s) => s.priceId === process.env.STRIPE_ACCESS_PRICE!
            )?.dateExpires > Date.now() ||
            listingsScan?.Items?.filter((l) => l.client === user?.id)?.every(
                (l) => !l.hasOwnProperty('paidFor')
            ))
    );
};

const createListing = async (
    user: ClientUser,
    reqBody: any
): Promise<string> => {
    // const listingsScan = await databaseService.scan({
    //     TableName: listingsTable,
    // });

    // if (
    //     listingsScan?.Items?.filter((l) => l.client === user?.id)?.length &&
    //     !(
    //         user?.privilegedAccount ||
    //         user?.stripe?.subscriptions?.find(
    //             (s) => s.priceId === process.env.STRIPE_ACCESS_PRICE!
    //         )?.dateExpires > Date.now() ||
    //         listingsScan?.Items?.filter((l) => l.client === user?.id)?.every(
    //             (l) => !l.hasOwnProperty('paidFor')
    //         )
    //     )
    // )
    //     throw createError(403, 'You must pay to create additional listings.');

    const id = await generateId(listingsTable);

    await databaseService.put({
        TableName: listingsTable,
        Item: {
            id,
            client: user.id,
            title: reqBody.basics.title,
            description: reqBody.basics.description,
            details: reqBody.details,
            requirements: reqBody.requirements,
            instructions: reqBody.instructions.instructions,
            calendarLink: reqBody.instructions.calendarLink,
            dateCreated: Date.now(),
            dateUpdated: Date.now(),
            paidFor: false,
        },
    });

    return id;
};

const getListings = async (user: ClientUser) => {
    const scan = await databaseService.scan({
        TableName: listingsTable,
        FilterExpression: '#c = :c',
        ExpressionAttributeNames: {
            '#c': 'client',
        },
        ExpressionAttributeValues: {
            ':c': user.id,
        },
    });

    return {
        listings: scan.Items,
    };
};

const getListing = async (user: ClientUser, id: string) => {
    const get = await databaseService.get({
        TableName: listingsTable,
        Key: { id },
    });

    if (!get.Item) throw createError(404, 'Listing not found.');

    if (get.Item.client !== user.id)
        throw createError(
            403,
            'You are not authorized to access this listing.'
        );

    return get.Item;
};

const patchListing = async (user: ClientUser, id: string, reqBody: any) => {
    const cacheListing = await getListing(user, id);

    if (reqBody.basics) {
        await databaseService.update({
            TableName: listingsTable,
            Key: { id },
            UpdateExpression: `set title=:t, description=:d`,
            ExpressionAttributeValues: {
                ':t': reqBody.basics.title,
                ':d': reqBody.basics.description,
            },
        });
    }

    if (reqBody.instructions) {
        await databaseService.update({
            TableName: listingsTable,
            Key: { id },
            UpdateExpression: `set instructions=:i, calendarLink=:c`,
            ExpressionAttributeValues: {
                ':i': reqBody.instructions.instructions,
                ':c': reqBody.instructions.calendarLink,
            },
        });
    }

    if (reqBody.details) {
        await databaseService.update({
            TableName: listingsTable,
            Key: { id },
            UpdateExpression: `set details=:d`,
            ExpressionAttributeValues: {
                ':d': reqBody.details,
            },
        });
    }

    if (reqBody.requirements) {
        await databaseService.update({
            TableName: listingsTable,
            Key: { id },
            UpdateExpression: `set requirements=:r`,
            ExpressionAttributeValues: {
                ':r': reqBody.requirements,
            },
        });
    }

    let ret = { ...cacheListing, ...reqBody };

    if (reqBody.basics) ret = { ...ret, ...reqBody.basics, basics: undefined };

    if (reqBody.instructions) ret = { ...ret, ...reqBody.instructions };

    return ret;
};

const getTalent = async (user: ClientUser) => {
    const scan = await databaseService.scan({
        TableName: usersTable,
        FilterExpression: '#t = :t and #a > :a and #d.#o = :true',
        ExpressionAttributeNames: {
            '#t': 'accountType',
            '#a': 'authority',
            '#d': 'talentData',
            '#o': 'onboardingComplete',
        },
        ExpressionAttributeValues: {
            ':t': 'talent',
            ':a': 100,
            ':true': true,
        },
    });

    const { access } = await getAccess(user);

    return {
        talent: scan.Items?.filter((item: any) => !item?.profileHidden)?.map(
            (item: any) => {
                const cache = new TalentUser(item).toPublicObject();

                return {
                    ...cache,
                    talentData: {
                        ...cache.talentData,
                        profile: {
                            ...cache.talentData.profile,
                            photoUrl: access
                                ? cache.talentData.profile.photoUrl
                                : '',
                        },
                        files: access ? cache?.talentData?.files : undefined,
                    },
                    contact: access
                        ? cache.contact
                        : {
                              ...cache.contact,
                              lastName: '',
                              addressState: '',
                              addressZip: '',
                              addressCity: '',
                          },
                };
            }
        ),
    };
};

const getApplications = async (user: ClientUser, id: string) => {
    const get = await databaseService.get({
        TableName: listingsTable,
        Key: { id },
    });

    if (!get.Item) throw createError(404, 'Listing not found.');

    if (get.Item.client !== user.id)
        throw createError(
            403,
            'You are not authorized to access this listing.'
        );

    const talentData = {};

    if (get?.Item?.applications) {
        for await (const a of get.Item.applications) {
            const talentGet = await databaseService.get({
                TableName: usersTable,
                Key: { id: a.talent },
            });

            const { access } = await getAccess(user);

            const cache = new TalentUser(talentGet.Item).toPublicObject();

            const talentToSend = !talentGet.Item
                ? {
                      deleted: true,
                  }
                : talentGet.Item.authority <= 99
                ? {
                      suspended: true,
                  }
                : {
                      ...cache,
                      resume: (await checkAccess(user))
                          ? talentGet.Item?.talentData?.files?.resume
                          : undefined,
                      talentData: {
                          ...cache?.talentData,
                          profile: {
                              ...cache?.talentData?.profile,
                              photoUrl: access
                                  ? cache?.talentData?.profile?.photoUrl
                                  : '',
                          },
                      },
                      contact: access
                          ? cache?.contact
                          : {
                                ...cache?.contact,
                                lastName: '',
                                addressState: '',
                                addressZip: '',
                                addressCity: '',
                            },
                  };

            talentData[a.talent] = {
                ...talentToSend,
            };
        }

        const hasAccess = await checkAccess(user);

        return {
            applications: get.Item.applications.map((a: any) => {
                return {
                    ...a,
                    talent: {
                        ...talentData[a.talent],
                        resume:
                            a.applicationStatus !== 'invited' && hasAccess
                                ? talentData[a.talent]?.resume
                                : undefined,
                    },
                };
            }),
        };
    } else return { applications: [] };
};

const patchApplication = async (
    user: ClientUser,
    listingId: string,
    talentId: string,
    applicationDetails: {
        applicationStatus?: string;
        applicationRating?: number;
    }
) => {
    const get = await databaseService.get({
        TableName: listingsTable,
        Key: { id: listingId },
    });

    if (!get.Item) throw createError(404, 'Listing not found.');

    if (get.Item.client !== user.id)
        throw createError(
            403,
            'You are not authorized to access this listing.'
        );

    const cacheApplications = get.Item.applications;
    const currentApplication = cacheApplications.find(
        (a: any) => a.talent === talentId
    );
    const currentIndex = cacheApplications.findIndex(
        (a: any) => a.talent === talentId
    );

    if (!currentApplication) throw createError(404, 'Application not found.');

    if (applicationDetails?.applicationStatus) {
        if (applicationDetails.applicationStatus === 'invited')
            throw createError(400, 'Talent has already applied.');

        if (currentApplication?.applicationStatus === 'invited')
            throw createError(
                403,
                'You are not authorized to modify this application.'
            );

        cacheApplications[currentIndex] = {
            ...currentApplication,
            applicationStatus: applicationDetails.applicationStatus,
        };

        const listingGet = await databaseService.get({
            TableName: listingsTable,
            Key: { id: listingId },
        });

        const targetGet = await databaseService.get({
            TableName: usersTable,
            Key: { id: talentId },
        });

        const targetUser = generateUser(targetGet.Item);

        if (
            applicationDetails.applicationStatus === 'hired' &&
            targetUser.affiliateCode
        ) {
            const cu = await user.updateLastAccess();
            if (cu.lastAccess === 'listing')
                await affiliateService.registerFinancial(targetUser, 0, 598);
            else if (cu.lastAccess === 'all')
                await affiliateService.registerFinancial(targetUser, 0, 1560);
        }

        notificationsService.putNotification(
            targetUser,
            {
                notificationType: 'talentApplication',
                applicationStatus: applicationDetails?.applicationStatus as
                    | 'invited'
                    | 'applied'
                    | 'interviewing'
                    | 'shortlisted'
                    | 'hired',
                clientId: user.id,
                deduplicationId: `application-${listingId}`,
                listingId: listingId,
                notificationTitle: `Update on your application for listing ${listingGet.Item.title}`,
                notificationText: `You have a update on your application for listing ${listingGet.Item.title}.`,
            },
            true
        );

        emailService.sendEmail({
            language: 'applicationUpdated',
            target: targetGet.Item.email,
            replace: { $LISTING_NAME: listingGet.Item.title },
        });

        sendNotifications(
            targetGet.Item?.vapid || [],
            'applicationUpdated',
            null,
            { $LISTING_NAME: listingGet.Item.title }
        );
    }

    if (applicationDetails?.applicationRating >= -2) {
        cacheApplications[currentIndex] = {
            ...currentApplication,
            applicationRating: applicationDetails.applicationRating,
        };
    }

    await databaseService.update({
        TableName: listingsTable,
        Key: { id: listingId },
        UpdateExpression: `set applications=:a`,
        ExpressionAttributeValues: {
            ':a': cacheApplications,
        },
    });

    return await getApplications(user, listingId);
};

const postApplication = async (
    user: ClientUser,
    listingId: string,
    talentId: string
) => {
    const listingGet = await databaseService.get({
        TableName: listingsTable,
        Key: { id: listingId },
    });

    if (!listingGet.Item) throw createError(404, 'Listing not found');

    if (listingGet?.Item?.client !== user.id)
        throw createError(403, 'You are not authorized to manage this listing');

    const cacheApplications: any[] = listingGet.Item?.applications || [];

    if (cacheApplications.find((a: any) => a.talent === talentId))
        throw createError(400, 'Already applied');

    const newApplication = {
        talent: talentId,
        applicationStatus: 'invited',
        dateCreated: Date.now(),
        dateUpdated: Date.now(),
    };

    await databaseService.update({
        TableName: listingsTable,
        Key: { id: listingId },
        UpdateExpression: `set applications = :a`,
        ExpressionAttributeValues: {
            ':a': [...cacheApplications, newApplication],
        },
    });

    const targetGet = await databaseService.get({
        TableName: usersTable,
        Key: { id: talentId },
    });

    emailService.sendEmail({
        language: 'invitedToApply',
        target: targetGet.Item.email,
        replace: {
            $LISTING_NAME: listingGet.Item.title,
            $COMPANY_NAME: user?.contact?.companyName,
        },
    });

    sendNotifications(targetGet.Item?.vapid || [], 'applicationUpdated', null, {
        $LISTING_NAME: listingGet.Item.title,
    });
};

const deleteAccount = async (id: string) => {
    await databaseService.deleteById({
        TableName: usersTable,
        Key: { id: id },
        UpdateExpression: `delete user = :d`,
    });
};

const getAccess = async (
    user: ClientUser
): Promise<{
    access: boolean;
    type?: 'listing' | 'legacy' | 'all' | 'privileged';
}> => {
    if (user?.privilegedAccount) return { access: true, type: 'privileged' };

    const subscription = user?.stripe?.subscriptions?.find(
        (s) => s.priceId === process.env.STRIPE_ACCESS_PRICE!
    );

    if (subscription) {
        if (subscription.dateExpires > Date.now())
            return { access: true, type: 'all' };
        else {
            const stripeSubscription = await stripeService.getSubscription(
                subscription.id
            );

            if (stripeSubscription.status === 'active') {
                if (
                    subscription.dateExpires !==
                    stripeSubscription.current_period_end * 1000
                ) {
                    subscription.dateExpires =
                        stripeSubscription.current_period_end * 1000;

                    await databaseService.update({
                        TableName: usersTable,
                        Key: { id: user.id },
                        UpdateExpression: 'set stripe.subscriptions=:s',
                        ExpressionAttributeValues: {
                            ':s': [
                                ...user.stripe.subscriptions.filter(
                                    (s) => s.id !== subscription.id
                                ),
                                subscription,
                            ],
                        },
                    });
                }

                return { access: true, type: 'all' };
            } else {
                await databaseService.update({
                    TableName: usersTable,
                    Key: { id: user.id },
                    UpdateExpression: 'set stripe.subscriptions=:s',
                    ExpressionAttributeValues: {
                        ':s': user.stripe.subscriptions.filter(
                            (s) => s.id !== subscription.id
                        ),
                    },
                });
                return { access: false };
            }
        }
    } else {
        const listings: any[] = (await getListings(user))?.listings;
        if (listings?.length) {
            if (listings.some((l) => l.paidFor))
                return { access: true, type: 'listing' };
            else if (listings.every((l) => !l.hasOwnProperty('paidFor')))
                return { access: true, type: 'legacy' };
        }

        return { access: false };
    }
};

const getSession = async (user: ClientUser, listingId?: string) =>
    await stripeService.createSession(
        user,
        listingId ? 'listing' : 'access',
        listingId ? `&listingId=${listingId}` : ''
    );

const getSubscription = async (user: ClientUser) => {
    const subscription = user?.stripe?.subscriptions?.find(
        (s) => s.priceId === process.env.STRIPE_ACCESS_PRICE!
    );

    if (!subscription) throw createError(404, 'Subscription not found.');

    const stripeSubscription = await stripeService.getSubscription(
        subscription.id
    );

    return {
        isActive: !stripeSubscription.cancel_at_period_end,
        dateExpires: stripeSubscription.current_period_end * 1000,
        amount: 780,
    };
};

const cancelSubscription = async (user: ClientUser) => {
    const subscription = user?.stripe?.subscriptions?.find(
        (s) => s.priceId === process.env.STRIPE_ACCESS_PRICE!
    );

    if (!subscription) throw createError(404, 'Subscription not found.');

    await stripeService.cancelSubscription(subscription.id);

    if (user.affiliateCode) await affiliateService.registerChurn(user);

    return {
        isActive: false,
    };
};

const resumeSubscription = async (user: ClientUser) => {
    const subscription = user?.stripe?.subscriptions?.find(
        (s) => s.priceId === process.env.STRIPE_ACCESS_PRICE!
    );

    if (!subscription) throw createError(404, 'Subscription not found.');

    await stripeService.resumeSubscription(subscription.id);

    return {
        isActive: true,
    };
};

const updateListingVisibility = async (id, { visibility }) => {
    await databaseService.update({
        TableName: listingsTable,
        Key: { id },
        UpdateExpression: `set listingHidden = :a`,
        ExpressionAttributeValues: {
            ':a': !visibility,
        },
    });
};

export {
    listingsTable,
    createListing,
    getListings,
    getListing,
    patchListing,
    getTalent,
    getApplications,
    patchApplication,
    postApplication,
    deleteAccount,
    getAccess,
    getSession,
    getSubscription,
    cancelSubscription,
    resumeSubscription,
    updateListingVisibility,
};
