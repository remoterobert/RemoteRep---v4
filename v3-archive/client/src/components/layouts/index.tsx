import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import TalentLayout from './talent';
import ClientLayout from './client';
import AdministratorLayout from './administrator';
import GuestLayout from './guest';

import * as localData from 'services/localData';

export default function Layout({ children }: { children: React.ReactNode }) {
    const [layout, setLayout] = useState('');

    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;
        if (!router.pathname.startsWith('/app')) setLayout('');

        const accountType = localData.get('user.accountType');

        // if (router.pathname.startsWith('/app/talent')) setLayout('talent');
        // else if (router.pathname.startsWith('/app/client')) setLayout('client');
        // else if (router.pathname.startsWith('/app/administrator'))
        //     setLayout('administrator');

        if (router.pathname.startsWith('/app')) {
            if (accountType === 'talent') setLayout('talent');
            else if (accountType === 'client') setLayout('client');
            else if (accountType === 'administrator')
                setLayout('administrator');
            else setLayout('guest');
        }
    }, [router.isReady, router.pathname]);

    return (
        <>
            {!layout && <>{children}</>}
            {layout === 'talent' && <TalentLayout>{children}</TalentLayout>}
            {layout === 'client' && <ClientLayout>{children}</ClientLayout>}
            {layout === 'administrator' && (
                <AdministratorLayout>{children}</AdministratorLayout>
            )}
            {layout === 'guest' && <GuestLayout>{children}</GuestLayout>}
        </>
    );
}
