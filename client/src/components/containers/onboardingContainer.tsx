import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import * as localData from '../../services/localData';
import * as authentication from '../../services/authentication';

export default function OnboardingContainer({
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

        if (
            router.pathname.startsWith('/authentication') ||
            router.pathname.startsWith(`/app/profiles`) ||
            router.pathname.startsWith(`/app/listings`) ||
            router.pathname.startsWith(`/terms-of-use`) ||
            router.pathname.startsWith(`/privacy-policy`) ||
            router.pathname.startsWith(`/payment-confirmation`) ||
            router.pathname.startsWith(`/r/`)
        ) {
            setPass(true);
            return;
        }

        const user = localData.get('user');

        if (user?.id) {
            if (
                user?.talentData?.onboardingComplete ||
                user?.clientData?.onboardingComplete ||
                user?.accountType === 'administrator'
            ) {
                if (router.pathname.startsWith('/onboarding')) safePush('/');
                else setPass(true);
            } else {
                if (!router.pathname.startsWith('/onboarding'))
                    safePush(`/onboarding/${user.accountType}/profile`);
                else setPass(true);
            }
        } else setPass(true);
    }, [router.isReady, router.pathname]);

    return pass ? <>{children}</> : <></>;
}
