import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import FormBuilder from '../../components/forms/formBuilder';
import { useForm } from 'react-hook-form';
import apiRequest from '../../services/apiRequest';
import { useEffect, useState } from 'react';
import { useNotification } from 'contexts/NotificationContext';

const SignIn: NextPage = () => {
    const [queryData, setQueryData] = useState<{ id?: string; code?: string }>(
        {}
    );
    const emailForm = useForm();
    const resetForm = useForm();
    const router = useRouter();
    const { addNotification } = useNotification();

    useEffect(() => {
        if (!router.isReady) return;
        const query = router.query;

        if (query.code && query.id) {
            setQueryData({
                id: query.id as string,
                code: query.code as string,
            });
        }
    }, [router.isReady, router.query]);

    return (
        <>
            <div className="shadow-lg w-full h-16 py-4 px-8">
                <img
                    className="absolute w-auto h-8"
                    src="/white-logo-with-text.svg"
                />
            </div>

            <img
                className="absolute inset-0 h-full w-full object-cover filter blur-xs -z-10"
                src="/sign-up-background.jpg"
            />

            <div className="flex items-center justify-center h-full max-h-[90vh] w-full md:w-[50vw] overflow-clip">
                <div className="absolute bg-white shadow-xl rounded-xl w-[80vw] md:w-[20vw]">
                    <div className="px-4 py-5 sm:px-6">
                        <span className="text-xl font-medium text-gray-900">
                            {queryData?.id && queryData?.code
                                ? "Let's get you back into your account."
                                : "Let's make sure it's you."}
                        </span>

                        <div className="mt-4">
                            {queryData?.id && queryData?.code ? (
                                <FormBuilder
                                    {...{
                                        formHook: resetForm,
                                        formName: 'resetPassword',
                                        submitText: 'Reset password',
                                        postFunc: async (data) => {
                                            try {
                                                const resetRequest =
                                                    await apiRequest(
                                                        'POST',
                                                        '/auth/reset-password',
                                                        {
                                                            ...data,
                                                            ...queryData,
                                                        }
                                                    );

                                                if (
                                                    resetRequest.status === 200
                                                ) {
                                                    setTimeout(
                                                        () =>
                                                            router.push(
                                                                'sign-in'
                                                            ),
                                                        1000
                                                    );

                                                    addNotification({
                                                        type: 'success',
                                                        title: 'Password reset successfully',
                                                        text: 'Redirecting you to the sign-in page...',
                                                    });

                                                    return true;
                                                } else {
                                                    addNotification({
                                                        type: 'error',
                                                        title: 'Error resetting password',
                                                        text:
                                                            resetRequest?.error ||
                                                            'An unknown server error has occurred. Please try again in a few minutes.',
                                                    });

                                                    return false;
                                                }
                                            } catch {
                                                addNotification({
                                                    type: 'error',
                                                    title: 'Error resetting password',
                                                    text: 'An unknown server error has occurred. Please try again in a few minutes.',
                                                });

                                                return false;
                                            }
                                        },
                                    }}
                                />
                            ) : (
                                <FormBuilder
                                    {...{
                                        formHook: emailForm,
                                        formName: 'forgotPassword',
                                        submitText: 'Send password reset link',
                                        postFunc: async (data) => {
                                            try {
                                                const sendRequest =
                                                    await apiRequest(
                                                        'POST',
                                                        '/auth/forgot-password',
                                                        {
                                                            ...data,
                                                        }
                                                    );

                                                if (
                                                    sendRequest.status === 200
                                                ) {
                                                    addNotification({
                                                        type: 'success',
                                                        title: 'Password-reset email sent successfully',
                                                        text: 'Please follow the link in your email address to reset your password.',
                                                    });

                                                    return true;
                                                } else {
                                                    addNotification({
                                                        type: 'error',
                                                        title: 'Error sending password-reset email',
                                                        text:
                                                            sendRequest?.error ||
                                                            'An unknown server error has occurred. Please try again in a few minutes.',
                                                    });

                                                    return false;
                                                }
                                            } catch {
                                                addNotification({
                                                    type: 'error',
                                                    title: 'Error sending password-reset email',
                                                    text: 'An unknown server error has occurred. Please try again in a few minutes.',
                                                });

                                                return false;
                                            }
                                        },
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignIn;
