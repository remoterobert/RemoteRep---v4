import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import apiRequest from 'services/apiRequest';
import { Chat, Message } from 'types';

const ChatForm = ({
    message,
    selectedChat,
    setChats,
    setSelectedChat,
    setCurrentMessage,
}: {
    message: Message | undefined;
    selectedChat: Chat | undefined;
    setChats: (chats: Chat[]) => void;
    setSelectedChat: (chat: Chat) => void;
    setCurrentMessage: (message?: Message) => void;
}) => {
    const { register, handleSubmit, resetField, setValue, watch } = useForm();

    useEffect(() => {
        if (message?.id) {
            setValue('message', message.message);
        } else setValue('message', '');
    }, [message]);

    const onSubmit = (textVal: any) => {
        if (selectedChat && textVal.message.trim() !== '') {
            if (message?.id) {
                apiRequest(
                    'PATCH',
                    `/chats/${selectedChat.id}/${message.id}`,
                    textVal
                ).then((retChats: any) => {
                    if (retChats.status === 200) {
                        resetField('message');
                        setCurrentMessage(undefined);

                        setChats(retChats?.data?.chats);
                        setSelectedChat(
                            retChats?.data?.chats?.find(
                                (cc: any) => cc.id === selectedChat.id
                            )
                        );
                    }
                });
            } else {
                apiRequest('POST', `/chats/${selectedChat.id}`, textVal).then(
                    (retChats: any) => {
                        if (retChats.status === 201) {
                            resetField('message');

                            setChats(retChats?.data?.chats);
                            setSelectedChat(
                                retChats?.data?.chats?.find(
                                    (cc: any) => cc.id === selectedChat.id
                                )
                            );
                        }
                    }
                );
            }
        }
    };

    return (
        <div className="bg-white dark:bg-darkForeground h-[7vh] px-8 py-4 rounded-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className='inline-flex w-full items-center'>
                <PaperClipIcon className="h-8 w-8 text-[#818594] dark:text-midBlue mr-6"/>
                <div className="inline-flex px-4 items-center w-full bg-background dark:bg-[#0E162F] rounded-xl">
                    <textarea
                        {...{
                            ...register('message', {
                                required: true,
                                maxLength: 400,
                            }),
                            style: {
                                border: 'none',
                                outline: 'none',
                                boxShadow: 'none', // Removes focus shadow
                                resize: 'none',
                            },
                            className:
                                'mr-2 resize-none border-none outline-none h-12 block w-full bg-background dark:bg-[#0E162F] py-2 px-2 text-gray-900 dark:text-white shadow-sm placeholder:text-gray-400 dark:placeholder:text-midBlue sm:text-xl sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-background disabled:text-gray-500',
                            autoComplete: 'off',
                            disabled: !selectedChat,
                            placeholder:"Type a message"
                        }}
                    />

                    <button
                        type="submit"
                        className="flex items-center justify-center bg-background dark:bg-[#0E162F] px-3 py-2 text-sm sm:col-start-1 sm:mt-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                    >
                        {/* <PaperAirplaneIcon
                            className={`h-6 w-6 ${
                                selectedChat ? 'text-primary' : 'text-gray-400'
                            }`}
                        /> */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M14.1401 0.959066L5.11012 3.95907C-0.959883 5.98907 -0.959883 9.29907 5.11012 11.3191L7.79012 12.2091L8.68012 14.8891C10.7001 20.9591 14.0201 20.9591 16.0401 14.8891L19.0501 5.86907C20.3901 1.81907 18.1901 -0.390934 14.1401 0.959066ZM14.4601 6.33907L10.6601 10.1591C10.5101 10.3091 10.3201 10.3791 10.1301 10.3791C9.94012 10.3791 9.75012 10.3091 9.60012 10.1591C9.46064 10.0179 9.38242 9.8275 9.38242 9.62907C9.38242 9.43064 9.46064 9.2402 9.60012 9.09907L13.4001 5.27907C13.6901 4.98907 14.1701 4.98907 14.4601 5.27907C14.7501 5.56907 14.7501 6.04907 14.4601 6.33907Z" fill="#0079FE"/>
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatForm;
