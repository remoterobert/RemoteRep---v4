import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import * as localData from '../../services/localData';
import * as authentication from '../../services/authentication';

export default function AuthContainer({
    children,
}: {
    children: React.ReactNode;
}) {
    const [pass, setPass] = useState(true);
    const [firstPassed, setFirstPassed] = useState(false);

    const router = useRouter();

    const safePush = (target: string) => {
        if (router.pathname !== target) router.push(target);
        else setPass(true);
    };

    useEffect(() => {
        if (!router.isReady) return;

        if (!firstPassed) {
            setPass(false);
            setFirstPassed(true);
        }

        (async () => {
            if (router.pathname === '/authentication/sign-out') {
                authentication.signOut();
                safePush('/authentication/sign-in');
            } else if (
                router.pathname.startsWith(`/app/profiles`) ||
                router.pathname.startsWith(`/app/listings`) ||
                router.pathname.startsWith(`/terms-of-use`) ||
                router.pathname.startsWith(`/privacy-policy`) ||
                router.pathname.startsWith(`/payment-confirmation`) ||
                router.pathname.startsWith(`/r/`)
            ) {
                setPass(true);
            } else {
                await authentication.getUser();
                if (localData.get('user.id')) {
                    if (localData.get('user.authority') < 100)
                        safePush('/authentication/suspended');
                    else if (router.pathname === '/authentication/suspended')
                        safePush('/');
                    else if (localData.get('user.authority') < 101)
                        safePush('/authentication/email');
                    else if (router.pathname === '/authentication/email')
                        safePush('/');
                    else if (router.pathname.startsWith('/authentication'))
                        safePush('/');
                    else setPass(true);
                } else {
                    if (!router.pathname.startsWith('/authentication'))
                        safePush('/authentication/sign-in');
                    else setPass(true);
                }
            }
        })();
    }, [router.isReady, router.pathname]);

    return pass ? <>{children}</> : <></>;
}
