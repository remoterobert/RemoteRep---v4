import {
    Dispatch,
    Fragment,
    SetStateAction,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useForm } from 'react-hook-form';
import FormBuilder from '../forms/formBuilder';
import { Dialog, Transition } from '@headlessui/react';

import apiRequest from 'services/apiRequest';
import { TagType } from '../../pages/app/administrator/manage-users';
import { useNotification } from 'contexts/NotificationContext';

type DataType = {
    note: string;
    tags: TagType[];
};

const NoteTagsModal: React.FC<{
    show: boolean;
    setShow: Dispatch<SetStateAction<boolean>>;
    user: any;
    setUpdate: Dispatch<SetStateAction<number>>;
    tags: TagType[];
}> = ({ show, setShow, user, setUpdate, tags = [] }) => {
    const [availableTags, setAvailableTags] = useState<TagType[]>(tags);
    const [userTags, setUserTags] = useState<TagType[]>([]);
    const { addNotification } = useNotification();

    const formHook = useForm();

    const submit = async (data: DataType) => {
        let transformedTags: string[];
        if (data.tags.length > 0) {
            transformedTags = data.tags.map(({ value }) => value);
        } else {
            transformedTags = [];
        }

        try {
            await apiRequest('PATCH', `/admin/users/${user.id}`, {
                administratorNote: data?.note?.trim(),
                administratorTags: transformedTags,
            });
            setUpdate((prev) => prev + 1);
            addNotification({
                type: 'success',
                title: 'Updated user successfully',
                text: 'Refreshing your view...',
            });
            setTimeout(() => {
                setShow(false);
                formHook.reset();
            }, 500);

            return true;
        } catch (error) {
            setShow(false);
            addNotification({
                type: 'error',
                title: 'Error while updating user',
                text: 'An unknown server error has occurred. Please try again in a few minutes.',
            });
            return false;
        }
    };

    const handleAddTag = (tag: string) => {
        setAvailableTags((prev) => [
            ...prev,
            {
                value: tag,
                display: tag,
            },
        ]);
    };

    useEffect(() => {
        setAvailableTags(tags);
        const userTags =
            availableTags?.filter((tag) =>
                user.administratorTags?.includes(tag.value)
            ) || [];
        setUserTags(userTags);
    }, [tags, user]);

    return (
        <Transition.Root show={show} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-10"
                onClose={() => {
                    setShow(false);
                }}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto scrollbar-thin">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative min-w-[70%] transform overflow-visible rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                                <FormBuilder
                                    formHook={formHook}
                                    postFunc={(data) => submit(data)}
                                    formFieldsOverride={[
                                        {
                                            className: 'col-span-6',
                                            name: 'note',
                                            type: 'text',
                                            label: 'Add note',
                                            placeholder: 'Note',
                                        },
                                        {
                                            className: 'col-span-6',
                                            name: 'tags',
                                            type: 'comboboxInputWithAddLogic',
                                            label: 'Tags',
                                            options: availableTags,
                                            selectedOptions: userTags,
                                            newItemAddFunc: handleAddTag,
                                        },
                                    ]}
                                />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default NoteTagsModal;
