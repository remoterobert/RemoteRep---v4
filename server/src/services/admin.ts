import * as databaseService from './database';
import {
    usersTable,
    TalentUser,
    ClientUser,
    generateUser,
    AdministratorUser,
} from './auth';
import randomHex from '../utilities/randomHex';
import createError from '../utilities/createError';
import _ from 'lodash';
import crypto from 'crypto';
import * as ghlService from './ghl';
import * as stripeService from './stripe';

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

const getUsers = async () => {
    const scan = await databaseService.scan({
        TableName: usersTable,
    });

    return {
        users: scan.Items?.map((item: any) => {
            const user = generateUser(item);

            if (
                user.accountType === 'client' &&
                !(user as ClientUser).lastAccess
            )
                (user as ClientUser).updateLastAccess();

            return user.toPrivateObject(true);
        }),
    };
};

const patchUser = async (
    adminUser: AdministratorUser,
    targetId: string,
    reqBody: any
) => {
    if (adminUser.id === targetId)
        throw createError(403, 'You cannot update your own details.');

    const get = await databaseService.get({
        TableName: usersTable,
        Key: { id: targetId },
    });

    if (!get.Item) throw createError(404, 'Target not found.');

    const targetUser = generateUser(get.Item);

    if (adminUser.authority <= targetUser.authority)
        throw createError(403, 'You cannot update this user.');

    if (reqBody.accountType) {
        if (reqBody.accountType === 'administrator') {
            if (adminUser.authority < 201)
                throw createError(403, 'You cannot promote users.');

            await databaseService.update({
                TableName: usersTable,
                Key: { id: targetId },
                UpdateExpression: `set accountType=:t, authority=:a`,
                ExpressionAttributeValues: {
                    ':t': reqBody.accountType,
                    ':a': 200,
                },
            });
        } else
            await databaseService.update({
                TableName: usersTable,
                Key: { id: targetId },
                UpdateExpression: `set accountType=:t`,
                ExpressionAttributeValues: {
                    ':t': reqBody.accountType,
                },
            });
    }

    if (reqBody.authority) {
        if (reqBody.authority >= adminUser.authority)
            throw createError(
                403,
                'You cannot promote an user to this authority level.'
            );

        await databaseService.update({
            TableName: usersTable,
            Key: { id: targetId },
            UpdateExpression: `set authority=:a`,
            ExpressionAttributeValues: {
                ':a': reqBody.authority,
            },
        });
    }

    if ('administratorNote' in reqBody || 'administratorTags' in reqBody)
        await databaseService.update({
            TableName: usersTable,
            Key: { id: targetId },
            UpdateExpression: `set administratorNote=:a, administratorTags=:t`,
            ExpressionAttributeValues: {
                ':a': reqBody.administratorNote,
                ':t': reqBody.administratorTags,
            },
        });

    if (reqBody.hasOwnProperty('privilegedAccount')) {
        await databaseService.update({
            TableName: usersTable,
            Key: { id: targetId },
            UpdateExpression: `set privilegedAccount=:p`,
            ExpressionAttributeValues: {
                ':p': reqBody.privilegedAccount,
            },
        });

        if (targetUser.accountType === 'client')
            (targetUser as ClientUser).updateLastAccess(
                reqBody.privilegedAccount ? 'privileged' : null
            );
    }
};

const deleteUser = async (adminUser: AdministratorUser, targetId: string) => {
    if (adminUser.id === targetId)
        throw createError(403, 'You cannot update your own details.');

    const get = await databaseService.get({
        TableName: usersTable,
        Key: { id: targetId },
    });

    if (!get.Item) throw createError(404, 'Target not found.');

    const targetUser = generateUser(get.Item);

    if (adminUser.authority <= targetUser.authority)
        throw createError(403, 'You cannot update this user.');

    await databaseService.deleteById({
        TableName: usersTable,
        Key: { id: targetId },
        UpdateExpression: `delete user = :d`,
    });
};

