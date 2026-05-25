import crypto from 'crypto';
import * as databaseService from './database';
import * as secretsService from './secrets';
import * as emailService from './email';
import * as affiliateService from './affiliate';
import randomHex from '../utilities/randomHex';
import createError from '../utilities/createError';
import jwt, { JwtPayload } from 'jsonwebtoken';
import _ from 'lodash';
import * as ghlService from './ghl';
import { getAccess, listingsTable } from './client';
import { sendNotifications } from './pushNotifications';

class BaseUser {
    id: string;
    accountType: 'talent' | 'client' | 'administrator';
    email: string;
    phone: string;
    password: {
        salt: string;
        hashed: string;
    };
    contact: {
        firstName: string;
        lastName: string;
        addressCity: string;
        addressState: string;
        addressCountry: string;
        addressZip: string;
        companyName?: string;
    };
    authority: number;
    emailVerification: string;
    dateCreated: number;
    dateUpdated: number;
    creationReference: string;
    dateLastOnline: number;
    userTimeZone: string;
    administratorNote: string;
    administratorTags: string[];
    stripe: {
        customerId: string;
        subscriptions: { id: string; priceId: string; dateExpires: number }[];
    };
    privilegedAccount?: boolean;
    vapid?: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    }[];
    affiliateAccess?: string;
    affiliateCode?: string;
    profileHidden?: boolean;

    constructor(userData: any) {
        const {
            id,
            accountType,
            email,
            phone,
            password,
            contact,
            authority,
            emailVerification,
            dateCreated,
            dateUpdated,
            creationReference,
            dateLastOnline,
            userTimeZone,
            administratorNote,
            administratorTags,
            stripe,
            privilegedAccount,
            vapid,
            affiliateAccess,
            affiliateCode,
            profileHidden,
        } = userData;

        Object.assign(this, {
            id,
            accountType,
            email,
            phone,
            password,
            contact,
            authority,
            emailVerification,
            dateCreated,
            dateUpdated,
            creationReference,
            dateLastOnline,
            userTimeZone,
            administratorNote,
            administratorTags,
            stripe,
            privilegedAccount,
            vapid,
            affiliateAccess,
            affiliateCode,
            profileHidden,
        });
    }

    getFullName(): string {
        return `${this.contact.firstName} ${this.contact.lastName}`;
    }

    testPassword(password: string): boolean {
        return (
            crypto
                .pbkdf2Sync(password, this.password.salt, 100000, 64, 'sha512')
                .toString('hex') === this.password.hashed
        );
    }

    testEmail(code: string): boolean {
        return code === this.emailVerification;
    }

    async generateJwtToken(): Promise<string> {
        return `Bearer ${jwt.sign(
            {
                id: this.id,
                accountType: this.accountType,
                email: this.email.toLowerCase(),
                authority: this.authority,
            },
            (await secretsService.getSecrets()).jwt,
            { expiresIn: '1y' }
        )}`;
    }

    toPublicObject() {
        const {
            id,
            accountType,
            contact,
            dateLastOnline,
            userTimeZone,
            profileHidden,
        } = this;

        return {
            id,
            accountType,
            contact,
            dateLastOnline,
            userTimeZone,
            profileHidden,
        };
    }

    toPrivateObject(isAdmin: boolean = false) {
        const {
            id,
            accountType,
            email,
            phone,
            contact,
            authority,
            dateCreated,
            dateUpdated,
            creationReference,
            userTimeZone,
            administratorNote,
            administratorTags,
            privilegedAccount,
            affiliateAccess,
            affiliateCode,
            dateLastOnline,
            profileHidden,
        } = this;

        return {
            id,
            accountType,
            email,
            phone,
            contact,
            authority,
            dateCreated,
            dateUpdated,
            creationReference,
            userTimeZone,
            affiliateAccess,
            affiliateCode,
            profileHidden,
            ...(isAdmin && {
                administratorNote,
                administratorTags,
                privilegedAccount,
                dateLastOnline,
            }),
        };
    }

    async sendVerificationEmail() {
        this.emailVerification = randomHex(16);

        await databaseService.update({
            TableName: usersTable,
            Key: { id: this.id },
            UpdateExpression: `set emailVerification=:e`,
            ExpressionAttributeValues: {
                ':e': this.emailVerification,
            },
        });

        await emailService.sendEmail({
            language: 'verifyEmail',
            target: this.email.toLowerCase(),
            buttonHref: `${process.env.FRONTEND_BASE_URL}/authentication/email?code=${this.emailVerification}&id=${this.id}`,
        });
    }

    async sendPasswordResetEmail() {
        this.emailVerification = randomHex(16);

        await databaseService.update({
            TableName: usersTable,
            Key: { id: this.id },
            UpdateExpression: `set emailVerification=:e`,
            ExpressionAttributeValues: {
                ':e': this.emailVerification,
            },
        });

        await emailService.sendEmail({
            language: 'resetPassword',
            target: this.email.toLowerCase(),
            buttonHref: `${process.env.FRONTEND_BASE_URL}/authentication/reset-password?id=${this.id}&code=${this.emailVerification}`,
        });
    }

    async sendChangeEmail(email: string) {
        this.emailVerification = randomHex(16);

        await databaseService.update({
            TableName: usersTable,
            Key: { id: this.id },
            UpdateExpression: `set emailVerification=:e`,
            ExpressionAttributeValues: {
                ':e': this.emailVerification,
            },
        });

        await emailService.sendEmail({
            language: 'changeEmail',
            target: email.toLowerCase(),
            buttonHref: `${process.env.FRONTEND_BASE_URL}/authentication/change-email?id=${this.id}&email=${email}&code=${this.emailVerification}`,
        });
    }

    async updateDateLastOnline() {
        await databaseService.update({
            TableName: usersTable,
            Key: { id: this.id },
            UpdateExpression: `set dateLastOnline=:d`,
            ExpressionAttributeValues: {
                ':d': Date.now(),
            },
        });
    }

    async updateHidden(hidden: boolean) {
        await databaseService.update({
            TableName: usersTable,
            Key: { id: this.id },
            UpdateExpression: `set profileHidden=:h`,
            ExpressionAttributeValues: {
                ':h': hidden,
            },
        });
    }
}

