import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import FormBuilder from '../../../components/forms/formBuilder';
import { useForm } from 'react-hook-form';
import apiRequest from '../../../services/apiRequest';
import * as localData from '../../../services/localData';
import countries from '../../../services/countries';
import { PageHeader } from 'components/commons/pageHeader';
import { useNotification } from 'contexts/NotificationContext';

export default function Example() {
    const emailForm = useForm();
    const passwordForm = useForm();
    const contactForm = useForm();

    const { addNotification } = useNotification();

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
                            Change your email address.
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
                            Edit your contact information.
                        </p>
                    </div>

                    <FormBuilder
                        {...{
                            formHook: contactForm,
                            formName: 'editContact',
                            submitText: 'Save',
                            getFunc: async () => {
                                return {
                                    firstName: localData.get(
                                        'user.contact.firstName'
                                    ),
                                    lastName: localData.get(
                                        'user.contact.lastName'
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
                                            text: 'Other administrators can view your up-to-date details.',
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
        </>
    );
}
