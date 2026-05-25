import * as databaseService from './database';
import { usersTable, TalentUser, ClientUser, generateUser } from './auth';
import createError from '../utilities/createError';
import * as notificationsService from './notifications';
import * as emailService from './email';
import { sendNotifications } from './pushNotifications';

const listingsTable = `v3-listings-${process.env.DEPLOYMENT_STAGE}`;

const getClients = async () => {
    const scan = await databaseService.scan({
        TableName: usersTable,
        FilterExpression: '#t = :t and #a > :a and #d.#o = :true',
        ExpressionAttributeNames: {
            '#t': 'accountType',
            '#a': 'authority',
            '#d': 'clientData',
            '#o': 'onboardingComplete',
        },
        ExpressionAttributeValues: {
            ':t': 'client',
            ':a': 100,
            ':true': true,
        },
    });

    // const listingsScan = await databaseService.scan({
    //     TableName: listingsTable,
    // });

    return {
        clients: scan.Items?.filter((item: any) => !item?.profileHidden)
            ?.map((item: any) => new ClientUser(item))
            // ?.filter(
            //     (user: ClientUser) =>
            //         user?.privilegedAccount ||
            //         user?.stripe?.subscriptions?.find(
            //             (s) => s.priceId === process.env.STRIPE_ACCESS_PRICE!
            //         )?.dateExpires > Date.now() ||
            //         listingsScan?.Items?.filter((l) => l.client)?.every(
            //             (l) => !l.hasOwnProperty('paidFor')
            //         ) ||
            //         listingsScan?.Items?.filter((l) => l.client)?.some(
            //             (l) => l?.paidFor
            //         )
            // )
            ?.map((user: ClientUser) => user.toPublicObject()),
    };
};

const getListings = async (selfUser: TalentUser) => {
    const listingsScan = await databaseService.scan({
        TableName: listingsTable,
    });

    const clientsScan = await databaseService.scan({
        TableName: usersTable,
        FilterExpression: '#t = :t',
        ExpressionAttributeNames: {
            '#t': 'accountType',
        },
        ExpressionAttributeValues: {
            ':t': 'client',
        },
    });

    const listings = listingsScan.Items?.filter(
        (item: any) => !item?.listingHidden
    )
        ?.map((item: any) => {
            let client =
                // : any;

                // const cacheClient

                clientsScan.Items?.find((c: any) => c.id === item.client);

            // if (
            //     cacheClient &&
            //     (cacheClient?.privilegedAccount ||
            //         cacheClient?.stripe?.subscriptions?.find(
            //             (s) => s.priceId === process.env.STRIPE_ACCESS_PRICE!
            //         )?.dateExpires > Date.now() ||
            //         item?.paidFor ||
            //         listingsScan?.Items?.filter(
            //             (l) => l.client === cacheClient?.id
            //         )?.every((l) => !l.hasOwnProperty('paidFor')))
            // )
            // client = cacheClient;

            const clientToSend = !client
                ? { deleted: true }
                : client?.authority <= 99
                ? {
                      suspended: true,
                  }
                : new ClientUser(client).toPublicObject();

            return {
                ...item,
                calendarLink: undefined,
                client: clientToSend,
                applications: item?.applications?.filter(
                    ({ talent }) => talent === selfUser.id
                ),
            };
        })
        .filter(
            ({ client }) => client && !client?.deleted && !client?.suspended
        );

    return { listings };
};