class TalentUser extends BaseUser {
    talentData?: {
        profile?: {
            photoUrl: string;
            videoUrl?: string;
            headline: string;
            about: string;
        };
        experience?: {
            education: string;
            yearsOfExperience: number;
            industries: string[];
            salesRoles: string[];
            salesTypes: string[];
            decisionMakers: string[];
            salesEnvironments: string[];
            salesCycles: string[];
            dealAmounts: string[];
            salesVolumes: string[];
            leadTypes: string[];
            technologies: string[];
        };
        goals?: {
            companyAge: number;
            companyHeadcount: number;
            industries: string[];
            salesRoles: string[];
            commitment: string[];
            benefits: string[];
            compensationTypes: string[];
            minimumCompensation: number;
        };
        files?: {
            resume?: string;
        };
        onboardingComplete?: boolean;
        bookmarkedClients?: string[];
        bookmarkedListings?: string[];
    };

    constructor(userData: any) {
        super({ ...userData });
        this.talentData = userData?.talentData;
    }

    toPrivateObject(isAdmin: boolean = false) {
        return {
            ...super.toPrivateObject(isAdmin),
            talentData: this.talentData,
        };
    }

    toPublicObject() {
        return { ...super.toPublicObject(), talentData: this.talentData };
    }

    async updateTypeData(typeData: any) {
        const cacheData = this.talentData || {};
        _.assign(cacheData, typeData);
        await databaseService.update({
            TableName: usersTable,
            Key: { id: this.id },
            UpdateExpression: `set talentData=:t`,
            ExpressionAttributeValues: {
                ':t': cacheData,
            },
        });
        this.talentData = cacheData;
    }

