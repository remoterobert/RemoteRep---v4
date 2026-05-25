export interface TNotification {
    id: string;
    title: string;
    text: string;
    icon?: TSVGIcon;
    type?: TNotificationVariants;
    actions?: TNotificationAction[];
}
[];

export type TNotificationVariants = 'success' | 'warning' | 'error' | 'info';

export type TSVGIcon = React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
        title?: string | undefined;
        titleId?: string | undefined;
    } & React.RefAttributes<SVGSVGElement>
>;

export type TNotificationAction = {
    text: string;
    onClick: () => void;
    isPrimary?: boolean;
};

export type TNotificationIcons = Record<TNotificationVariants, TSVGIcon>;