const registerUser = async (
    adminUser: AdministratorUser,
    reqBody: {
        accountType: 'talent' | 'client' | 'administrator';
        email: string;
        firstName: string;
        lastName: string;
        country: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
        creationReference: string;
        companyName?: string;
    }
) => {
    const emailScan = await databaseService.scan({
        TableName: usersTable,
        FilterExpression: '#e = :e',
        ExpressionAttributeNames: {
            '#e': 'email',
        },
        ExpressionAttributeValues: {
            ':e': reqBody.email.toLowerCase(),
        },
    });
    if (emailScan.Items.length !== 0)
        throw createError(400, 'Email address already exists.');

    const id = await generateId(usersTable);

    const salt = randomHex(16);
    const hashed = crypto
        .pbkdf2Sync(randomHex(16), salt, 100000, 64, 'sha512')
        .toString('hex');

    if (reqBody.accountType === 'administrator') {
        if (adminUser.authority < 201)
            throw createError(403, 'You cannot create administrators.');

        await databaseService.put({
            TableName: usersTable,
            Item: {
                id,
                accountType: 'administrator',
                email: reqBody.email,
                phone: reqBody.phone,
                password: {
                    salt,
                    hashed,
                },
                contact: {
                    firstName: reqBody.firstName,
                    lastName: reqBody.lastName,
                    addressCity: reqBody.city,
                    addressState: reqBody.state,
                    addressCountry: reqBody.country,
                    addressZip: reqBody.zip,
                },
                authority: 200,
                emailVerification: '',
                dateCreated: Date.now(),
                dateUpdated: Date.now(),
                creationReference: `Administrator-registered (${reqBody.creationReference})`,
            },
        });
    } else {
        if (reqBody.accountType === 'talent') {
            await databaseService.put({
                TableName: usersTable,
                Item: {
                    id,
                    accountType: reqBody.accountType,
                    email: reqBody.email,
                    phone: reqBody.phone,
                    password: {
                        salt,
                        hashed,
                    },
                    contact: {
                        firstName: reqBody.firstName,
                        lastName: reqBody.lastName,
                        addressCity: reqBody.city,
                        addressState: reqBody.state,
                        addressCountry: reqBody.country,
                        addressZip: reqBody.zip,
                    },
                    authority: 101,
                    emailVerification: '',
                    dateCreated: Date.now(),
                    dateUpdated: Date.now(),
                    creationReference: `Administrator-registered (${reqBody.creationReference})`,
                },
            });

            await ghlService.createTalent({
                email: reqBody.email,
                phone: reqBody.phone,
                fullName: `${reqBody.firstName} ${reqBody.lastName}`,
                source: 'Administrator-registered',
            });
        } else if (reqBody.accountType === 'client') {
            await databaseService.put({
                TableName: usersTable,
                Item: {
                    id,
                    accountType: reqBody.accountType,
                    email: reqBody.email,
                    phone: reqBody.phone,
                    password: {
                        salt,
                        hashed,
                    },
                    contact: {
                        firstName: reqBody.firstName,
                        lastName: reqBody.lastName,
                        addressCity: reqBody.city,
                        addressState: reqBody.state,
                        addressCountry: reqBody.country,
                        addressZip: reqBody.zip,
                        companyName: reqBody.companyName,
                    },
                    authority: 101,
                    emailVerification: '',
                    dateCreated: Date.now(),
                    dateUpdated: Date.now(),
                    creationReference: `Administrator-registered (${reqBody.creationReference})`,
                },
            });

            await ghlService.createClient({
                email: reqBody.email,
                phone: reqBody.phone,
                fullName: `${reqBody.firstName} ${reqBody.lastName}`,
                companyName: reqBody.companyName,
                source: 'Administrator-registered',
            });
        }
    }
};

