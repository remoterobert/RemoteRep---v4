import { isUserOnline } from 'services/utils/isUserOnline';
import { formatAsterisks } from 'services/utils/strings';
import { Chat, Client, Talent } from 'types';
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

const ContactItem = ({
    chat,
    selected,
    onSelectChat,
    user,
}: {
    chat: Chat;
    selected?: boolean;
    onSelectChat: () => void;
    user: any;
}) => {
    const { lastMessage, target } = chat;

    const isOnline = isUserOnline(chat.target.dateLastOnline);
    const isUnreadMessages =
        lastMessage.author !== user.id &&
        chat.datesSeen[user.id] < lastMessage.dateCreated;

    const deletedOrSuspended = target?.deleted || target?.suspended;

    return (
        <div
            onClick={onSelectChat}
            className={`h-[10vh] w-full flex items-center ${
                selected && 'bg-gray-200 dark:bg-lightForeground'
            } border-gray-900/5 border-b-2`}
        >
            <div className="px-4 py-4 w-full relative">
                {isUnreadMessages && (
                    <ChatBubbleBottomCenterTextIcon className="w-4 text-green-500 absolute right-1 top-4" />
                )}
                <div className="inline-flex w-full">
                    <div className="relative h-full shrink-0">
                        {deletedOrSuspended ? (
                            <div className="h-10 w-10 rounded-full shrink-0 bg-gray-500" />
                        ) : (
                            <img
                                src={
                                    (target as Talent)?.talentData?.profile
                                        ?.photoUrl ||
                                    (target as Client)?.clientData?.profile
                                        ?.photoUrl
                                }
                                className="h-10 w-10 rounded-full shrink-0"
                            />
                        )}
                        <div
                            className={`absolute inline-flex items-center justify-center w-3 h-3 ${
                                isOnline ? 'bg-green-500' : 'bg-gray-500'
                            } border-2 border-white rounded-full bottom-0 right-0 dark:border-gray-600`}
                        />
                    </div>
                    <div className="ml-4 my-auto w-full">
                        <span className="text-lg whitespace-nowrap inline-flex font-medium text-gray-900 dark:text-white">
                            {target?.deleted
                                ? 'Deleted user'
                                : target?.suspended
                                ? 'Suspended user'
                                : `${target?.contact?.firstName} ${target?.contact?.lastName}`}
                        </span>
                        <div>
                            {lastMessage.message ? (
                                <p
                                    className="text-gray-700 dark:text-gray-500 truncate w-[70%]"
                                    dangerouslySetInnerHTML={{
                                        __html: `${
                                            lastMessage.author === target?.id
                                                ? target?.contact?.firstName
                                                : 'You'
                                        }: ${formatAsterisks(
                                            !lastMessage.deleted &&
                                                !lastMessage.deletedByAdmin
                                                ? lastMessage.message
                                                : '<span class="font-light italic">Message deleted by user.</span>'
                                        )}`,
                                    }}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactItem;
