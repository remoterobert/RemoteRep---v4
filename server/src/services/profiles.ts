import * as databaseService from './database';
import { usersTable, generateUser } from './auth';
import createError from '../utilities/createError';

const getProfile = async (userId: string) => {
    const get = await databaseService.get({
        TableName: usersTable,
        Key: { id: userId },
    });

    if (get?.Item?.id) return generateUser(get.Item).toPublicObject();
    else createError(404, 'User not found');
};

export {
    getProfile,
    // getPublicProfile
};
