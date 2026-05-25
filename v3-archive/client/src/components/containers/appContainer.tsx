import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import * as localData from '../../services/localData';

export default function AppContainer({
    children,
}: {
    children: React.ReactNode;
}) {
    const [pass, setPass] = useState(true);
    const [firstPassed, setFirstPassed] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;

        if (!firstPassed) {
            setPass(false);
            setFirstPassed(true);
        }

        if (
            router.pathname.startsWith('/authentication') ||
            router.pathname.startsWith('/onboarding') ||
            router.pathname.startsWith(`/terms-of-use`) ||
            router.pathname.startsWith(`/privacy-policy`) ||
            router.pathname.startsWith(`/payment-confirmation`) ||
            router.pathname.startsWith(`/r/`)
        ) {
            setPass(true);
            return;
        }

        const accountType = localData.get('user.accountType');

        if (!accountType) {
            setPass(true);
            return;
        }

        if (
            !router.pathname.startsWith(`/app/profiles`) &&
            !router.pathname.startsWith(`/app/listings`) &&
            !router.pathname.startsWith(`/app/${accountType}`)
        )
            router.push(`/app/${accountType}`);
        else setPass(true);
    }, [router.isReady, router.pathname]);

    return pass ? <>{children}</> : <></>;
}
