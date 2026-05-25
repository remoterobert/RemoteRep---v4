import type { NextPage } from 'next';
import {
    ClockIcon,
    KeyIcon,
    LifebuoyIcon,
    LinkIcon,
    ShieldCheckIcon,
    PencilIcon,
    XCircleIcon,
    FunnelIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Table from 'components/tables/table';
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';
import { Dialog, Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import * as localData from 'services/localData';
import * as authService from 'services/authentication';
import { useForm } from 'react-hook-form';
import FormBuilder from 'components/forms/formBuilder';
import { useNotification } from 'contexts/NotificationContext';
import DeleteAccountModal from 'components/profiles/deleteAccountModal';
import DeleteUser from '../../../components/commons/deleteUserModal';
import NoteTagsModal from '../../../components/commons/noteTagsModal';

export type TagType = {
    display: string;
    value: string;
};

const accessTypeMap = {
    listing: 'Listing',
    legacy: 'Legacy',
    all: 'Subscription',
    privileged: 'Privileged',
    standard: 'Standard',
};

const ManageUsers: NextPage = () => {
    const [loading, setLoading] = useState(true);
    const [update, setUpdate] = useState(0);
    const [users, setUsers] = useState<any[]>([]);
    const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const [searchType, setSearchType] = useState('any');
    const [showRegister, setShowRegister] = useState(false);
    const [searchTags, setSearchTags] = useState<string[]>([]);
    const [searchNote, setSearchNote] = useState('');
    const [searchAccess, setSearchAccess] = useState('any');
    const [sortBy, setSortBy] = useState('creation');

    const [showNoteTagsModal, setShowNoteTagsModal] = useState(false);
    const [userToEdit, setUserToEdit] = useState({});
    const [availableTags, setAvailableTags] = useState<TagType[]>([]);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordActions, setShowPasswordActions] = useState(false);
    const [passwordUserId, setPasswordUserId] = useState<string>('');

    const getAvailableTags = () => {
        const tags = users
            ? Array.from(
                  new Set(
                      users
                          .filter((user) => user?.administratorTags?.length > 0)
                          .map((user) => user.administratorTags)
                          .flat()
                  )
              )?.map((tag) => ({
                  display: tag,
                  value: tag,
              }))
            : [];

        setAvailableTags(tags);
    };

    const handelCloseDeleteModal = () => {
        setShowDeleteModal(false);
    };

    const { addNotification } = useNotification();

    useEffect(() => {
        let cacheUsers = users;

        if (searchText) {
            cacheUsers = cacheUsers.filter(
                (u: any) =>
                    u?.email
                        ?.toLowerCase()
                        ?.includes(searchText.toLowerCase()) ||
                    u?.contact?.firstName
                        ?.toLowerCase()
                        ?.includes(searchText.toLowerCase()) ||
                    u?.contact?.lastName
                        ?.toLowerCase()
                        ?.includes(searchText.toLowerCase()) ||
                    `${u?.contact?.firstName} ${u?.contact?.lastName}`
                        .toLowerCase()
                        ?.includes(searchText.toLowerCase())
            );
        }

        if (searchType !== 'any') {
            cacheUsers = cacheUsers.filter(
                (u: any) => u.accountType === searchType
            );
        }

        if (searchAccess !== 'any') {
            cacheUsers = cacheUsers.filter(
                (u: any) => u?.lastAccess === searchAccess
            );
        }

        if (searchTags.length > 0) {
            cacheUsers = cacheUsers.filter((user) =>
                user?.administratorTags?.some((tag: string) =>
                    searchTags.includes(tag)
                )
            );
        }

        if (searchNote) {
            cacheUsers = cacheUsers.filter((user) =>
                user?.administratorNote?.includes(searchNote)
            );
        }

        setSearchedUsers(cacheUsers);
    }, [searchText, searchType, searchAccess, users, searchTags, searchNote]);

    useEffect(() => {
        (async () => {
            const usersReq = await apiRequest('GET', '/admin/users');
            if (usersReq?.data?.users.length)
                setUsers(
                    usersReq.data.users.sort((a: any, b: any) =>
                        sortBy === 'creation'
                            ? a.dateCreated > b.dateCreated
                                ? -1
                                : 1
                            : (a?.dateLastOnline || 0) >
                              (b?.dateLastOnline || 0)
                            ? -1
                            : 1
                    )
                );

            setLoading(false);
        })();
    }, [update, sortBy]);

    useEffect(() => {
        users.length > 0 && getAvailableTags();
    }, [users]);

    const RegisterModal: React.FC<{
        show: boolean;
        setShow: Dispatch<SetStateAction<boolean>>;
    }> = (props) => {
        const registerForm = useForm();

        return (
            <Transition.Root show={props.show} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={props.setShow}
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
                                <Dialog.Panel className="relative transform overflow-visible rounded-lg bg-white dark:bg-darkForeground px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                                    <FormBuilder
                                        {...{
                                            formHook: registerForm,
                                            formName: 'adminRegister',
                                            submitText: 'Create',
                                            postFunc: async (data) => {
                                                try {
                                                    const authRequest =
                                                        await apiRequest(
                                                            'POST',
                                                            '/admin/users',
                                                            Object.fromEntries(
                                                                Object.entries(
                                                                    data
                                                                ).map(
                                                                    ([k, v]) =>
                                                                        v
                                                                            ? [
                                                                                  k,
                                                                                  v,
                                                                              ]
                                                                            : []
                                                                )
                                                            )
                                                        );

                                                    if (
                                                        authRequest.status ===
                                                        201
                                                    ) {
                                                        setUpdate(update + 1);

                                                        addNotification({
                                                            type: 'success',
                                                            title: 'User created successfully',
                                                            text: 'Refreshing your view...',
                                                        });

                                                        return true;
                                                    } else {
                                                        addNotification({
                                                            type: 'error',
                                                            title: 'User could not be created',
                                                            text:
                                                                authRequest?.error ||
                                                                'An unknown server error has occurred. Please try again in a few minutes.',
                                                        });

                                                        return false;
                                                    }
                                                } catch {
                                                    addNotification({
                                                        type: 'error',
                                                        title: 'Error creating user',
                                                        text: 'An unknown server error has occurred. Please try again in a few minutes.',
                                                    });

                                                    return false;
                                                }
                                            },
                                        }}
                                    />
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        );
    };

    const PasswordActionsModal: React.FC<{
        show: boolean;
        setShow: Dispatch<SetStateAction<boolean>>;
    }> = (props) => {
        const changeForm = useForm();

        return (
            <Transition.Root show={props.show} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={props.setShow}
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
                                <Dialog.Panel className="relative transform overflow-visible rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                                    <button
                                        className="inline-flex w-full min-w-max h-12 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 hover:filter hover:brightness-[95%] sm:col-start-1 sm:mt-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                        onClick={async () => {
                                            try {
                                                const { error } =
                                                    await apiRequest(
                                                        'GET',
                                                        `/admin/users/${passwordUserId}/reset-password`
                                                    );

                                                addNotification({
                                                    type: error
                                                        ? 'error'
                                                        : 'success',
                                                    title: error
                                                        ? 'Email could not be sent'
                                                        : 'Email sent',
                                                    text:
                                                        error ||
                                                        `Password-reset email sent successfully.`,
                                                });

                                                setTimeout(
                                                    () =>
                                                        setShowPasswordActions(
                                                            !!error
                                                        ),
                                                    1000
                                                );
                                            } catch {
                                                addNotification({
                                                    type: 'error',
                                                    title: 'Error sending password-reset email',
                                                    text: 'An unknown server error has occurred. Please try again in a few minutes.',
                                                });
                                            }
                                        }}
                                    >
                                        Send password-reset email
                                    </button>

                                    <div className="relative my-4">
                                        <div
                                            className="absolute inset-0 flex items-center"
                                            aria-hidden="true"
                                        >
                                            <div className="w-full border-t border-gray-300" />
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-white px-2 text-sm text-gray-500">
                                                OR
                                            </span>
                                        </div>
                                    </div>

                                    <FormBuilder
                                        {...{
                                            formHook: changeForm,
                                            formName: 'adminChangePassword',
                                            submitText: 'Change password',
                                            postFunc: async (data) => {
                                                try {
                                                    const { error } =
                                                        await apiRequest(
                                                            'POST',
                                                            `/admin/users/${passwordUserId}/reset-password`,
                                                            data
                                                        );

                                                    addNotification({
                                                        type: error
                                                            ? 'error'
                                                            : 'success',
                                                        title: error
                                                            ? 'Password could not be changed'
                                                            : 'Password changed',
                                                        text:
                                                            error ||
                                                            `Password changed successfully.`,
                                                    });

                                                    setTimeout(
                                                        () =>
                                                            setShowPasswordActions(
                                                                !!error
                                                            ),
                                                        1000
                                                    );

                                                    return !error;
                                                } catch {
                                                    addNotification({
                                                        type: 'error',
                                                        title: 'Error changing password',
                                                        text: 'An unknown server error has occurred. Please try again in a few minutes.',
                                                    });

                                                    return false;
                                                }
                                            },
                                        }}
                                    />
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        );
    };

    return (
        <>
        <div className="bg-background dark:bg-darkBackground pl-8 pt-8 pr-8 pb-6">
            <div className="w-full flex justify-between items-center bg-white dark:bg-darkForeground  p-4 rounded-2xl">
                <div className="grid gap-4 grid-cols-7 items-center px-4">
                    <div className="relative col-span-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                            <MagnifyingGlassIcon className="h-5 w-5 text-black dark:text-gray-400" />
                        </div>
                        <input
                            onChange={(e) => setSearchText(e.target.value)}
                            type="text"
                            className="block w-full h-9 pl-10 my-auto bg-transparent rounded-md border-0 py-1.5 text-black dark:text-gray-400 shadow-sm ring-2 ring-inset ring-background dark:ring-midBlue placeholder:text-black dark:placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="Search users..."
                        />
                    </div>
                    <div className="relative col-span-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                            <MagnifyingGlassIcon className="h-5 w-5 text-black dark:text-gray-400" />
                        </div>
                        <input
                            onChange={(e) => setSearchNote(e.target.value)}
                            type="text"
                            className="block w-full h-9 pl-10 my-auto bg-transparent rounded-md border-0 py-1.5 text-black dark:text-gray-400 shadow-sm ring-2 ring-inset ring-background dark:ring-midBlue placeholder:text-black dark:placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="Search by note..."
                        />
                    </div>
                    <Listbox
                        multiple
                        value={searchTags}
                        onChange={(data) => setSearchTags(data)}
                    >
                        <div className="relative col-span-1">
                            <Listbox.Button className="relative w-full cursor-default overflow-hidden rounded-lg bg-transparent text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                                <span className="block w-full rounded-md px-2 py-1.5 text-black dark:text-gray-400 shadow-sm ring-2 ring-inset ring-background dark:ring-midBlue placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                    <FunnelIcon className='h-5 w-5 inline mr-2'/>
                                    {searchTags?.join(', ') || 'All tags'}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronUpDownIcon
                                        className="h-5 w-5 text-gray-400 dark:text-white"
                                        aria-hidden="true"
                                    />
                                </span>
                            </Listbox.Button>
                            <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <Listbox.Options className="z-10 absolute mt-1 max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-darkForeground text-black dark:text-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {availableTags.map((option, i) => (
                                        <Listbox.Option
                                            key={option.value}
                                            value={option.value}
                                            className={({ active }) =>
                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                    active
                                                        ? 'bg-primaryBlue text-white'
                                                        : 'text-gray-900 dark:text-white'
                                                }`
                                            }
                                        >
                                            {({ selected, active }) => (
                                                <>
                                                    <span
                                                        className={`block truncate ${
                                                            selected
                                                                ? 'font-medium'
                                                                : 'font-normal'
                                                        }`}
                                                    >
                                                        {option.display}
                                                    </span>
                                                    {selected ? (
                                                        <span
                                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                active
                                                                    ? 'text-white'
                                                                    : 'text-primaryBlue'
                                                            }`}
                                                        >
                                                            <CheckIcon
                                                                className="h-5 w-5"
                                                                aria-hidden="true"
                                                            />
                                                        </span>
                                                    ) : null}
                                                </>
                                            )}
                                        </Listbox.Option>
                                    ))}
                                </Listbox.Options>
                            </Transition>
                        </div>
                    </Listbox>

                    <Listbox
                        value={searchType}
                        onChange={(data) => setSearchType(data)}
                    >
                        <div className="relative col-span-1">
                            <Listbox.Button className="relative w-full cursor-default overflow-hidden rounded-lg bg-transparent text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                                <span className="block w-full rounded-md px-2 py-1.5 text-black dark:text-gray-400 shadow-sm ring-2 ring-inset ring-background dark:ring-midBlue placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                    <FunnelIcon className='h-5 w-5 inline mr-2'/>
                                    {`${searchType[0].toUpperCase()}${searchType.slice(
                                        1
                                    )}`}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronUpDownIcon
                                        className="h-5 w-5 text-gray-400 dark:text-white"
                                        aria-hidden="true"
                                    />
                                </span>
                            </Listbox.Button>
                            <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <Listbox.Options className="z-10 absolute mt-1 max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-darkForeground text-black dark:text-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {[
                                        'any',
                                        'talent',
                                        'client',
                                        'administrator',
                                    ].map((option, i) => (
                                        <Listbox.Option
                                            key={i}
                                            value={option}
                                            className={({ active }) =>
                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                    active
                                                        ? 'bg-primaryBlue text-white'
                                                        : 'text-gray-900 dark:text-white'
                                                }`
                                            }
                                        >
                                            {({ selected, active }) => (
                                                <>
                                                    <span
                                                        className={`block truncate ${
                                                            selected
                                                                ? 'font-medium'
                                                                : 'font-normal'
                                                        }`}
                                                    >
                                                        {`${option[0].toUpperCase()}${option.slice(
                                                            1
                                                        )}`}
                                                    </span>
                                                    {selected ? (
                                                        <span
                                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                active
                                                                    ? 'text-white'
                                                                    : 'text-primaryBlue'
                                                            }`}
                                                        >
                                                            <CheckIcon
                                                                className="h-5 w-5"
                                                                aria-hidden="true"
                                                            />
                                                        </span>
                                                    ) : null}
                                                </>
                                            )}
                                        </Listbox.Option>
                                    ))}
                                </Listbox.Options>
                            </Transition>
                        </div>
                    </Listbox>

                    <Listbox
                        value={searchAccess}
                        onChange={(data) => setSearchAccess(data)}
                    >
                        <div className="relative col-span-1">
                            <Listbox.Button className="relative w-full cursor-default overflow-hidden rounded-lg bg-transparent text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                                <span className="block w-full rounded-md px-2 py-1.5 text-black dark:text-gray-400 shadow-sm ring-2 ring-inset ring-background dark:ring-midBlue placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                    {
                                        {
                                            any: 'Any access',
                                            listing: 'Listing',
                                            all: 'Subscription',
                                            privileged: 'Privileged',
                                            legacy: 'Legacy',
                                        }[searchAccess]
                                    }
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronUpDownIcon
                                        className="h-5 w-5 text-gray-400 dark:text-white"
                                        aria-hidden="true"
                                    />
                                </span>
                            </Listbox.Button>
                            <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <Listbox.Options className="z-10 absolute mt-1 max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-darkForeground text-black dark:text-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {[
                                        'any',
                                        'listing',
                                        'all',
                                        'privileged',
                                        'legacy',
                                    ].map((option, i) => (
                                        <Listbox.Option
                                            key={i}
                                            value={option}
                                            className={({ active }) =>
                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                    active
                                                        ? 'bg-primaryBlue text-white'
                                                        : 'text-gray-900 dark:text-white'
                                                }`
                                            }
                                        >
                                            {({ selected, active }) => (
                                                <>
                                                    <span
                                                        className={`block truncate ${
                                                            selected
                                                                ? 'font-medium'
                                                                : 'font-normal'
                                                        }`}
                                                    >
                                                        {
                                                            {
                                                                any: 'Any access',
                                                                listing:
                                                                    'Listing',
                                                                all: 'Subscription',
                                                                privileged:
                                                                    'Privileged',
                                                                legacy: 'Legacy',
                                                            }[option]
                                                        }
                                                    </span>
                                                    {selected ? (
                                                        <span
                                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                active
                                                                    ? 'text-white'
                                                                    : 'text-primary'
                                                            }`}
                                                        >
                                                            <CheckIcon
                                                                className="h-5 w-5"
                                                                aria-hidden="true"
                                                            />
                                                        </span>
                                                    ) : null}
                                                </>
                                            )}
                                        </Listbox.Option>
                                    ))}
                                </Listbox.Options>
                            </Transition>
                        </div>
                    </Listbox>

                    <Listbox value={sortBy} onChange={setSortBy}>
                        <div className="relative col-span-1">
                            <Listbox.Button className="relative w-full cursor-default overflow-hidden rounded-lg bg-transparent text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                                <span className="block w-full rounded-md px-2 py-1.5 text-black dark:text-gray-400 shadow-sm ring-2 ring-inset ring-background dark:ring-midBlue placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                    {
                                        {
                                            creation: 'Sort by date created',
                                            activity:
                                                'Sort by date last active',
                                        }[sortBy]
                                    }
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronUpDownIcon
                                        className="h-5 w-5 text-gray-400 dark:text-white"
                                        aria-hidden="true"
                                    />
                                </span>
                            </Listbox.Button>
                            <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <Listbox.Options className="z-10 absolute mt-1 max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-darkForeground text-black dark:text-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {['creation', 'activity'].map(
                                        (option, i) => (
                                            <Listbox.Option
                                                key={i}
                                                value={option}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                        active
                                                            ? 'bg-primaryBlue text-white'
                                                            : 'text-gray-900 dark:text-white'
                                                    }`
                                                }
                                            >
                                                {({ selected, active }) => (
                                                    <>
                                                        <span
                                                            className={`block truncate ${
                                                                selected
                                                                    ? 'font-medium'
                                                                    : 'font-normal'
                                                            }`}
                                                        >
                                                            {
                                                                {
                                                                    creation:
                                                                        'Date created',
                                                                    activity:
                                                                        'Date last active',
                                                                }[option]
                                                            }
                                                        </span>
                                                        {selected ? (
                                                            <span
                                                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                    active
                                                                        ? 'text-white'
                                                                        : 'text-primary'
                                                                }`}
                                                            >
                                                                <CheckIcon
                                                                    className="h-5 w-5"
                                                                    aria-hidden="true"
                                                                />
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </Listbox.Option>
                                        )
                                    )}
                                </Listbox.Options>
                            </Transition>
                        </div>
                    </Listbox>

                    <span
                    onClick={() => setShowRegister(true)}
                    className="my-auto grow-0 col-span-1 h-10 py-1 px-4 text-center bg-white dark:bg-primaryBlue rounded-lg shrink-0 text-gray-900 dark:text-white font-semibold border-2 border-solid border-gray-200 dark:border-primaryBlue shadow-sm hover:shadow-md cursor-pointer"
                >
                    Create user
                </span>
                </div>
            </div>
        </div>
            {/* Page-specific content */}
            {loading && (
                <div className="flex justify-center dark:bg-darkBackground h-[100vh]">
                    <ClockIcon className="h-8 w-8 text-gray-900 dark:text-white" />
                </div>
            )}

            {!loading && (
                <Table
                    items={searchedUsers}
                    tableData={{
                        headers: [
                            'Name',
                            'Last activity',
                            'Access Type',
                            'Reference',
                            'Account Type',
                            'Authority',
                            'Account Privilege',
                            'Notes and Tags',
                            'Actions',
                        ],
                        headerClassNames: [
                            null,
                            'w-24',
                            'w-48',
                            'w-48',
                            'w-48',
                            'w-48',
                            'w-48',
                            'w-48',
                        ],
                        dataComponents: [
                            ({ item }) => (
                                <div className="flex items-center w-42">
                                    <div className="h-11 w-11 flex-shrink-0">
                                        {item.accountType ===
                                        'administrator' ? (
                                            <ShieldCheckIcon className="h-11 w-11 rounded-full text-gray-900 dark:text-white" />
                                        ) : (
                                            <img
                                                className="h-11 w-11 rounded-full"
                                                src={
                                                    item?.talentData?.profile
                                                        ?.photoUrl ||
                                                    item?.clientData?.profile
                                                        ?.photoUrl
                                                }
                                            />
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {`${item?.contact?.firstName} ${item?.contact?.lastName}`}
                                            {item?.accountType === 'client'
                                                ? ` | ${item?.contact?.companyName}`
                                                : null}
                                        </div>
                                        <div className="mt-1 text-gray-500 dark:text-white">
                                            {item?.email}
                                        </div>
                                    </div>
                                </div>
                            ),
                            ({ item }) => (
                                <div className="flex flex-col items-center justify-center space-y-2">
                                    <span className="text-sm text-gray-900 dark:text-white">
                                        {!!item?.dateLastOnline &&
                                            new Date(
                                                item.dateLastOnline
                                            ).toLocaleString()}
                                    </span>
                                </div>
                            ),
                            ({ item }) => (
                                <div className="flex flex-col items-center justify-center space-y-2 w-30">
                                    <span className="text-sm text-gray-900 dark:text-white">
                                        {item.accountType === 'administrator'
                                            ? 'Administrator'
                                            : item?.lastAccess
                                            ? accessTypeMap[
                                                  item.lastAccess as keyof typeof accessTypeMap
                                              ]
                                            : 'Standard'}
                                    </span>
                                </div>
                            ),
                            ({ item }) => (
                                <div className="group text-center w-36">
                                    <p className="text-gray-900 truncate dark:text-white">
                                        {item.creationReference !== 'default'
                                            ? item.creationReference
                                            : 'Self-registered'}
                                    </p>
                                    <p className="hidden group-hover:block whitespace-normal w-96 absolute mt-2 p-2 rounded-md bg-gray-800 text-white">
                                        {item.creationReference !== 'default'
                                            ? item.creationReference
                                            : 'Self-registered'}
                                    </p>
                                </div>
                            ),
                            ({ item }) => (
                                <Listbox
                                    value={item.accountType}
                                    onChange={(data) =>
                                        apiRequest(
                                            'PATCH',
                                            `/admin/users/${item.id}`,
                                            {
                                                accountType: data,
                                            }
                                        ).then((apiRes) => {
                                            setUpdate(update + 1);
                                            if (apiRes?.error) {
                                                addNotification({
                                                    type: 'error',
                                                    title: 'Error updating account type',
                                                    text:
                                                        apiRes?.error ||
                                                        'An unknown server error has occurred. Please try again in a few minutes.',
                                                });
                                            } else {
                                                addNotification({
                                                    type: 'success',
                                                    title: 'Account type updated',
                                                    text: 'Refreshing your view...',
                                                });
                                            }
                                        })
                                    }
                                >
                                    <div className="relative w-24">
                                        <Listbox.Button className="relative w-full cursor-default overflow-hidden rounded-lg bg-transparent text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                                            <span className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 dark:text-white shadow-sm ring-2 ring-inset ring-background dark:ring-midBlue placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                                {`${item.accountType[0].toUpperCase()}${item.accountType.slice(
                                                    1
                                                )}`}
                                            </span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <ChevronUpDownIcon
                                                    className="h-5 w-5 text-gray-400 dark:text-white"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        </Listbox.Button>
                                        <Transition
                                            as={Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <Listbox.Options className="z-10 absolute mt-1 max-h-[20vh] w-[150px] overflow-auto scrollbar-thin rounded-md bg-white dark:bg-darkForeground text-black dark:text-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                {[
                                                    'talent',
                                                    'client',
                                                    'administrator',
                                                ].map((option, i) => (
                                                    <Listbox.Option
                                                        key={i}
                                                        value={option}
                                                        className={({
                                                            active,
                                                        }) =>
                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                active
                                                                    ? 'bg-primaryBlue text-white'
                                                                    : 'text-gray-900 dark:text-white'
                                                            }`
                                                        }
                                                    >
                                                        {({
                                                            selected,
                                                            active,
                                                        }) => (
                                                            <>
                                                                <span
                                                                    className={`block truncate ${
                                                                        selected
                                                                            ? 'font-medium'
                                                                            : 'font-normal'
                                                                    }`}
                                                                >
                                                                    {`${option[0].toUpperCase()}${option.slice(
                                                                        1
                                                                    )}`}
                                                                </span>
                                                                {selected ? (
                                                                    <span
                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                            active
                                                                                ? 'text-white'
                                                                                : 'text-primary'
                                                                        }`}
                                                                    >
                                                                        <CheckIcon
                                                                            className="h-5 w-5"
                                                                            aria-hidden="true"
                                                                        />
                                                                    </span>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                ))}
                                            </Listbox.Options>
                                        </Transition>
                                    </div>
                                </Listbox>
                            ),
                            ({ item }) => (
                                <Listbox
                                    value={item.authority}
                                    onChange={(data) =>
                                        apiRequest(
                                            'PATCH',
                                            `/admin/users/${item.id}`,
                                            {
                                                authority: data,
                                            }
                                        ).then((apiRes) => {
                                            setUpdate(update + 1);
                                            if (apiRes?.error) {
                                                addNotification({
                                                    type: 'error',
                                                    title: 'Error updating authority',
                                                    text:
                                                        apiRes?.error ||
                                                        'An unknown server error has occurred. Please try again in a few minutes.',
                                                });
                                            } else {
                                                addNotification({
                                                    type: 'success',
                                                    title: 'Authority updated',
                                                    text: 'Refreshing your view...',
                                                });
                                            }
                                        })
                                    }
                                >
                                    <div className="relative">
                                        <Listbox.Button className="relative w-[126px] cursor-default overflow-hidden rounded-lg bg-transparent text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primaryBlue sm:text-sm">
                                            <span className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 dark:text-white shadow-sm ring-2 ring-inset ring-background dark:ring-midBlue placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                                {
                                                    [
                                                        {
                                                            value: 99,
                                                            display:
                                                                'Suspended',
                                                        },
                                                        {
                                                            value: 100,
                                                            display:
                                                                'Email unverified',
                                                        },
                                                        {
                                                            value: 101,
                                                            display:
                                                                'Email verified',
                                                        },
                                                        {
                                                            value: 200,
                                                            display:
                                                                'Administrator',
                                                        },
                                                        {
                                                            value: 201,
                                                            display:
                                                                'Super administrator',
                                                        },
                                                    ].find(
                                                        (o) =>
                                                            o.value ===
                                                            item.authority
                                                    )?.display
                                                }
                                            </span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <ChevronUpDownIcon
                                                    className="h-5 w-5 text-gray-400 dark:text-white"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        </Listbox.Button>
                                        <Transition
                                            as={Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <Listbox.Options className="z-10 absolute mt-1 max-h-[24vh] w-[220px] overflow-auto scrollbar-thin rounded-md bg-white dark:bg-darkForeground text-black dark:text-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                {[
                                                    {
                                                        value: 99,
                                                        display: 'Suspended',
                                                    },
                                                    {
                                                        value: 100,
                                                        display:
                                                            'Email unverified',
                                                    },
                                                    {
                                                        value: 101,
                                                        display:
                                                            'Email verified',
                                                    },
                                                    {
                                                        value: 200,
                                                        display:
                                                            'Administrator',
                                                    },
                                                    {
                                                        value: 201,
                                                        display:
                                                            'Super administrator',
                                                    },
                                                ].map((option, i) => (
                                                    <Listbox.Option
                                                        key={i}
                                                        value={option.value}
                                                        className={({
                                                            active,
                                                        }) =>
                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                active
                                                                    ? 'bg-primaryBlue text-white'
                                                                    : 'text-gray-900 dark:text-white'
                                                            }`
                                                        }
                                                    >
                                                        {({
                                                            selected,
                                                            active,
                                                        }) => (
                                                            <>
                                                                <span
                                                                    className={`block truncate ${
                                                                        selected
                                                                            ? 'font-medium'
                                                                            : 'font-normal'
                                                                    }`}
                                                                >
                                                                    {
                                                                        option.display
                                                                    }
                                                                </span>
                                                                {selected ? (
                                                                    <span
                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                            active
                                                                                ? 'text-white'
                                                                                : 'text-primary'
                                                                        }`}
                                                                    >
                                                                        <CheckIcon
                                                                            className="h-5 w-5"
                                                                            aria-hidden="true"
                                                                        />
                                                                    </span>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                ))}
                                            </Listbox.Options>
                                        </Transition>
                                    </div>
                                </Listbox>
                            ),
                            ({ item }) => (
                                <Listbox
                                    value={item?.privilegedAccount || false}
                                    onChange={(data) =>
                                        apiRequest(
                                            'PATCH',
                                            `/admin/users/${item.id}`,
                                            {
                                                privilegedAccount: data,
                                            }
                                        ).then((apiRes) => {
                                            setUpdate(update + 1);
                                            if (apiRes?.error) {
                                                addNotification({
                                                    type: 'error',
                                                    title: 'Error updating account privilege',
                                                    text:
                                                        apiRes?.error ||
                                                        'An unknown server error has occurred. Please try again in a few minutes.',
                                                });
                                            } else {
                                                addNotification({
                                                    type: 'success',
                                                    title: 'Account privilege updated',
                                                    text: 'Refreshing your view...',
                                                });
                                            }
                                        })
                                    }
                                >
                                    <div className="relative">
                                        <Listbox.Button className="relative w-[98px] cursor-default overflow-hidden rounded-lg bg-transparent text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primaryBlue sm:text-sm">
                                            <span className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 dark:text-white shadow-sm ring-2 ring-inset ring-background dark:ring-midBlue placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                                {
                                                    [
                                                        {
                                                            value: true,
                                                            display:
                                                                'Privileged',
                                                        },
                                                        {
                                                            value: false,
                                                            display: 'Standard',
                                                        },
                                                    ].find(
                                                        (o) =>
                                                            o.value ===
                                                            (item.privilegedAccount ||
                                                                false)
                                                    )?.display
                                                }
                                            </span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <ChevronUpDownIcon
                                                    className="h-5 w-5 text-gray-400 dark:text-white"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        </Listbox.Button>
                                        <Transition
                                            as={Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <Listbox.Options className="z-10 absolute mt-1 max-h-[20vh] w-[150px] overflow-auto scrollbar-thin rounded-md bg-white dark:bg-darkForeground text-black dark:text-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                {[
                                                    {
                                                        value: true,
                                                        display: 'Privileged',
                                                    },
                                                    {
                                                        value: false,
                                                        display: 'Standard',
                                                    },
                                                ].map((option, i) => (
                                                    <Listbox.Option
                                                        key={i}
                                                        value={option.value}
                                                        className={({
                                                            active,
                                                        }) =>
                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                active
                                                                    ? 'bg-primaryBlue text-white'
                                                                    : 'text-gray-900 dark:text-white'
                                                            }`
                                                        }
                                                    >
                                                        {({
                                                            selected,
                                                            active,
                                                        }) => (
                                                            <>
                                                                <span
                                                                    className={`block truncate ${
                                                                        selected
                                                                            ? 'font-medium'
                                                                            : 'font-normal'
                                                                    }`}
                                                                >
                                                                    {
                                                                        option.display
                                                                    }
                                                                </span>
                                                                {selected ? (
                                                                    <span
                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                            active
                                                                                ? 'text-white'
                                                                                : 'text-primary'
                                                                        }`}
                                                                    >
                                                                        <CheckIcon
                                                                            className="h-5 w-5"
                                                                            aria-hidden="true"
                                                                        />
                                                                    </span>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                ))}
                                            </Listbox.Options>
                                        </Transition>
                                    </div>
                                </Listbox>
                            ),
                            ({ item }) => (
                                <div className="group text-center w-36">
                                    <p className="text-gray-900 truncate">
                                        {item?.administratorNote}
                                        <br />
                                        {item?.administratorTags?.join(', ')}
                                    </p>
                                    <p className="hidden group-hover:block whitespace-normal w-96 absolute mt-2 p-2 rounded-md bg-gray-800 text-white">
                                        {item?.administratorNote}
                                        <br />
                                        {item?.administratorTags?.join(', ')}
                                    </p>
                                </div>
                            ),
                            ({ item }) => (
                                <div className="min-h-full flex justify-center items-center gap-2 px-4">
                                    <div className="group flex items-center justify-center rounded-full p-2 shadow-sm hover:shadow-md bg-secondBackground dark:bg-fieldOutline">
                                        <PencilIcon
                                            onClick={() => {
                                                setUserToEdit(item);
                                                setShowNoteTagsModal(true);
                                            }}
                                            className="h-6 w-6 text-primaryBlue group-hover:text-gray-700 dark:group-hover:text-white grow-0 font-bold"
                                            aria-hidden="true"
                                            title="Add note and tags"
                                        />
                                    </div>
                                    <div className="group flex items-center justify-center rounded-full p-2 shadow-sm hover:shadow-md bg-secondBackground dark:bg-fieldOutline">
                                        <LinkIcon
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    `${window.location.origin}/app/profiles/${item.id}`
                                                );
                                                addNotification({
                                                    type: 'success',
                                                    title: 'Link copied',
                                                    text: `${item?.contact?.firstName}'s profile link has been copied to your clipboard.`,
                                                });
                                            }}
                                            className="h-6 w-6 text-primaryBlue group-hover:text-gray-700 dark:group-hover:text-white grow-0"
                                            aria-hidden="true"
                                            title="Copy profile link"
                                        />
                                    </div>
                                    <div className="group flex items-center justify-center rounded-full p-2 shadow-sm hover:shadow-md bg-secondBackground dark:bg-fieldOutline">
                                        <KeyIcon
                                            onClick={() => {
                                                setPasswordUserId(item.id);
                                                setShowPasswordActions(true);
                                            }}
                                            className="h-6 w-6 text-primaryBlue group-hover:text-gray-700 dark:group-hover:text-white grow-0"
                                            aria-hidden="true"
                                            title="Password actions"
                                        />
                                    </div>
                                    <div className="group flex items-center justify-center rounded-full p-2 shadow-sm hover:shadow-md bg-secondBackground dark:bg-fieldOutline">
                                        <XCircleIcon
                                            onClick={() => {
                                                setUserToDelete(item);
                                                setShowDeleteModal(true);
                                            }}
                                            className="h-6 w-6 text-primaryBlue group-hover:text-gray-700 dark:group-hover:text-white grow-0"
                                            aria-hidden="true"
                                            title="Delete user"
                                        />
                                    </div>
                                    <div className="group flex items-center justify-center rounded-full p-2 shadow-sm hover:shadow-md bg-secondBackground dark:bg-fieldOutline">
                                        <LifebuoyIcon
                                            onClick={() =>
                                                apiRequest(
                                                    'GET',
                                                    `/admin/users/${item.id}/impersonate`
                                                ).then((apiRes) => {
                                                    localData.set(
                                                        'impersonator',
                                                        localData.get('user')
                                                    );

                                                    authService.signOut();
                                                    authService
                                                        .getUser(
                                                            apiRes?.data?.token
                                                        )
                                                        .then(
                                                            (_) =>
                                                                (window.location.href =
                                                                    '/')
                                                        );

                                                    addNotification({
                                                        type: 'success',
                                                        title: 'Impersonating',
                                                        text: `You are now impersonating ${item?.email}.`,
                                                    });
                                                })
                                            }
                                            className="h-6 w-6 text-primaryBlue group-hover:text-gray-700 dark:group-hover:text-white grow-0"
                                            aria-hidden="true"
                                            title="Impersonate"
                                        />
                                    </div>
                                </div>
                            ),
                        ],
                        pageLength: 10,
                    }}
                />
            )}

            <NoteTagsModal
                show={showNoteTagsModal}
                setShow={setShowNoteTagsModal}
                user={userToEdit}
                setUpdate={setUpdate}
                tags={availableTags}
            />

            <DeleteAccountModal
                show={showDeleteModal}
                onClose={setShowDeleteModal}
            >
                <DeleteUser
                    handleClose={handelCloseDeleteModal}
                    user={userToDelete}
                    setUpdate={() => setUpdate((prev) => prev + 1)}
                />
            </DeleteAccountModal>

            <RegisterModal
                {...{ show: showRegister, setShow: setShowRegister }}
            />

            <PasswordActionsModal
                {...{
                    show: showPasswordActions,
                    setShow: setShowPasswordActions,
                }}
            />
        </>
    );
};

export default ManageUsers;
