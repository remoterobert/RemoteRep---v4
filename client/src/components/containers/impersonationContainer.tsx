import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import * as localData from '../../services/localData';
import { LifebuoyIcon } from '@heroicons/react/24/outline';
import * as authService from 'services/authentication';

export default function ImpersonationContainer({
    children,
}: {
    children: React.ReactNode;
}) {
    const [pass, setPass] = useState(true);
    const [firstPassed, setFirstPassed] = useState(false);
    const [impersonator, setImpersonator] = useState<any>({});

    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;

        if (!firstPassed) {
            setPass(false);
            setFirstPassed(true);
        }

        const localImpersonator = localData.get('impersonator');

        if (localImpersonator?.id) setImpersonator(localImpersonator);

        setPass(true);
    }, [router.isReady, router.pathname]);

    return pass ? (
        <>
            {impersonator?.id && (
                <div className="sticky top-0 z-50 inline-flex h-16 w-full bg-gray-900">
                    <div className="flex w-16 flex-shrink-0 items-center px-4">
                        <LifebuoyIcon
                            className="h-8 w-8 w-auto text-white"
                            aria-hidden="true"
                        />
                    </div>
                    <div
                        className="flex inline-flex my-auto text-left text-white"
                        onClick={() => {
                            localData.set('impersonator', null);

                            authService.signOut();
                            authService
                                .getUser(impersonator.token)
                                .then(
                                    (_) =>
                                        (window.location.href =
                                            '/app/administrator/manage-users')
                                );
                        }}
                    >
                        <span className="my-auto font-medium">
                            You are impersonating{' '}
                            <span className="text-secondary">
                                {localData.get('user.email')}
                            </span>
                            . Click <span className="text-secondary">here</span>{' '}
                            to return to your account.
                        </span>
                    </div>
                </div>
            )}

            {children}
        </>
    ) : (
        <></>
    );
}
