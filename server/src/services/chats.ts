// interface ChatError {
//     interfaceType: 'ChatError';
//     error: number;
// }

interface Message {
    interfaceType: 'Message';
    id: string;
    chatId: string;
    authorId: string;
    message: string;
    dateCreated: number;
    dateUpdated: number;
    deleted: boolean;
    deletedByAdmin: boolean;
}

import crypto from 'crypto';
import * as databaseService from './database';
import { usersTable, User, generateUser } from './auth';
import createError from '../utilities/createError';
import randomHex from '../utilities/randomHex';
import * as notificationsService from './notifications';
import * as authService from './auth';
import * as clientService from './client';

const chatsTable = `v3-chats-${process.env.DEPLOYMENT_STAGE}`;

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

const getChats = async (user: User) => {
    const scan = await databaseService.scan({
        TableName: chatsTable,
        FilterExpression: 'contains (chatUsers, :u)',
        ExpressionAttributeValues: {
            ':u': user.id,
        },
        ProjectionExpression:
            'id, dateCreated, chatUsers, datesSeen, dateUpdated, messages',
    });

    const chats = scan.Items;

    if (chats.length) {
        for await (const c of chats) {
            const target = c.chatUsers.find((m: string) => m !== user.id);

            const targetGet = await databaseService.get({
                TableName: usersTable,
                Key: { id: target },
            });
            const lastMessage = c.messages?.at(-1) || '';

            const { messages, ...chat } = c;

            const targetToSend = !targetGet.Item
                ? {
                      deleted: true,
                  }
                : targetGet.Item.authority <= 99
                ? { suspended: true }
                : generateUser(targetGet.Item).toPublicObject();

            chats[chats.findIndex((cc: any) => cc.id === c.id)] = {
                ...chat,
                target: targetToSend,
                lastMessage,
            };
        }
    }

    const sortedChats = chats.sort((a, b) => {
        if (!b.lastMessage) {
            return -1;
        }

        return b?.lastMessage?.dateCreated - a?.lastMessage?.dateCreated;
    });

    return {
        chats: sortedChats,
    };
};

const getChatMessages = async (user: User, chatId: string) => {
    const cacheChat = await databaseService.get({
        TableName: chatsTable,
        Key: { id: chatId },
    });

    await databaseService.update({
        TableName: chatsTable,
        Key: { id: chatId },
        UpdateExpression: 'SET #datesSeen.#userId = :value',
        ExpressionAttributeNames: {
            '#datesSeen': 'datesSeen',
            '#userId': user.id,
        },
        ExpressionAttributeValues: {
            ':value': Date.now(),
        },
    });

    const transformedMessages = cacheChat.Item.messages.map(
        (message: Message) => {
            if (message.deleted) {
                return {
                    ...message,
                    message: '',
                };
            } else return message;
        }
    );
    return {
        messages: transformedMessages,
    };
};

const createChat = async (user: User, target: string) => {
    if (user instanceof authService.ClientUser) {
        if (!(await clientService.getAccess(user)).access)
            throw createError(403, 'User is not paying client.');
    }

    const scan = await databaseService.scan({
        TableName: chatsTable,
        FilterExpression:
            'contains (chatUsers, :u) AND contains (chatUsers, :t)',
        ExpressionAttributeValues: {
            ':u': user.id,
            ':t': target,
        },
    });

    if (scan.Items?.length) throw createError(400, 'Chat already exists');

    const id = await generateId(chatsTable);

    await databaseService.put({
        TableName: chatsTable,
        Item: {
            id,
            chatUsers: [user.id, target],
            messages: [],
            dateCreated: Date.now(),
            dateUpdated: Date.now(),
            datesSeen: {
                [user.id]: 0,
                [target]: 0,
            },
        },
    });

    return { chat: id };
};

const sendMessage = async (user: User, chat: string, message: string) => {
    const cacheChat = await databaseService.get({
        TableName: chatsTable,
        Key: { id: chat },
    });

    if (!cacheChat.Item) throw createError(404, 'Chat not found');

    await databaseService.update({
        TableName: chatsTable,
        Key: { id: chat },
        UpdateExpression: `set messages = :m`,
        ExpressionAttributeValues: {
            ':m': [
                ...cacheChat.Item.messages,
                {
                    id: crypto.randomUUID(),
                    author: user.id,
                    message,
                    dateCreated: Date.now(),
                    dateUpdated: Date.now(),
                    deleted: false,
                    deletedByAdmin: false,
                },
            ],
        },
    });

    const targetUserId = cacheChat.Item.chatUsers.find((u) => u !== user.id);

    const targetGet = await databaseService.get({
        TableName: usersTable,
        Key: { id: targetUserId },
    });

    notificationsService.putNotification(generateUser(targetGet.Item), {
        notificationType: 'chat',
        chatId: chat,
        deduplicationId: `chat-${user.id}`,
        messageCount: 1,
        notificationText: `You have a new message from ${user?.contact?.firstName} ${user?.contact?.lastName}.`,
        notificationTitle: `New message from ${user?.contact?.firstName} ${user?.contact?.lastName}`,
        targetId: user.id,
    });

    return await getChats(user);
};

const editMessage = async (
    user: User,
    chatId: string,
    messageId: string,
    message: string
) => {
    const cacheChat = await databaseService.get({
        TableName: chatsTable,
        Key: { id: chatId },
    });

    if (!cacheChat.Item) throw createError(404, 'Chat not found');

    const messages: any[] = cacheChat.Item.messages;

    if (messages.find((m) => m?.id === messageId)?.author === user.id) {
        const updatedMessages = messages.map((messageItem) => {
            if (messageItem.id === messageId) {
                return {
                    ...messageItem,
                    message,
                    dateUpdated: Date.now(),
                };
            } else return messageItem;
        });

        await databaseService.update({
            TableName: chatsTable,
            Key: { id: chatId },
            UpdateExpression: `set messages = :m`,
            ExpressionAttributeValues: { ':m': updatedMessages },
        });
    } else throw createError(404, 'Message not found');

    return await getChats(user);
};

const deleteMessage = async (user: User, chatId: string, messageId: string) => {
    const cacheChat = await databaseService.get({
        TableName: chatsTable,
        Key: { id: chatId },
    });

    if (!cacheChat.Item) throw createError(404, 'Chat not found');

    const messages: any[] = cacheChat.Item.messages;

    if (messages.find((m) => m?.id === messageId)?.author === user.id) {
        const updatedMessages = messages.map((messageItem) => {
            if (messageItem.id === messageId) {
                return {
                    ...messageItem,
                    deleted: true,
                };
            } else return messageItem;
        });

        await databaseService.update({
            TableName: chatsTable,
            Key: { id: chatId },
            UpdateExpression: `set messages = :m`,
            ExpressionAttributeValues: { ':m': updatedMessages },
        });
    } else throw createError(404, 'Message not found');

    return await getChats(user);
};

export {
    getChats,
    createChat,
    sendMessage,
    editMessage,
    deleteMessage,
    getChatMessages,
};
