import { ClockIcon } from '@heroicons/react/24/outline';
import { Fragment, cache, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import apiRequest from 'services/apiRequest';
import { Chat, Message } from 'types';
import ChatTitle from './chatTitle';
import MessageCard from './messageCard';
import ContactItem from './contactItem';
import ChatForm from './chatForm';
import { Transition } from '@headlessui/react';
import { PencilIcon, TrashIcon } from '@heroicons/react/20/solid';
import * as localData from '../../services/localData';

const ChatsLayout: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(true);
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [update, setUpdate] = useState(0);
    const [showContacts, setShowContacts] = useState<boolean>(true);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [dropdownMessage, setDropdownMessage] = useState<Message>();
    const [currentMessage, setCurrentMessage] = useState<Message>();
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [user, setUser] = useState<any>();

    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const handleRightClick =
        (message: Message) => (event: React.MouseEvent) => {
            event.preventDefault();
            setDropdownMessage(message);
            setIsDropdownVisible(true);
        };

    const handleEdit = (message: Message) => {
        setCurrentMessage(message);
        setIsEdit(true);
        setIsDropdownVisible(false);
    };

    const handleDelete = async (message: Message) => {
        setIsDropdownVisible(false);
        await apiRequest('DELETE', `/chats/${selectedChat?.id}/${message?.id}`);
        setCurrentMessage(undefined);
    };

    const getChatMessages = async (
        triggerLoader: boolean = false,
        chatId: string
    ) => {
        triggerLoader && setMessagesLoading(true);
        const chatMessagesRequest = await apiRequest('GET', `/chats/${chatId}`);

        if (chatMessagesRequest?.status === 200) {
            setMessages(chatMessagesRequest.data!.messages);
        }
        triggerLoader && setMessagesLoading(false);
    };

    useEffect(
        () => bottomRef.current?.scrollIntoView({ behavior: 'instant' }),
        [messagesLoading, selectedChat, chats]
    );

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsDropdownVisible(false);
                setCurrentMessage(undefined);
                setDropdownMessage(undefined);
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    let timeoutSet = false;

    useEffect(() => {
        if (!router.isReady) return;

        (async () => {
            const cacheChats = (await apiRequest('GET', '/chats'))?.data?.chats;

            setChats(cacheChats);

            if (selectedChat) {
                setSelectedChat(
                    cacheChats.find((c: any) => c.id === selectedChat.id)
                );
                await getChatMessages(false, selectedChat.id);
            } else if (router.query.target) {
                if (
                    !cacheChats ||
                    !cacheChats.some((c: any) =>
                        c.chatUsers.includes(router.query.target)
                    )
                ) {
                    await apiRequest('POST', '/chats', {
                        target: router.query.target,
                    });

                    setTimeout(() => setUpdate(update + 1), 5000);
                    timeoutSet = true;

                    return;
                } else
                    setSelectedChat(
                        cacheChats.find((c: any) =>
                            c.chatUsers.includes(router.query.target)
                        )
                    );
            }

            setLoading(false);

            if (!timeoutSet) setTimeout(() => setUpdate(update + 1), 5000);
            timeoutSet = true;
        })();
    }, [router.isReady, router.query, update]);

    useEffect(() => {
        setUser(localData.get('user'));

        if (selectedChat?.id) {
            getChatMessages(true, selectedChat.id);
        }
    }, [selectedChat?.id]);

    return (
        <>
            {/* Common header */}

            {/* Page-specific content */}
            <div className="mx-auto my-auto grid grid-cols-4 shadow-md h-[calc(screen + 10px)] p-8">
                <div
                    className={`col-span-4 md:col-span-1 bg-white dark:bg-darkForeground ${
                        !showContacts ? 'hidden' : 'block'
                    } md:block overflow-y-auto scrollbar-thin md:mr-4 rounded-2xl scrollbar-thin`}
                >
                    <div className="h-[7vh] flex items-center border-gray-900/5 dark:border-b-midBlue bg-white dark:bg-darkForeground border-b-2">
                        <span className="text-gray-900 dark:text-white px-4 py-2 font-medium">
                            Contacts
                        </span>
                    </div>

                    {loading && (
                        <div className="h-full w-full flex items-center justify-center bg-white dark:bg-darkBackground">
                            <ClockIcon className="h-8 w-8 text-gray-900 dark:text-white" />
                        </div>
                    )}

                    {!loading &&
                        chats?.map((chat) => (
                            <ContactItem
                                key={`contact-${chat.id}`}
                                chat={chat}
                                onSelectChat={() => {
                                    setSelectedChat(chat);
                                    getChatMessages(true, chat.id);
                                    setShowContacts(false);
                                }}
                                selected={chat.id === selectedChat?.id}
                                user={user}
                            />
                        ))}
                </div>

                <div
                    className={`col-span-4 md:col-span-3 md:mt-0 ${
                        showContacts ? 'hidden' : 'block'
                    } md:block ml-4 rounded-2xl bg-white dark:bg-darkForeground pb-8`}
                >
                    <div className="h-[7vh] flex flex-col items-start justify-center px-4 border-b-2 border-gray-900/5 dark:border-b-midBlue">
                        {selectedChat && (
                            <ChatTitle
                                userContact={selectedChat.target}
                                onBackward={() => setShowContacts(true)}
                            />
                        )}
                    </div>
                    <div className="bg-white dark:bg-darkForeground h-[80vh] overflow-y-scroll scrollbar-thin p-8 scrollbar-thin">
                        {!selectedChat && (
                            <div className="h-full w-full flex items-center justify-center">
                                <span className="mx-auto my-auto text-gray-400 font-medium">
                                    Please select a chat to see conversation
                                </span>
                            </div>
                        )}

                        {messagesLoading ? (
                            <div className="h-full w-full flex items-center justify-center">
                                <ClockIcon className="h-8 w-8 text-gray-900 dark:text-white" />
                            </div>
                        ) : selectedChat ? (
                            <div className="grid gap-2">
                                {messages.map((message) => (
                                    <MessageCard
                                        message={message}
                                        chat={selectedChat}
                                        onRightClick={handleRightClick}
                                        isDropdownMessage={
                                            dropdownMessage?.message ===
                                                message.message &&
                                            dropdownMessage.dateCreated ===
                                                message.dateCreated
                                        }
                                    >
                                        {isDropdownVisible &&
                                            dropdownMessage?.message ===
                                                message.message &&
                                            dropdownMessage.dateCreated ===
                                                message.dateCreated && (
                                                <Transition
                                                    show={isDropdownVisible}
                                                    as={Fragment}
                                                    enter="transition ease-out duration-100"
                                                    enterFrom="transform opacity-0 scale-95"
                                                    enterTo="transform opacity-100 scale-100"
                                                    leave="transition ease-in duration-75"
                                                    leaveFrom="transform opacity-100 scale-100"
                                                    leaveTo="transform opacity-0 scale-95"
                                                >
                                                    <div
                                                        ref={dropdownRef}
                                                        className="absolute right-0 top-10 origin-bottom-right w-32 rounded-md bg-gray-900 py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
                                                    >
                                                        <div
                                                            className="group inline-flex w-full bg-gray-900 text-gray-400 block px-3 py-1 text-sm leading-6 hover:text-white hover:bg-gray-800"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    message
                                                                )
                                                            }
                                                        >
                                                            <PencilIcon className="my-auto w-4 h-4 mr-2" />
                                                            Edit
                                                        </div>
                                                        <div
                                                            className="group inline-flex w-full bg-gray-900 text-gray-400 block px-3 py-1 text-sm leading-6 hover:text-white hover:bg-gray-800"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    message
                                                                )
                                                            }
                                                        >
                                                            <TrashIcon className="my-auto w-4 h-4 mr-2" />
                                                            Delete
                                                        </div>
                                                    </div>
                                                </Transition>
                                            )}
                                    </MessageCard>
                                ))}
                                <div ref={bottomRef} />
                            </div>
                        ) : null}
                    </div>
                    <ChatForm
                        message={isEdit ? currentMessage : undefined}
                        selectedChat={selectedChat}
                        setChats={setChats}
                        setSelectedChat={setSelectedChat}
                        setCurrentMessage={setCurrentMessage}
                    />
                </div>
            </div>
        </>
    );
};

export default ChatsLayout;
