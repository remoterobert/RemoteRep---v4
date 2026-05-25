import { CheckIcon } from '@heroicons/react/24/outline';
import { MouseEvent } from 'react';
import { formatAsterisks, replaceUrlsWithLinks } from 'services/utils/strings';
import { Chat, Message } from 'types';

const MessageCard = ({
    chat,
    message,
    onRightClick,
    isDropdownMessage,
    children,
}: {
    chat: Chat;
    message: Message;
    isDropdownMessage?: boolean;
    onRightClick: (message: Message) => (event: MouseEvent) => void;
    children: React.ReactNode;
}) => {
    if (message.author === chat.target.id) {
        return (
            <div
                className={`w-full flex group ${
                    isDropdownMessage && 'relative'
                }`}
                onContextMenu={onRightClick(message)}
            >
                <div className="bg-background dark:bg-darkBackground text-black dark:text-white px-4 py-2 rounded-xl md:max-w-[25vw]">
                    {message?.deleted ? (
                        <p className="text-xs font-light italic text-gray-200">
                            Message deleted by user.
                        </p>
                    ) : (
                        <p
                            className="mr-2 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{
                                __html: replaceUrlsWithLinks(
                                    formatAsterisks(message.message)
                                ),
                            }}
                        />
                    )}
                    {message.dateCreated !== message.dateUpdated &&
                        !message.deleted &&
                        !message.deletedByAdmin && (
                            <span className="text-xs font-light italic text-gray-200">
                                edited
                            </span>
                        )}
                </div>
                <span className="invisible group-hover:visible text-xs text-gray-400 ml-2 my-auto">
                    {new Date(message.dateCreated).toLocaleTimeString()}
                </span>
            </div>
        );
    }
    return (
        <div
            className={`w-full flex justify-end group ${
                isDropdownMessage && 'relative'
            }`}
            onContextMenu={onRightClick(message)}
        >
            <span className="invisible group-hover:visible text-xs text-gray-400 mr-2 my-auto">
                {new Date(message.dateCreated).toLocaleString()}
            </span>
            <div className="bg-primaryBlue flex items-end text-white px-4 py-2 rounded-xl md:max-w-[25vw] items-center">
                <div className="mr-2">
                    {message?.deleted ? (
                        <p className="text-xs font-light italic text-gray-200">
                            Message deleted by user.
                        </p>
                    ) : (
                        <p
                            className="mr-2 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{
                                __html: replaceUrlsWithLinks(
                                    formatAsterisks(message.message)
                                ),
                            }}
                        />
                    )}
                    {message.dateCreated !== message.dateUpdated &&
                        !message.deleted &&
                        !message.deletedByAdmin && (
                            <span className="text-xs font-light italic text-gray-200">
                                edited
                            </span>
                        )}
                </div>
                {chat.dateCreated > 0 && (
                    <CheckIcon className="h-3 w-3 shrink-0" />
                )}
                {chat.datesSeen[chat.target.id] > message.dateCreated && (
                    <CheckIcon className="h-3 w-3 -ml-1 shrink-0" />
                )}
            </div>
            {children}
        </div>
    );
};

export default MessageCard;
