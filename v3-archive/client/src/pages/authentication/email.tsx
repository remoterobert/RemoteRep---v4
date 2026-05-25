import type { NextPage } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import apiRequest from '../../services/apiRequest';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import * as authentication from 'services/authentication';

const Email: NextPage = () => {
    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;
        (async () => {
            const query = router.query;

            if (query.code && query.id) {
                const verifyRequest = await apiRequest(
                    'POST',
                    '/auth/verify-email',
                    {
                        code: query.code,
                        id: query.id,
                    }
                );

                if (verifyRequest.status === 200) {
                    authentication
                        .getUser(verifyRequest?.data?.token)
                        .then(() =>
                            setTimeout(() => window.location.reload(), 1000)
                        );
                }
            }
        })();
    }, [router.isReady, router.query]);

    return (
        <>
            <div className="shadow-lg w-full h-16 py-4 px-8 bg-lightForeground">
                <img
                    className="absolute w-auto h-8"
                    src="/white-logo-with-text.svg"
                />
            </div>
            <div className='grid sm:grid-cols-2 lg:grid-cols-12 gap-0'>
                <div className='bg-background dark:bg-darkBackground lg:col-span-7 sm:col-span-1 border-none sm:h-full lg:h-screen'>
                    <img
                        className="h-full w-full object-cover"
                        src="/sign-in-background.jpg"
                    />
                </div>

                <div className="flex items-center justify-center h-full w-full lg:col-span-5 sm:col-span-1">
                    <div className="flex flex-col items-center justify-center sm:h-full lg:min-h-screen bg-white dark:bg-darkBackground">
                        <div className="px-8 py-8 rounded-lg shadow-lg w-full min-h-[380px] max-w-sm bg-white dark:bg-darkForeground flex flex-col items-center">
                            <span className="text-xl font-medium text-gray-900">
                                Let's make sure it's you.
                            </span>

                            <div className="mt-8 text-center">
                                <EnvelopeIcon
                                    className="mx-auto h-12 w-12 text-primary"
                                    aria-hidden="true"
                                />
                                <p className="mt-4 text-center text-md font-medium text-gray-900">
                                    Please verify your email address to proceed. You
                                    should have a verification email in your inbox
                                    (or your spam folder).
                                </p>
                                <p className="mt-4 text-center text-sm text-gray-400">
                                    If you are having trouble verifying your email,
                                    please sign out and sign back in.
                                </p>
                            </div>

                            <div className="mt-6">
                                <span
                                    onClick={() =>
                                        router.push('/authentication/sign-out')
                                    }
                                    className="inline-flex w-full h-12 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 hover:filter hover:brightness-[95%] sm:col-start-1 sm:mt-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                >
                                    Sign out
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Email;
