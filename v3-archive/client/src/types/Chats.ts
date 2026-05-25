import { Client, Talent } from './Listings';

export interface Message {
    id: string;
    author: string;
    message: string;
    deleted: boolean;
    deletedByAdmin: boolean;
    dateCreated: number;
    dateUpdated: number;
}

export interface Chat {
    id: string;
    dateCreated: number;
    dateUpdated: number;
    chatUsers: string[];
    datesSeen: Record<string, number>;
    messages: Message[];
    lastMessage: Message;
    target: (Talent | Client) & {
        dateLastOnline: number;
        deleted?: boolean;
    };
}
