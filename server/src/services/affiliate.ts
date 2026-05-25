import * as databaseService from './database';
import randomHex from '../utilities/randomHex';
import createError from '../utilities/createError';
import _ from 'lodash';
import { User, generateUser, usersTable } from './auth';
import { listingsTable } from './client';
import { stripe } from './stripe';
import { updateClientTags, updateTalentTags } from './ghl';

export type ReferralCode = {
    id: string;
    creator: string;
    visitors: { dx: number }[];
    leads: { id: string; dx: number }[];
    conversions: { id: string; dx: number }[];
    churned: { id: string; dx: number }[];
    revenue: { id: string; amount: number; dx: number }[];
    commissions: { id: string; amount: number; dx: number }[];
    dateCreated: number;
    dateUpdated: number;
};

const referralsTable = `v3-referrals-${process.env.DEPLOYMENT_STAGE}`;

const idExists = async (id: string): Promise<boolean> => {
    try {
        const get = await databaseService.get({
            TableName: referralsTable,
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

const generateId = async () => {
    let cache = randomHex(8);
    if (await idExists(cache)) return await generateId();
    return cache;
};

const getCode = async (user: User) => {
    const codeScan = await databaseService.scan({
        TableName: referralsTable,
        FilterExpression: 'creator = :c',
        ExpressionAttributeValues: {
            ':c': user.id,
        },
    });

    if (!codeScan.Items.length) return null;
    else return codeScan.Items[0];
};

const createCode = async (user: User) => {
    if (await getCode(user))
        throw createError(400, 'User already has an affiliate code');

    const id = await generateId();

    const referral: ReferralCode = {
        id,
        creator: user.id,
        visitors: [],
        leads: [],
        conversions: [],
        churned: [],
        revenue: [],
        commissions: [],
        dateCreated: Date.now(),
        dateUpdated: Date.now(),
    };

    await databaseService.put({ TableName: referralsTable, Item: referral });

    return referral;
};

const activate = async (user: User) => {
    if (user.affiliateAccess === 'suspended')
        throw createError(403, 'Your account is suspended');

    user.affiliateAccess = 'active';

    await databaseService.update({
        TableName: usersTable,
        Key: { id: user.id },
        UpdateExpression: `set affiliateAccess=:a`,
        ExpressionAttributeValues: {
            ':a': user.affiliateAccess,
        },
    });

    if (user.accountType === 'client')
        updateClientTags(user.email, ['Affiliate']);
    else if (user.accountType === 'talent')
        updateTalentTags(user.email, ['Affiliate']);

    return await createCode(user);
};

const registerClick = async (code: string) => {
    const get = await databaseService.get({
        TableName: referralsTable,
        Key: {
            id: code,
        },
    });

    if (!get.Item) throw createError(404, 'Code not found');
    else
        await databaseService.update({
            TableName: referralsTable,
            Key: { id: code },
            UpdateExpression: `set visitors = list_append(visitors, :v)`,
            ExpressionAttributeValues: {
                ':v': [
                    {
                        dx: Date.now(),
                    },
                ],
            },
        });
};

const registerLead = async (user: User) => {
    await databaseService.update({
        TableName: referralsTable,
        Key: { id: user.affiliateCode },
        UpdateExpression: `set leads = list_append(leads, :l)`,
        ExpressionAttributeValues: {
            ':l': [
                {
                    id: user.id,
                    dx: Date.now(),
                },
            ],
        },
    });
};

const registerConversion = async (user: User) => {
    const codeData = await databaseService.get({
        TableName: referralsTable,
        Key: { id: user.affiliateCode },
    });

    if (!codeData?.Item?.conversions?.some((c) => c.id === user.id))
        await databaseService.update({
            TableName: referralsTable,
            Key: { id: user.affiliateCode },
            UpdateExpression: `set conversions = list_append(conversions, :c)`,
            ExpressionAttributeValues: {
                ':c': [
                    {
                        id: user.id,
                        dx: Date.now(),
                    },
                ],
            },
        });
};

const registerChurn = async (user: User) => {
    const codeData = await databaseService.get({
        TableName: referralsTable,
        Key: { id: user.affiliateCode },
    });

    if (!codeData?.Item?.churned?.some((c) => c.id === user.id))
        await databaseService.update({
            TableName: referralsTable,
            Key: { id: user.affiliateCode },
            UpdateExpression: `set churned = list_append(churned, :c)`,
            ExpressionAttributeValues: {
                ':c': [
                    {
                        id: user.id,
                        dx: Date.now(),
                    },
                ],
            },
        });
};

const dirtyDecimal = (num: number) => Math.floor(num) / 100;

const registerFinancial = async (
    user: User,
    revenue: number,
    commission: number
) => {
    await databaseService.update({
        TableName: referralsTable,
        Key: { id: user.affiliateCode },
        UpdateExpression: `set revenue = list_append(revenue, :r), commissions = list_append(commissions, :c)`,
        ExpressionAttributeValues: {
            ':r': [
                {
                    id: user.id,
                    amount: dirtyDecimal(revenue),
                    dx: Date.now(),
                },
            ],
            ':c': [
                {
                    id: user.id,
                    amount: dirtyDecimal(commission),
                    dx: Date.now(),
                },
            ],
        },
    });
};

const getReferred = async (user: User) => {
    const code = await getCode(user);

    const usersScan = await databaseService.scan({
        TableName: usersTable,
        FilterExpression: 'affiliateCode = :a',
        ExpressionAttributeValues: {
            ':a': code.id,
        },
    });

    if (!usersScan?.Items?.length)
        return {
            referredClients: [],
            referredTalent: [],
        };

    const users: User[] = usersScan.Items.map((u) => generateUser(u));

    const listingsScan = await databaseService.scan({
        TableName: listingsTable,
    });

    return {
        referredClients: users
            .filter((u) => u.accountType === 'client')
            .map((u) => ({
                name: u.contact.companyName,
                dx: code.leads.find((l) => l.id === u.id).dx,
                listings:
                    listingsScan?.Items?.filter((l) => l.client === u.id)
                        ?.length || 0,
                hires:
                    listingsScan?.Items?.filter(
                        (l) => l.client === u.id
                    )?.reduce(
                        (last, curr) =>
                            last +
                            (curr.applications?.filter(
                                (a) => a.applicationStatus === 'hired'
                            )?.length || 0),
                        0
                    ) || 0,
                revenue: code.revenue
                    .filter((r) => r.id === u.id)
                    .reduce((last, curr) => last + curr.amount, 0.0),
                commissions: code.commissions
                    .filter((c) => c.id === u.id)
                    .reduce((last, curr) => last + curr.amount, 0.0),
            })),
        referredTalent: users
            .filter((u) => u.accountType === 'talent')
            .map((u) => ({
                name: u.getFullName(),
                dx: code.leads.find((l) => l.id === u.id).dx,
                applications:
                    listingsScan?.Items?.reduce(
                        (last, curr) =>
                            last +
                            (curr?.applications?.filter(
                                (la) => la.talent === u.id
                            ).length || 0),
                        0
                    ) || 0,
                hired:
                    listingsScan?.Items?.reduce(
                        (last, curr) =>
                            last +
                            (curr?.applications?.filter(
                                (la) =>
                                    la.talent === u.id &&
                                    la.applicationStatus === 'hired'
                            ).length || 0),
                        0
                    ) || 0,
                revenue: code.revenue
                    .filter((r) => r.id === u.id)
                    .reduce((last, curr) => last + curr.amount, 0.0),
                commissions: code.commissions
                    .filter((c) => c.id === u.id)
                    .reduce((last, curr) => last + curr.amount, 0.0),
            })),
    };
};

const getCodes = async () => {
    const codeScan = await databaseService.scan({
        TableName: referralsTable,
    });

    if (!codeScan.Items.length) return [];
    else {
        const userScan = await databaseService.scan({
            TableName: usersTable,
        });

        if (!userScan.Items.length) return [];

        const users: User[] = userScan.Items.map((u) => generateUser(u));

        return codeScan.Items.map((c) => {
            const creator: any = users?.find((u) => u?.id === c.creator);

            return {
                ...c,
                creator: {
                    id: creator?.id || '',
                    name: creator
                        ? creator.getFullName() +
                          (creator.accountType === 'client'
                              ? ` | ${creator.contact.companyName}`
                              : '')
                        : 'Deleted user',
                    email: creator ? creator.email : '',
                    imageUrl:
                        creator?.talentData?.profile?.photoUrl ||
                        creator?.clientData?.profile?.photoUrl ||
                        '',
                    affiliateAccess: creator?.affiliateAccess || 'Deleted user',
                },
            };
        });
    }
};

const patchAffiliate = async (
    codeId: string,
    body: {
        affiliateAccess?: 'active' | 'suspended';
        revenue?: number;
        commission?: number;
    }
) => {
    const codeReq = await databaseService.get({
        TableName: referralsTable,
        Key: {
            id: codeId,
        },
    });

    if (!codeReq.Item) throw createError(404, 'Code not found');

    const code: ReferralCode = codeReq.Item as any;

    if (body.affiliateAccess) {
        await databaseService.update({
            TableName: usersTable,
            Key: { id: code.creator },
            UpdateExpression: `set affiliateAccess=:a`,
            ExpressionAttributeValues: {
                ':a': body.affiliateAccess,
            },
        });
    } else {
        await databaseService.update({
            TableName: referralsTable,
            Key: { id: codeId },
            UpdateExpression: `set revenue = list_append(revenue, :r), commissions = list_append(commissions, :c)`,
            ExpressionAttributeValues: {
                ':r': [
                    {
                        id: 'ADMINISTRATOR',
                        amount: dirtyDecimal(body!.revenue),
                        dx: Date.now(),
                    },
                ],
                ':c': [
                    {
                        id: 'ADMINISTRATOR',
                        amount: dirtyDecimal(body!.commission),
                        dx: Date.now(),
                    },
                ],
            },
        });
    }
};

const connect = async (user: User) => {
    const code = await getCode(user);

    if (!code) throw createError(404, 'Code not found');

    const account = await stripe.accounts.create({
        country: user.contact.addressCountry,
        controller: {
            stripe_dashboard: {
                type: 'express',
            },
            fees: {
                payer: 'application',
            },
            losses: {
                payments: 'application',
            },
        },
        tos_acceptance: {
            service_agreement:
                user.contact.addressCountry === 'US' ? 'full' : 'recipient',
        },
        capabilities: {
            transfers: {
                requested: true,
            },
        },
    });

    await databaseService.update({
        TableName: referralsTable,
        Key: { id: code.id },
        UpdateExpression: `set stripeId = :s`,
        ExpressionAttributeValues: {
            ':s': account.id,
        },
    });

    const accountLink = await stripe.accountLinks.create({
        account: account.id,
        return_url: `${process.env.FRONTEND_BASE_URL}`,
        refresh_url: `${process.env.FRONTEND_BASE_URL}`,
        type: 'account_onboarding',
    });

    return { url: accountLink.url };
};

const expressLogin = async (user: User) => {
    const code = await getCode(user);

    if (!code) throw createError(404, 'Code not found');

    if (!code?.stripeId)
        throw createError(404, 'Stripe Connect account not found');

    const loginLink = await stripe.accounts.createLoginLink(code.stripeId);

    return { url: loginLink.url };
};

const processPayouts = async () => {
    try {
        const codes = await getCodes();

        for await (const code of codes) {
            if (code?.creator?.affiliateAccess !== 'active' || !code?.stripeId)
                continue;

            const cacheCommissions: any[] = code.commissions;
            let updates = false;

            for await (const comm of cacheCommissions) {
                if (
                    comm?.paid ||
                    comm.dx +
                        (process.env.DEPLOYMENT_STAGE === 'prod'
                            ? 1000 * 60 * 60 * 24 * 30
                            : 0) >
                        Date.now()
                )
                    continue;

                try {
                    const transfer = await stripe.transfers.create({
                        amount: Math.floor(comm.amount * 100),
                        currency: 'USD',
                        destination: code.stripeId,
                    });

                    if (transfer.id) {
                        updates = true;
                        cacheCommissions[
                            cacheCommissions.findIndex((x) => x.dx === comm.dx)
                        ] = { ...comm, paid: true };
                    }
                } catch (err) {
                    console.error('Error creating transfer: \n' + err);
                }
            }

            if (updates)
                await databaseService.update({
                    TableName: referralsTable,
                    Key: { id: code.id },
                    UpdateExpression: `set commissions = :c`,
                    ExpressionAttributeValues: {
                        ':c': cacheCommissions,
                    },
                });
        }
    } catch (err) {
        console.error('Error processing commissions: \n' + err);
    }
};

setInterval(
    processPayouts,
    process.env.DEPLOYMENT_STAGE === 'prod' ? 1000 * 60 * 60 : 30000
);

export {
    activate,
    createCode,
    getCode,
    registerClick,
    registerLead,
    registerConversion,
    registerChurn,
    registerFinancial,
    getReferred,
    getCodes,
    patchAffiliate,
    connect,
    expressLogin,
};
