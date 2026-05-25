import {
    BuildingOffice2Icon,
    BuildingOfficeIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentListIcon,
    HomeIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
    LifebuoyIcon,
    Cog8ToothIcon,
    ShareIcon
} from '@heroicons/react/24/outline';
import { ForwardRefExoticComponent, SVGProps, RefAttributes } from 'react';

const talentNavigation: {
    name: string;
    href: string;
    icon: ForwardRefExoticComponent<
        Omit<SVGProps<SVGSVGElement>, 'ref'> & {
            title?: string | undefined;
            titleId?: string | undefined;
        } & RefAttributes<SVGSVGElement>
    >;
    newTab?: boolean;
}[] = [
    { name: 'Dashboard', href: '/app/talent', icon: HomeIcon },
    {
        name: 'Hiring Center',
        href: '/app/talent/hiring-center',
        icon: BuildingOfficeIcon,
    },
    {
        name: 'Browse clients',
        href: '/app/talent/browse-clients',
        icon: BuildingOffice2Icon,
    },
    {
        name: 'Browse listings',
        href: '/app/talent/browse-listings',
        icon: ClipboardDocumentListIcon,
    },
    {
        name: 'Chats',
        href: '/app/talent/chats',
        icon: ChatBubbleLeftRightIcon,
    },
    {
        name: 'Affiliates',
        href: '/app/talent/affiliates',
        icon: ShareIcon,
    },
    {
        name: 'Support',
        href: 'https://portal.remoterep.com/support',
        icon: LifebuoyIcon,
        newTab: true,
    },
];

const clientNavigation: {
    name: string;
    href: string;
    icon: ForwardRefExoticComponent<
        Omit<SVGProps<SVGSVGElement>, 'ref'> & {
            title?: string | undefined;
            titleId?: string | undefined;
        } & RefAttributes<SVGSVGElement>
    >;
    newTab?: boolean;
}[] = [
    { name: 'Dashboard', href: '/app/client', icon: HomeIcon },
    {
        name: 'Hiring Center',
        href: '/app/client/hiring-center',
        icon: BuildingOfficeIcon,
    },
    // {
    //     name: 'My listings',
    //     href: '/app/client/my-listings',
    //     icon: ClipboardDocumentListIcon,
    // },
    {
        name: 'Browse talent',
        href: '/app/client/browse-talent',
        icon: UserGroupIcon,
    },
    {
        name: 'Chats',
        href: '/app/client/chats',
        icon: ChatBubbleLeftRightIcon,
    },
    {
        name: 'Affiliates',
        href: '/app/client/affiliates',
        icon: ShareIcon,
    },
    {
        name: 'Support',
        href: 'https://portal.remoterep.com/support',
        icon: LifebuoyIcon,
        newTab: true,
    },
];

const administratorNavigation: {
    name: string;
    href: string;
    icon: ForwardRefExoticComponent<
        Omit<SVGProps<SVGSVGElement>, 'ref'> & {
            title?: string | undefined;
            titleId?: string | undefined;
        } & RefAttributes<SVGSVGElement>
    >;
    newTab?: boolean;
}[] = [
    { name: 'Dashboard', href: '/app/administrator', icon: HomeIcon },
    {
        name: 'Manage users',
        href: '/app/administrator/manage-users',
        icon: UserGroupIcon,
    },
    {
        name: 'Manage affiliates',
        href: '/app/administrator/manage-affiliates',
        icon: ShareIcon,
    },
];

const guestNavigation: {
    name: string;
    href: string;
    icon: ForwardRefExoticComponent<
        Omit<SVGProps<SVGSVGElement>, 'ref'> & {
            title?: string | undefined;
            titleId?: string | undefined;
        } & RefAttributes<SVGSVGElement>
    >;
    newTab?: boolean;
}[] = [];

const talentUserNavigation: {
    name: string;
    href: string;
}[] = [
    { name: 'My profile', href: '/app/profiles' },
    { name: 'Settings', href: '/app/talent/settings' },
    { name: 'Sign out', href: '/authentication/sign-out' },
];

const clientUserNavigation: {
    name: string;
    href: string;
}[] = [
    { name: 'My profile', href: '/app/profiles' },
    { name: 'Settings', href: '/app/client/settings' },
    { name: 'Sign out', href: '/authentication/sign-out' },
];

const administratorUserNavigation: {
    name: string;
    href: string;
}[] = [
    { name: 'Settings', href: '/app/administrator/settings' },
    { name: 'Sign out', href: '/authentication/sign-out' },
];

const guestUserNavigation: {
    name: string;
    href: string;
}[] = [
    { name: 'Sign up', href: '/authentication/sign-up' },
    { name: 'Sign in', href: '/authentication/sign-in' },
];

export {
    talentNavigation,
    clientNavigation,
    administratorNavigation,
    guestNavigation,
    talentUserNavigation,
    clientUserNavigation,
    administratorUserNavigation,
    guestUserNavigation,
};
