import * as databaseService from './database';
import { usersTable, generateUser } from './auth';
import createError from '../utilities/createError';

const listingsTable = `v3-listings-${process.env.DEPLOYMENT_STAGE}`;

const getListing = async (listingId: string) => {
    const get = await databaseService.get({
        TableName: listingsTable,
        Key: { id: listingId },
    });

    if (!get.Item) throw createError(404, 'Listing not found');

    const clientGet = await databaseService.get({
        TableName: usersTable,
        Key: { id: get.Item.client },
    });

    if (!clientGet.Item) throw createError(404, 'Client not found');

    return {
        ...get.Item,
        client: generateUser(clientGet.Item),
    };
};

export {
    getListing,
    // getPublicProfile
};