    async bookmarkClient({ clientId, bookmarked }) {
        const bc = this?.talentData?.bookmarkedClients || [];
        if (bookmarked && !bc.includes(clientId)) {
            bc.push(clientId);

            const clientData = (
                await databaseService.get({
                    TableName: usersTable,
                    Key: { id: clientId },
                })
            ).Item;

            emailService.sendEmail({
                language: 'clientBookmarked',
                target: clientData.email,
                replace: { $COMPANY_NAME: clientData?.contact?.companyName },
            });

            sendNotifications(
                clientData.Item?.vapid || [],
                'clientBookmarked',
                null,
                { $COMPANY_NAME: clientData.Item?.contact?.companyName }
            );
        } else if (!bookmarked && bc.includes(clientId))
            bc.splice(bc.indexOf(clientId), 1);
        await databaseService.update({
            TableName: usersTable,
            Key: { id: this.id },
            UpdateExpression: `set talentData.bookmarkedClients=:b`,
            ExpressionAttributeValues: {
                ':b': bc,
            },
        });
        this.talentData.bookmarkedClients = bc;
        return { bookmarkedClients: bc };
    }

    async bookmarkListing({ listingId, bookmarked }) {
        const bl = this?.talentData?.bookmarkedListings || [];
        if (bookmarked && !bl.includes(listingId)) {
            bl.push(listingId);

            const listingData = (
                await databaseService.get({
                    TableName: listingsTable,
                    Key: { id: listingId },
                })
            ).Item;

            emailService.sendEmail({
                language: 'listingBookmarked',
                target: (
                    await databaseService.get({
                        TableName: usersTable,
                        Key: {
                            id: listingData.client,
                        },
                    })
                ).Item.email,
                replace: { $LISTING_NAME: listingData.title },
            });

            sendNotifications(
                (
                    await databaseService.get({
                        TableName: usersTable,
                        Key: {
                            id: (
                                await databaseService.get({
                                    TableName: listingsTable,
                                    Key: { id: listingId },
                                })
                            ).Item.client,
                        },
                    })
                ).Item?.vapid || [],
                'listingBookmarked',
                null,
                { $LISTING_NAME: listingData.title }
            );
        } else if (!bookmarked && bl.includes(listingId))
            bl.splice(bl.indexOf(listingId), 1);
        await databaseService.update({
            TableName: usersTable,
            Key: { id: this.id },
            UpdateExpression: `set talentData.bookmarkedListings=:b`,
            ExpressionAttributeValues: {
                ':b': bl,
            },
        });
        this.talentData.bookmarkedListings = bl;
        return { bookmarkedListings: bl };
    }
}

class ClientUser extends BaseUser {
    clientData?: {
        profile?: {
            photoUrl: string;
            companyAge: number;
            companyHeadcount: number;
            industry: string;
        };
        onboardingComplete?: boolean;
        listings?: string[];
        bookmarkedTalent?: string[];
    };
    lastAccess?: string;

    constructor(userData: any) {
        super({ ...userData });
        this.clientData = userData?.clientData;
        this.lastAccess = userData?.lastAccess;
    }

    toPrivateObject(isAdmin: boolean = false) {
        return {
            ...super.toPrivateObject(isAdmin),
            clientData: this.clientData,
            lastAccess: isAdmin ? this.lastAccess : undefined,
        };
    }

    toPublicObject() {
        return { ...super.toPublicObject(), clientData: this.clientData };
    }

    async updateTypeData(typeData: any) {
        const cacheData = this.clientData || {};
        _.assign(cacheData, typeData);
        await databaseService.update({
            TableName: usersTable,
            Key: { id: this.id },
            UpdateExpression: `set clientData=:t`,
            ExpressionAttributeValues: {
                ':t': cacheData,
            },
        });
        this.clientData = cacheData;
    }

    async bookmarkTalent({ talentId, bookmarked }) {
        const bt = this?.clientData?.bookmarkedTalent || [];
        if (bookmarked && !bt.includes(talentId)) {
            bt.push(talentId);

            emailService.sendEmail({
                language: 'talentBookmarked',
                target: (
                    await databaseService.get({
                        TableName: usersTable,
                        Key: { id: talentId },
                    })
                ).Item.email,
            });

            sendNotifications(
                (
                    await databaseService.get({
                        TableName: usersTable,
                        Key: { id: talentId },
                    })
                ).Item?.vapid || [],
                'talentBookmarked'
            );
        } else if (!bookmarked && bt.includes(talentId))
            bt.splice(bt.indexOf(talentId), 1);
        await databaseService.update({
            TableName: usersTable,
            Key: { id: this.id },
            UpdateExpression: `set clientData.bookmarkedTalent=:b`,
            ExpressionAttributeValues: {
                ':b': bt,
            },
        });
        this.clientData.bookmarkedTalent = bt;
        return { bookmarkedTalent: bt };
    }

