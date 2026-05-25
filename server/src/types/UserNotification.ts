export interface BaseNotificationBody {
    deduplicationId: string;
    notificationTitle: string;
    notificationText: string;
}

export interface BaseNotification {
    id: string;
    dateCreated: number;
    dateUpdated: number;
    seen: boolean;
}

export interface ChatNotificationBody extends BaseNotificationBody {
    notificationType: 'chat';
    targetId: string;
    chatId: string;
    messageCount: number;
}

export type ChatNotification = BaseNotification & ChatNotificationBody;

export interface TalentApplicationNotificationBody
    extends BaseNotificationBody {
    notificationType: 'talentApplication';
    listingId: string;
    clientId: string;
    applicationStatus:
        | 'invited'
        | 'applied'
        | 'interviewing'
        | 'shortlisted'
        | 'hired';
}

export type TalentApplicationNotification = BaseNotification &
    TalentApplicationNotificationBody;

export interface ClientApplicationNotificationBody
    extends BaseNotificationBody {
    notificationType: 'clientApplication';
    listingId: string;
    talentIds: string[];
}

export type ClientApplicationNotification = BaseNotification &
    ClientApplicationNotificationBody;

export type UserNotificationBody =
    | ChatNotificationBody
    | TalentApplicationNotificationBody
    | ClientApplicationNotificationBody;

export type UserNotification =
    | ChatNotification
    | TalentApplicationNotification
    | ClientApplicationNotification;
