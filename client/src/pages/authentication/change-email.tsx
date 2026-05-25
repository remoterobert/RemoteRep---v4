import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import FormBuilder from '../../components/forms/formBuilder';
import { useForm } from 'react-hook-form';
import apiRequest from '../../services/apiRequest';
import * as authentication from '../../services/authentication';
import { useEffect, useState } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

const ChangeEmail: NextPage = () => {
    const [emailChanged, setEmailChanged] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;
        const query = router.query;

        if (query.code && query.id && query.email) {
            apiRequest('POST', '/auth/change-email', { ...query })
                .then((res) => {
                    if (res.status === 200) setEmailChanged(true);
                    setTimeout(() => router.push('/app'), 1000);
                })
                .catch((_) => {
                    return;
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
                            Change email address
                        </span>

                        <div className="mt-8 text-center">
                            <EnvelopeIcon
                                className="mx-auto h-12 w-12 text-primary"
                                aria-hidden="true"
                            />
                            <p className="mt-4 text-center text-md font-medium text-gray-900">
                                {emailChanged ? (
                                    'Changing your email address...'
                                ) : (
                                    <>
                                        Email address changed.
                                        <br />
                                        Redirecting you to the app...
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChangeEmail;