const resetPassword = async (
    adminUser: AdministratorUser,
    targetId: string
) => {
    if (adminUser.id === targetId)
        throw createError(403, 'You cannot use actions on yourself.');

    const get = await databaseService.get({
        TableName: usersTable,
        Key: { id: targetId },
    });

    if (!get.Item) throw createError(404, 'Target not found.');

    const targetUser = generateUser(get.Item);

    if (adminUser.authority <= targetUser.authority)
        throw createError(403, 'You cannot use actions on this user.');

    await targetUser.sendPasswordResetEmail();
};

const impersonate = async (adminUser: AdministratorUser, targetId: string) => {
    if (adminUser.id === targetId)
        throw createError(403, 'You cannot use actions on yourself.');

    const get = await databaseService.get({
        TableName: usersTable,
        Key: { id: targetId },
    });

    if (!get.Item) throw createError(404, 'Target not found.');

    const targetUser = generateUser(get.Item);

    if (adminUser.authority <= targetUser.authority)
        throw createError(403, 'You cannot use actions on this user.');

    return { token: await targetUser.generateJwtToken() };
};

const getCounts = async () => {
    const usersScan = await databaseService.scan({
        TableName: usersTable,
    });

    const listingsScan = await databaseService.scan({
        TableName: listingsTable,
    });

    const counts = {
        talent: usersScan.Items.filter((u: any) => u.accountType === 'talent')
            .length,
        clients: usersScan.Items.filter((u: any) => u.accountType === 'client')
            .length,
        listings: listingsScan.Items.length,
        applications: 0,
    };

    listingsScan.Items.forEach((l: any) => {
        counts['applications'] =
            counts['applications'] + (l?.applications?.length || 0);
    });

    return counts;
};

const getPaymentCounts = async () => {
    const invoices = (await stripeService.getInvoices()).filter(
        (i) => i.status === 'paid'
    );

    const counts = {
        'Paying clients': `${invoices
            .filter((i) =>
                [process.env.STRIPE_ACCESS_PRICE].includes(
                    i.lines.data[0].price.id
                )
            )
            .length.toLocaleString()} ($${(
            invoices
                .filter((i) =>
                    [process.env.STRIPE_ACCESS_PRICE].includes(
                        i.lines.data[0].price.id
                    )
                )
                .reduce((prev, next) => prev + next.total, 0) / 100
        ).toLocaleString()} per year)`,
        'Paid listings': `${invoices
            .filter((i) =>
                [process.env.STRIPE_LISTING_PRICE].includes(
                    i.lines.data[0].price.id
                )
            )
            .length.toLocaleString()} ($${(
            invoices
                .filter((i) =>
                    [process.env.STRIPE_LISTING_PRICE].includes(
                        i.lines.data[0].price.id
                    )
                )
                .reduce((prev, next) => prev + next.total, 0) / 100
        ).toLocaleString()})`,
    };

    return counts;
};

const changePassword = async (
    adminUser: AdministratorUser,
    targetId: string,
    reqBody: any
) => {
    if (adminUser.id === targetId)
        throw createError(403, 'You cannot update your own details.');

    const get = await databaseService.get({
        TableName: usersTable,
        Key: { id: targetId },
    });

    if (!get.Item) throw createError(404, 'Target not found.');

    const targetUser = generateUser(get.Item);

    if (adminUser.authority <= targetUser.authority)
        throw createError(403, 'You cannot update this user.');

    const salt = randomHex(16);
    const hashed = crypto
        .pbkdf2Sync(reqBody.password, salt, 100000, 64, 'sha512')
        .toString('hex');

    await databaseService.update({
        TableName: usersTable,
        Key: { id: targetUser.id },
        UpdateExpression: `set password.salt=:s, password.hashed=:h`,
        ExpressionAttributeValues: {
            ':s': salt,
            ':h': hashed,
        },
    });
};

export {
    getUsers,
    patchUser,
    registerUser,
    resetPassword,
    impersonate,
    getCounts,
    getPaymentCounts,
    deleteUser,
    changePassword,
};
