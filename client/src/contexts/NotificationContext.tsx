import React, { createContext, useState, useContext, ReactNode } from 'react';
import { TNotification } from 'types';

interface NotificationContextProps {
    notifications: TNotification[];
    addNotification: (notification: Omit<TNotification, 'id'>) => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
    undefined
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [notifications, setNotifications] = useState<TNotification[]>([]);

    const removeNotification = (id: string) => {
        setNotifications((prevNotifications) =>
            prevNotifications.filter((notification) => notification.id !== id)
        );
    };

    const addNotification = (notification: Omit<TNotification, 'id'>) => {
        const id = crypto.randomUUID();

        setNotifications((prevNotifications) => [
            { ...notification, id },
            ...prevNotifications,
        ]);

        setTimeout(() => removeNotification(id), 5000);
    };

    return (
        <NotificationContext.Provider
            value={{ notifications, addNotification, removeNotification }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = (): NotificationContextProps => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error(
            'useNotification must be used within a NotificationProvider'
        );
    }
    return context;
};