const postApplication = async (
    user: TalentUser,
    reqBody: { listingId: string; applicationMessage?: string }
) => {
    const listingGet = await databaseService.get({
        TableName: listingsTable,
        Key: { id: reqBody.listingId },
    });

    if (!listingGet.Item) throw createError(404, 'Listing not found');

    const cacheApplications: any[] = listingGet.Item?.applications || [];

    const existingApplication = cacheApplications.find(
        (a: any) => a.talent === user.id
    );

    const existingApplicationIndex = cacheApplications.findIndex(
        (a: any) => a.talent === user.id
    );

    if (
        existingApplication &&
        existingApplication.applicationStatus !== 'invited'
    )
        throw createError(400, 'Already applied');

    const newApplication = existingApplication
        ? reqBody?.applicationMessage
            ? {
                  ...existingApplication,
                  applicationStatus: 'applied',
                  dateUpdated: Date.now(),
                  applicationMessage: reqBody.applicationMessage,
              }
            : {
                  ...existingApplication,
                  applicationStatus: 'applied',
                  dateUpdated: Date.now(),
              }
        : reqBody?.applicationMessage
        ? {
              talent: user.id,
              applicationMessage: reqBody.applicationMessage,
              applicationStatus: 'applied',
              dateCreated: Date.now(),
              dateUpdated: Date.now(),
          }
        : {
              talent: user.id,
              applicationStatus: 'applied',
              dateCreated: Date.now(),
              dateUpdated: Date.now(),
          };

    if (existingApplicationIndex > -1)
        cacheApplications.splice(existingApplicationIndex, 1);

    await databaseService.update({
        TableName: listingsTable,
        Key: { id: reqBody.listingId },
        UpdateExpression: `set applications = :a`,
        ExpressionAttributeValues: {
            ':a': [...cacheApplications, newApplication],
        },
    });

    const targetGet = await databaseService.get({
        TableName: usersTable,
        Key: { id: listingGet.Item.client },
    });

    notificationsService.putNotification(
        generateUser(targetGet.Item),
        {
            notificationType: 'clientApplication',
            deduplicationId: `application-${listingGet.Item.id}`,
            listingId: listingGet.Item.id,
            notificationTitle: `New application for listing ${listingGet.Item.title}`,
            notificationText: `You have a new application for listing ${listingGet.Item.title}.`,
            talentIds: [user.id],
        },
        true
    );

    emailService.sendEmail({
        language: 'applicationSubmitted',
        target: user.email,
        replace: { $COMPANY_NAME: targetGet.Item?.contact?.companyName },
    });
    sendNotifications(user?.vapid || [], 'applicationSubmitted', null, {
        $COMPANY_NAME: targetGet.Item?.contact?.companyName,
    });

    emailService.sendEmail({
        language: 'newApplication',
        target: targetGet.Item.email,
        replace: {
            $TALENT_NAME: user.getFullName(),
            $LISTING_NAME: listingGet.Item.title,
        },
    });
    sendNotifications(targetGet.Item?.vapid || [], 'newApplication', null, {
        $TALENT_NAME: user.getFullName(),
        $LISTING_NAME: listingGet.Item.title,
    });
};

const getApplications = async (user: TalentUser) => {
    const clientScan = await databaseService.scan({
        TableName: usersTable,
        FilterExpression: '#t = :t and #a > :a and #d.#o = :true',
        ExpressionAttributeNames: {
            '#t': 'accountType',
            '#a': 'authority',
            '#d': 'clientData',
            '#o': 'onboardingComplete',
        },
        ExpressionAttributeValues: {
            ':t': 'client',
            ':a': 98,
            ':true': true,
        },
    });

    const listingScan = await databaseService.scan({
        TableName: listingsTable,
    });

    const applications = [];

    listingScan.Items.forEach((l: any) => {
        const la = l?.applications?.find((a: any) => a.talent === user.id);
        const client = clientScan.Items?.find((c: any) => c.id === l.client);
        const clientToSend = !client
            ? { deleted: true }
            : client?.authority <= 99
            ? {
                  suspended: true,
              }
            : new ClientUser(client).toPublicObject();

        if (la)
            applications.push({
                ...la,
                listing: {
                    id: l.id,
                    title: l.title,
                    calendarLink:
                        client &&
                        (client?.privilegedAccount ||
                            client?.stripe?.subscriptions?.find(
                                (s) =>
                                    s.priceId ===
                                    process.env.STRIPE_ACCESS_PRICE!
                            )?.dateExpires > Date.now() ||
                            l?.paidFor ||
                            listingScan?.Items?.filter(
                                (l) => l.client === client?.id
                            )?.every((l) => !l.hasOwnProperty('paidFor'))) &&
                        (la.applicationStatus === 'interviewing' ||
                            la.applicationStatus === 'shortlisted')
                            ? l.calendarLink
                            : undefined,
                },
                client: clientToSend,
                applicationRating: undefined,
            });
    });

    return { applications };
};

const getClient = async (id: string) => {
    const scan = await databaseService.scan({
        TableName: usersTable,
        FilterExpression: '#t = :t and #a > :a and #d.#o = :true and #i=:i',
        ExpressionAttributeNames: {
            '#t': 'accountType',
            '#a': 'authority',
            '#d': 'clientData',
            '#o': 'onboardingComplete',
            '#i': 'id',
        },
        ExpressionAttributeValues: {
            ':t': 'client',
            ':a': 100,
            ':true': true,
            ':i': id,
        },
    });

    const listingsScan = await databaseService.scan({
        TableName: listingsTable,
        FilterExpression: '#c = :c',
        ExpressionAttributeNames: {
            '#c': 'client',
        },
        ExpressionAttributeValues: {
            ':c': id,
        },
    });

    const clientWithListings = {
        ...scan.Items[0],
        clientData: {
            ...scan.Items[0].clientData,
            listings: listingsScan.Items,
        },
    };

    if (!scan.Items?.length) throw createError(404, 'Client not found');

    return {
        client: new ClientUser(clientWithListings).toPublicObject(),
    };
};

const deleteAccount = async (id: string) => {
    await databaseService.deleteById({
        TableName: usersTable,
        Key: { id: id },
        UpdateExpression: `delete user = :d`,
    });
};

export {
    getClients,
    getListings,
    postApplication,
    getApplications,
    getClient,
    deleteAccount,
};
