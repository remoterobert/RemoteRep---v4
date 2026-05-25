import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import FormBuilder from '../../../components/forms/formBuilder';
import { useForm } from 'react-hook-form';
import apiRequest from '../../../services/apiRequest';
import * as localData from '../../../services/localData';
import countries from '../../../services/countries';
import { PageHeader } from 'components/commons/pageHeader';
import { useNotification } from 'contexts/NotificationContext';
import { Fragment, useEffect, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

export default function Example() {
    const [visibility, setVisibility] = useState(true);

    const emailForm = useForm();
    const passwordForm = useForm();
    const contactForm = useForm();

    const { addNotification } = useNotification();

    const [subscription, setSubscription] = useState<any>();

    useEffect(() => {
        apiRequest('GET', '/client/visibility').then((res) => {
            if (res.status === 200) setVisibility(res.data!.visibility);
        });
    }, []);

    useEffect(() => {
        (async () => {
            const subscriptionRequest = await apiRequest(
                'GET',
                '/client/subscription'
            );

            if (subscriptionRequest.status === 200)
                setSubscription(subscriptionRequest.data as any);
        })();
    }, []);

    return (
        <>
            {/* Common header */}
            <PageHeader {...{ title: 'Settings', icon: Cog6ToothIcon }} />

            {/* Page-specific content */}
            <div className="py-12">
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-2 md:px-72 text-black dark:text-white">
                    <div>
                        <h2 className="text-base font-semibold leading-7">
                            Email address
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                            Change your email address. Your email address won't
                            be shared with anyone you haven't connected with.
                        </p>
                    </div>

                    <FormBuilder
                        {...{
                            formHook: emailForm,
                            formName: 'changeEmail',
                            submitText: 'Save',
                            getFunc: async () => {
                                return {
                                    email: localData.get('user.email'),
                                };
                            },
                            postFunc: async (data) => {
                                try {
                                    const updateReq = await apiRequest(
                                        'POST',
                                        '/auth/change-email-request',
                                        data
                                    );

                                    if (updateReq.status === 200) {
                                        addNotification({
                                            type: 'success',
                                            title: 'Email address updated successfully',
                                            text: 'Please verify your new email address.',
                                        });
                                        return true;
                                    } else {
                                        addNotification({
                                            type: 'error',
                                            title: 'Error updating email address',
                                            text: 'Please try again later...',
                                        });
                                        return false;
                                    }
                                } catch {
                                    return false;
                                }
                            },
                        }}
                    />
                </div>
            </div>

            <div className="py-12">
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-2 md:px-72 text-black dark:text-white">
                    <div>
                        <h2 className="text-base font-semibold leading-7">
                            Password
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                            Change your password.
                        </p>
                    </div>

                    <FormBuilder
                        {...{
                            formHook: passwordForm,
                            formName: 'changePassword',
                            submitText: 'Save',
                            postFunc: async (data) => {
                                try {
                                    const updateReq = await apiRequest(
                                        'POST',
                                        '/auth/change-password',
                                        data
                                    );

                                    if (updateReq.status === 200) {
                                        addNotification({
                                            type: 'success',
                                            title: 'Password updated successfully',
                                            text: 'You may use it the next time you sign in.',
                                        });
                                        return true;
                                    } else {
                                        addNotification({
                                            type: 'error',
                                            title: 'Error updating password',
                                            text: 'Please try again later...',
                                        });
                                        return false;
                                    }
                                } catch {
                                    return false;
                                }
                            },
                        }}
                    />
                </div>
            </div>

            <div className="py-12">
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-2 md:px-72 text-black dark:text-white">
                    <div>
                        <h2 className="text-base font-semibold leading-7">
                            Contact information
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                            Edit your contact information. Your phone number
                            won't be shared with anyone you haven't connected
                            with.
                        </p>
                    </div>

                    <FormBuilder
                        {...{
                            formHook: contactForm,
                            formName: 'editContactClient',
                            submitText: 'Save',
                            getFunc: async () => {
                                return {
                                    firstName: localData.get(
                                        'user.contact.firstName'
                                    ),
                                    lastName: localData.get(
                                        'user.contact.lastName'
                                    ),
                                    companyName: localData.get(
                                        'user.contact.companyName'
                                    ),
                                    city: localData.get(
                                        'user.contact.addressCity'
                                    ),
                                    state: localData.get(
                                        'user.contact.addressState'
                                    ),
                                    country: localData.get(
                                        'user.contact.addressCountry'
                                    ),
                                    zip: localData.get(
                                        'user.contact.addressZip'
                                    ),
                                    phone: localData
                                        .get('user.phone')
                                        .split(
                                            countries.find(
                                                (c) =>
                                                    c.code ===
                                                    localData.get(
                                                        'user.contact.addressCountry'
                                                    )
                                            )?.dial_code
                                        )[1],
                                };
                            },
                            postFunc: async (data) => {
                                try {
                                    const updateReq = await apiRequest(
                                        'POST',
                                        '/auth/edit-contact',
                                        data
                                    );

                                    if (updateReq.status === 200) {
                                        addNotification({
                                            type: 'success',
                                            title: 'Contact information updated successfully',
                                            text: 'Talent you are interviewing can view your up-to-date details.',
                                        });
                                        return true;
                                    } else {
                                        addNotification({
                                            type: 'error',
                                            title: 'Error updating contact information',
                                            text: 'Please try again later...',
                                        });
                                        return false;
                                    }
                                } catch {
                                    return false;
                                }
                            },
                        }}
                    />
                </div>
            </div>

            <div className="py-12">
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-2 md:px-72 text-black dark:text-white">
                    <div>
                        <h2 className="text-base font-semibold leading-7">
                            Profile visibility
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                            Manage your profile visibility. Selecting 'Hidden'
                            will hide your profile in discovery features.
                        </p>
                    </div>

                    <div className="flex justify-center sm:justify-end">
                        <Listbox
                            value={visibility}
                            onChange={async (data) => {
                                const updateReq = await apiRequest(
                                    'PATCH',
                                    '/client/visibility',
                                    {
                                        visibility: data,
                                    }
                                );

                                if (updateReq.status === 200) {
                                    setVisibility(data);

                                    addNotification({
                                        type: 'success',
                                        title: 'Visibility updated successfully',
                                        text: 'Hiring managers can view your up-to-date details.',
                                    });
                                } else {
                                    addNotification({
                                        type: 'error',
                                        title: 'Error updating visibility information',
                                        text: 'Please try again later...',
                                    });
                                }
                            }}
                        >
                            <div className="my-auto w-72 relative">
                                <Listbox.Button className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-lightForeground text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                                    <span className="max-w-[100%] overflow-y-hidden text-ellipsis block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 dark:text-white shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                        {visibility ? 'Visible' : 'Hidden'}
                                    </span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                        <ChevronUpDownIcon
                                            className="h-5 w-5 text-gray-400"
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
                                    <Listbox.Options className="z-10 absolute mt-1 max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-lightForeground py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                        {[
                                            { value: true, display: 'Visible' },
                                            { value: false, display: 'Hidden' },
                                        ].map((option, i) => (
                                            <Listbox.Option
                                                key={i}
                                                value={option.value}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                        active
                                                            ? 'bg-primary text-white'
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
                    </div>
                </div>
            </div>

            <div className="py-12">
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-2 md:px-72 text-black dark:text-white">
                    <div>
                        <h2 className="text-base font-semibold leading-7">
                            Subscriptions
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                            Manage your subscriptions.
                        </p>
                    </div>

                    <div>
                        {subscription ? (
                            subscription.isActive ? (
                                <>
                                    Your subscription will renew on{' '}
                                    <b>
                                        {new Date(
                                            subscription.dateExpires
                                        ).toLocaleDateString()}
                                    </b>{' '}
                                    for <b>${subscription.amount}</b> per year.
                                    <div className="mt-6">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                apiRequest(
                                                    'DELETE',
                                                    '/client/subscription'
                                                ).then(() =>
                                                    window.location.reload()
                                                );
                                            }}
                                            className="inline-flex w-full min-w-max h-12 items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 hover:filter hover:brightness-[95%] sm:col-start-1 sm:mt-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    Your subscription has been canceled. You
                                    will lose access on{' '}
                                    <b>
                                        {new Date(
                                            subscription.dateExpires
                                        ).toLocaleDateString()}
                                    </b>
                                    .
                                    <div className="mt-6">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                apiRequest(
                                                    'PATCH',
                                                    '/client/subscription'
                                                ).then(() =>
                                                    window.location.reload()
                                                );
                                            }}
                                            className="inline-flex w-full min-w-max h-12 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 hover:filter hover:brightness-[95%] sm:col-start-1 sm:mt-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                        >
                                            Resume
                                        </button>
                                    </div>
                                </>
                            )
                        ) : (
                            <p className="mt-1 text-sm leading-6 text-gray-600">
                                You don't have any active subscriptions.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