    async bulkBookmark({ talentIds }) {
        const bt = this?.clientData?.bookmarkedTalent || [];

        talentIds.forEach((t) => {
            if (!bt.includes(t)) bt.push(t);
        });

        await databaseService.update({
            TableName: usersTable,
            Key: { id: this.id },
            UpdateExpression: `set clientData.bookmarkedTalent=:b`,
            ExpressionAttributeValues: {
                ':b': bt,
            },
        });
        this.clientData.bookmarkedTalent = bt;

        return { bookmarkedTalent: bt };
    }

    async updateLastAccess(type?: string) {
        try {
            if (type) this.lastAccess = type;
            else {
                const access = await getAccess(this);
                this.lastAccess =
                    access.access && access.type ? access.type : 'standard';
            }

            await databaseService.update({
                TableName: usersTable,
                Key: { id: this.id },
                UpdateExpression: `set lastAccess=:a`,
                ExpressionAttributeValues: {
                    ':a': this.lastAccess,
                },
            });

            return this;
        } catch {
            return this;
        }
    }
}

class AdministratorUser extends BaseUser {
    constructor(userData: any) {
        super(userData);
    }
}

type User = TalentUser | ClientUser | AdministratorUser;

const generateUser = (userData: any): User => {
    switch (userData.accountType) {
        case 'talent':
            return new TalentUser(userData);
        case 'client':
            return new ClientUser(userData);
        case 'administrator':
            return new AdministratorUser(userData);
    }
};

const usersTable = `v3-users-${process.env.DEPLOYMENT_STAGE}`;

