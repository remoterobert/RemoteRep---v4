import * as databaseService from './database';
import * as emailService from './email';
import createError from '../utilities/createError';
import { UserNotification, UserNotificationBody } from '../types';
import { User } from './auth';
import crypto from 'crypto';
import { sendNotifications } from './pushNotifications';

const notificationsTable = `v3-notifications-${process.env.DEPLOYMENT_STAGE}`;

const getNotifications = async (user: User): Promise<UserNotification[]> => {
    const get = await databaseService.get({
        TableName: notificationsTable,
        Key: { userId: user.id },
    });

    if (!get.Item) {
        await databaseService.put({
            TableName: notificationsTable,
            Item: { userId: user.id, notifications: [] },
        });

        return [];
    }

    return get.Item.notifications as UserNotification[];
};

const putNotification = async (
    user: User,
    notification: UserNotificationBody,
    suppressEmail: boolean = false
) => {
    const cacheNotifications: UserNotification[] = await getNotifications(user);

    let cacheNotification: UserNotification;

    if (
        cacheNotifications.some(
            (n) => n.deduplicationId === notification.deduplicationId
        )
    ) {
        const originalNotification = cacheNotifications.find(
            (n) => n.deduplicationId === notification.deduplicationId
        )!;

        cacheNotification = {
            ...originalNotification,
            ...notification,
            dateUpdated: Date.now(),
            seen: false,
        };

        if (
            cacheNotification.notificationType === 'chat' &&
            originalNotification.notificationType === 'chat'
        )
            cacheNotification = {
                ...cacheNotification,
                messageCount: originalNotification.messageCount + 1,
            };
        else if (
            cacheNotification.notificationType === 'clientApplication' &&
            originalNotification.notificationType === 'clientApplication' &&
            notification.notificationType === 'clientApplication'
        )
            cacheNotification = {
                ...cacheNotification,
                talentIds: [
                    ...originalNotification.talentIds,
                    ...notification.talentIds,
                ],
            };
    } else {
        cacheNotification = {
            ...notification,
            id: crypto.randomUUID(),
            dateCreated: Date.now(),
            dateUpdated: Date.now(),
            seen: false,
        };

        if (
            !suppressEmail &&
            Math.floor((Date.now() - user.dateLastOnline) / 1000 / 60) > 5
        ) {
            await emailService.sendEmail({
                language: 'newNotification',
                target: user.email,
            });
            await sendNotifications(user?.vapid || [], 'newNotification');
        }
    }

    await databaseService.update({
        TableName: notificationsTable,
        Key: { userId: user.id },
        UpdateExpression: 'SET notifications=:n',
        ExpressionAttributeValues: {
            ':n': [
                ...cacheNotifications.filter(
                    (n) => n.deduplicationId !== notification.deduplicationId
                ),
                cacheNotification,
            ],
        },
    });
};

const markNotificationAsSeen = async (
    user: User,
    notificationId: string
): Promise<UserNotification[]> => {
    const cacheNotifications: UserNotification[] = await getNotifications(user);

    const cacheNotification = cacheNotifications.find(
        (n) => n.id === notificationId
    );

    if (!cacheNotification) throw createError(404, 'Notification not found.');

    cacheNotification.seen = true;

    await databaseService.update({
        TableName: notificationsTable,
        Key: { userId: user.id },
        UpdateExpression: 'SET notifications=:n',
        ExpressionAttributeValues: {
            ':n': [
                ...cacheNotifications.filter((n) => n.id !== notificationId),
                cacheNotification,
            ],
        },
    });

    return [
        ...cacheNotifications.filter((n) => n.id === notificationId),
        cacheNotification,
    ];
};

const deleteNotification = async (user: User, notificationId: string) => {
    const cacheNotifications: UserNotification[] = await getNotifications(user);

    await databaseService.update({
        TableName: notificationsTable,
        Key: { userId: user.id },
        UpdateExpression: 'SET notifications=:n',
        ExpressionAttributeValues: {
            ':n': [
                ...cacheNotifications.filter((n) => n.id !== notificationId),
            ],
        },
    });

    return [...cacheNotifications.filter((n) => n.id !== notificationId)];
};

export {
    getNotifications,
    putNotification,
    markNotificationAsSeen,
    deleteNotification,
};
