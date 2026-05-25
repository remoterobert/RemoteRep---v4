import { XMarkIcon } from '@heroicons/react/20/solid';
import { useRouter } from 'next/router';
import React, { Dispatch, SetStateAction } from 'react';
import apiRequest from 'services/apiRequest';

const NotificationItem: React.FC<{
    notificationData: any;
    setNotifications: Dispatch<SetStateAction<any[]>>;
    userType: string;
}> = ({ notificationData, setNotifications, userType }) => {
    const router = useRouter();

    return (
        <div className="hover:bg-gray-800 flex relative items-center justify-between">
            <div
                onClick={(e) => {
                    e.preventDefault();
                    apiRequest(
                        'PATCH',
                        `/notifications/${notificationData.id}`
                    ).then((res) => setNotifications(res.data as any[]));

                    router.push(
                        notificationData.notificationType ===
                            'clientApplication'
                            ? `/app/client?listingId=${notificationData.listingId}`
                            : notificationData.notificationType ===
                              'clientApplication'
                            ? '/app/talent'
                            : notificationData.notificationType === 'chat'
                            ? `/app/${userType}/chats?target=${notificationData.targetId}`
                            : '/app'
                    );
                }}
                className="text-gray-200 hover:text-white inline-flex mt-2"
            >
                <div
                    className={`mx-2 my-auto ${
                        notificationData.seen
                            ? 'text-gray-600 bg-gray-600/10'
                            : 'text-red-600 bg-red-600/10'
                    }  flex-none rounded-full p-1`}
                >
                    <div className="h-1.5 w-1.5 rounded-full bg-current" />
                </div>
                <span className="line-clamp-2 h-12 text-sm py-2 flex items-center">
                    {notificationData.notificationTitle}
                </span>
            </div>
            <XMarkIcon
                onClick={(e) => {
                    e.preventDefault();
                    apiRequest(
                        'DELETE',
                        `/notifications/${notificationData.id}`
                    ).then((res) => setNotifications(res.data as any[]));
                }}
                className="shrink-0 mx-2 h-4 w-4 text-gray-200 hover:text-white"
            />
        </div>
    );
};

export default NotificationItem;