const idExists = async (id: string): Promise<boolean> => {
    try {
        const get = await databaseService.get({
            TableName: usersTable,
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

const register = async (
    requestBody: {
        accountType: 'talent' | 'client' | 'administrator';
        email: string;
        password: string;
        repeatPassword: string;
        firstName: string;
        lastName: string;
        country: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
        creationReference: string;
        companyName?: string;
        affiliateCode?: string;
    },
    createdByAdmin?: boolean
): Promise<User> => {
    if (!createdByAdmin && requestBody.accountType === 'administrator')
        throw createError(403, 'Creating administrator accounts is forbidden.');

    const emailScan = await databaseService.scan({
        TableName: usersTable,
        FilterExpression: '#e = :e',
        ExpressionAttributeNames: {
            '#e': 'email',
        },
        ExpressionAttributeValues: {
            ':e': requestBody.email.toLowerCase(),
        },
    });
    if (emailScan.Items.length !== 0)
        throw createError(400, 'Email address already exists.');

    const id = await generateId();

    const salt = randomHex(16);
    const hashed = crypto
        .pbkdf2Sync(requestBody.password, salt, 100000, 64, 'sha512')
        .toString('hex');

    const emailVerification = '';

    if (requestBody.accountType === 'talent')
        await databaseService.put({
            TableName: usersTable,
            Item: {
                id,
                accountType: requestBody.accountType,
                email: requestBody.email.toLowerCase(),
                phone: requestBody.phone,
                password: {
                    salt,
                    hashed,
                },
                contact: {
                    firstName: requestBody.firstName,
                    lastName: requestBody.lastName,
                    addressCity: requestBody.city,
                    addressState: requestBody.state,
                    addressCountry: requestBody.country,
                    addressZip: requestBody.zip,
                },
                authority: 100,
                emailVerification,
                dateCreated: Date.now(),
                dateUpdated: Date.now(),
                creationReference: requestBody.creationReference,
            },
        });
    else if (requestBody.accountType === 'client') {
        await databaseService.put({
            TableName: usersTable,
            Item: {
                id,
                accountType: requestBody.accountType,
                email: requestBody.email.toLowerCase(),
                phone: requestBody.phone,
                password: {
                    salt,
                    hashed,
                },
                contact: {
                    firstName: requestBody.firstName,
                    lastName: requestBody.lastName,
                    addressCity: requestBody.city,
                    addressState: requestBody.state,
                    addressCountry: requestBody.country,
                    addressZip: requestBody.zip,
                    companyName: requestBody.companyName,
                },
                authority: 100,
                emailVerification,
                dateCreated: Date.now(),
                dateUpdated: Date.now(),
                creationReference: requestBody.creationReference,
            },
        });
    }

    const dbUser = await databaseService.get({
        TableName: usersTable,
        Key: { id },
    });

    if (!dbUser.Item)
        throw createError(500, 'An unknown database error has ocurred.');

    const user = generateUser(dbUser.Item);

    await user.sendVerificationEmail();

    if (requestBody.accountType === 'talent')
        await ghlService.createTalent({
            email: requestBody.email.toLowerCase(),
            phone: requestBody.phone,
            fullName: `${requestBody.firstName} ${requestBody.lastName}`,
            source: 'Self-registered',
        });
    else if (requestBody.accountType === 'client') {
        await ghlService.createClient({
            email: requestBody.email.toLowerCase(),
            phone: requestBody.phone,
            fullName: `${requestBody.firstName} ${requestBody.lastName}`,
            companyName: requestBody.companyName,
            source: 'Self-registered',
        });
    }

    if (requestBody.affiliateCode) {
        user.affiliateCode = requestBody.affiliateCode;
        await databaseService.update({
            TableName: usersTable,
            Key: { id: user.id },
            UpdateExpression: `set affiliateCode=:a`,
            ExpressionAttributeValues: {
                ':a': user.affiliateCode,
            },
        });

        affiliateService.registerLead(user);
    }

    return user;
};

const login = async (
    requestBody: {
        email: string;
        password: string;
        userTimeZone: string;
    },
    byAdmin?: boolean
): Promise<User> => {
    const emailScan = await databaseService.scan({
        TableName: usersTable,
        FilterExpression: '#e = :e',
        ExpressionAttributeNames: {
            '#e': 'email',
        },
        ExpressionAttributeValues: {
            ':e': requestBody.email.toLowerCase(),
        },
    });
    if (emailScan.Items.length !== 1)
        throw createError(404, 'Account not found.');

    const user = generateUser(emailScan.Items[0]);
    await databaseService.update({
        TableName: usersTable,
        Key: { id: user.id },
        UpdateExpression: `set userTimeZone=:t`,
        ExpressionAttributeValues: {
            ':t': requestBody.userTimeZone,
        },
    });

    if (!user.testPassword(requestBody.password))
        throw createError(403, 'Invalid credentials.');

    return user;
};

const verify = async (token: string): Promise<User> => {
    try {
        const decoded = jwt.verify(
            token.split('Bearer ')[1],
            (await secretsService.getSecrets()).jwt
        ) as JwtPayload;

        const dbUser = await databaseService.get({
            TableName: usersTable,
            Key: { id: decoded.id },
        });

        if (!dbUser.Item) throw createError(404, 'User not found.');

        return generateUser(dbUser.Item);
    } catch {
        throw createError(401, 'JWT token could not be verified.');
    }
};

const verifyEmail = async (userId: string, code: string): Promise<User> => {
    const dbUser = await databaseService.get({
        TableName: usersTable,
        Key: { id: userId },
    });

    if (!dbUser.Item) throw createError(404, 'User not found');

    const user = generateUser(dbUser.Item);

    if (user.testEmail(code)) {
        await databaseService.update({
            TableName: usersTable,
            Key: { id: user.id },
            UpdateExpression: `set authority=:a`,
            ExpressionAttributeValues: {
                ':a': 101,
            },
        });

        return user;
    } else throw createError(400, 'Code invalid.');
};

const sendPasswordReset = async (requestBody: {
    email: string;
}): Promise<void> => {
    const emailScan = await databaseService.scan({
        TableName: usersTable,
        FilterExpression: '#e = :e',
        ExpressionAttributeNames: {
            '#e': 'email',
        },
        ExpressionAttributeValues: {
            ':e': requestBody.email.toLowerCase(),
        },
    });
    if (emailScan.Items.length !== 1)
        throw createError(404, 'Account not found.');

    const user = generateUser(emailScan.Items[0]);

    await user.sendPasswordResetEmail();
};

const resetPassword = async (requestBody: {
    id: string;
    code: string;
    password: string;
}): Promise<void> => {
    const dbUser = await databaseService.get({
        TableName: usersTable,
        Key: { id: requestBody.id },
    });

    if (!dbUser.Item) throw createError(404, 'User not found.');

    const user = generateUser(dbUser.Item);

    if (user.testEmail(requestBody.code)) {
        const salt = randomHex(16);
        const hashed = crypto
            .pbkdf2Sync(requestBody.password, salt, 100000, 64, 'sha512')
            .toString('hex');

        await databaseService.update({
            TableName: usersTable,
            Key: { id: user.id },
            UpdateExpression: `set password.salt=:s, password.hashed=:h`,
            ExpressionAttributeValues: {
                ':s': salt,
                ':h': hashed,
            },
        });
    } else throw createError(400, 'Code invalid.');
};

const changePassword = async (
    user: User,
    requestBody: {
        currentPassword: string;
        newPassword: string;
        repeatPassword: string;
    }
): Promise<void> => {
    if (requestBody.currentPassword === requestBody.newPassword)
        throw createError(
            400,
            'New password cannot be same as the current password.'
        );

    if (user.testPassword(requestBody.currentPassword)) {
        const salt = randomHex(16);
        const hashed = crypto
            .pbkdf2Sync(requestBody.newPassword, salt, 100000, 64, 'sha512')
            .toString('hex');

        await databaseService.update({
            TableName: usersTable,
            Key: { id: user.id },
            UpdateExpression: `set password.salt=:s, password.hashed=:h`,
            ExpressionAttributeValues: {
                ':s': salt,
                ':h': hashed,
            },
        });
    } else throw createError(400, 'Invalid password.');
};

const sendChangeEmail = async (user: User, email: string): Promise<void> => {
    const emailScan = await databaseService.scan({
        TableName: usersTable,
        FilterExpression: '#e = :e',
        ExpressionAttributeNames: {
            '#e': 'email',
        },
        ExpressionAttributeValues: {
            ':e': email.toLowerCase(),
        },
    });

    if (emailScan.Items.length !== 0)
        throw createError(400, 'Email address already exists.');

    await user.sendChangeEmail(email);
};

const changeEmail = async (requestBody: {
    id: string;
    code: string;
    email: string;
}): Promise<void> => {
    const dbUser = await databaseService.get({
        TableName: usersTable,
        Key: { id: requestBody.id },
    });

    if (!dbUser.Item) throw createError(404, 'User not found.');

    const user = generateUser(dbUser.Item);

    if (user.testEmail(requestBody.code)) {
        await databaseService.update({
            TableName: usersTable,
            Key: { id: user.id },
            UpdateExpression: `set email=:e`,
            ExpressionAttributeValues: {
                ':e': requestBody.email,
            },
        });
    } else throw createError(400, 'Code invalid.');
};

const editContact = async (
    user: User,
    requestBody: {
        firstName: string;
        lastName: string;
        country: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
        companyName?: string;
    }
): Promise<void> => {
    await databaseService.update({
        TableName: usersTable,
        Key: { id: user.id },
        UpdateExpression: `set contact=:c, phone=:p`,
        ExpressionAttributeValues: {
            ':c': requestBody?.companyName
                ? {
                      firstName: requestBody.firstName,
                      lastName: requestBody.lastName,
                      addressCity: requestBody.city,
                      addressState: requestBody.state,
                      addressCountry: requestBody.country,
                      addressZip: requestBody.zip,
                      companyName: requestBody.companyName,
                  }
                : {
                      firstName: requestBody.firstName,
                      lastName: requestBody.lastName,
                      addressCity: requestBody.city,
                      addressState: requestBody.state,
                      addressCountry: requestBody.country,
                      addressZip: requestBody.zip,
                  },
            ':p': requestBody.phone,
        },
    });
};

export {
    User,
    TalentUser,
    ClientUser,
    AdministratorUser,
    generateUser,
    register,
    login,
    verify,
    verifyEmail,
    sendPasswordReset,
    resetPassword,
    sendChangeEmail,
    changeEmail,
    editContact,
    usersTable,
    changePassword,
};
