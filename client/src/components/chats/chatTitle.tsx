import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getLastSeenInfo } from 'services/utils/getLastSeenInfo';
import { getUserLocalTime } from 'services/utils/getUserLocalTime';
import { isUserOnline } from 'services/utils/isUserOnline';
import { Client, Talent } from 'types';

const ChatTitle = ({
    userContact,
    onBackward,
}: {
    userContact: (Talent | Client) & {
        dateLastOnline: number;
        userTimeZone?: string;
        deleted?: boolean;
    };
    onBackward: () => void;
}) => {
    const isOnline = isUserOnline(userContact.dateLastOnline);
    const lastSeen = !isOnline && getLastSeenInfo(userContact.dateLastOnline);

    const targetLocalTime =
        userContact.userTimeZone && getUserLocalTime(userContact.userTimeZone);

    return (
        <>
            <div className="inline-flex w-full items-center">
                <ArrowLeftIcon
                    className="text-white w-6 h-6 mr-4 md:hidden"
                    onClick={onBackward}
                />
                <div className="relative">
                    <div
                        className={`absolute inline-flex items-center justify-center w-2 h-2 ${
                            isOnline ? 'bg-green-500' : 'bg-gray-500'
                        } border-2 border-white rounded-full bottom-0 right-0 dark:border-gray-600`}
                    />
                    {userContact?.deleted || userContact?.suspended ? (
                        <div className="h-12 w-12 rounded-full shrink-0 bg-gray-500" />
                    ) : (
                        <img
                            src={
                                (userContact as Talent).talentData?.profile
                                    ?.photoUrl ||
                                (userContact as Client).clientData?.profile
                                    ?.photoUrl
                            }
                            className="h-12 w-12 rounded-full shrink-0"
                        />
                    )}
                </div>
                <div className="flex flex-col ml-4 my-auto w-full">
                    <div className="">
                        <span className="text-lg whitespace-nowrap inline-flex font-medium text-gray-900 dark:text-white">
                            {userContact?.deleted
                                ? 'Deleted user'
                                : userContact?.suspended
                                ? 'Suspended user'
                                : `${userContact.contact?.firstName} ${userContact.contact?.lastName}`}
                        </span>
                    </div>
                    {targetLocalTime && (
                        <span className="text-xs whitespace-nowrap inline-flex font-medium text-gray-400">
                            Local time: {targetLocalTime}
                        </span>
                    )}
                    {!isOnline && userContact.dateLastOnline && (
                        <p className="text-xs mt-1 text-gray-400">{lastSeen}</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default ChatTitle;
