import { CheckIcon, CogIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';

const PaymentConfirmation: NextPage = () => {
    const [isLoading, setLoading] = useState(true);
    const [success, setSuccess] = useState(true);

    const router = useRouter();

    let didInit = false;

    useEffect(() => {
        if (didInit || !router.isReady) return;
        didInit = true;

        apiRequest('POST', '/payments/verify', router.query).then(
            (res): void => {
                if (res.status === 200) {
                    setSuccess(true);
                    setTimeout(() => router.push(res?.data?.url), 1000);
                } else {
                    setSuccess(false);
                }

                setLoading(false);
            }
        );
    }, [router.isReady, router.query]);

    return (
        <div className="w-full h-full flex items-center justify-center">
            {isLoading ? (
                <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center">
                        <CogIcon
                            className="h-6 w-6 text-primary"
                            aria-hidden="true"
                        />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                            Verifying payment...
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                This could take up to a few seconds.
                            </p>
                        </div>
                    </div>
                </div>
            ) : success ? (
                <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center">
                        <CheckIcon
                            className="h-6 w-6 text-primary"
                            aria-hidden="true"
                        />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                            Payment verified
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                Redirecting you in a few moments...
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center">
                        <XMarkIcon
                            className="h-6 w-6 text-primary"
                            aria-hidden="true"
                        />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">
                            Payment could not be verified
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                Please contact support if you have been charged
                                for this payment.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentConfirmation;
