import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import apiRequest from 'services/apiRequest';
import * as localData from 'services/localData';

const AppIndex: NextPage = () => {
    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;

        (async () => {
            let user: any;

            try {
                if (localData.get('impersonator')?.id)
                    throw new Error(
                        'Push notifications are not supported while impersonating another user.'
                    );

                if (!('serviceWorker' in navigator))
                    throw new Error(
                        'Service workers are not supported in your browser.'
                    );
                if (!('PushManager' in window))
                    throw new Error(
                        'Push API is not supported in your browser.'
                    );

                user = localData.get('user');
                if (!user?.id) throw new Error('User is not logged in.');

                const registration = await navigator.serviceWorker.register(
                    '/serviceWorker.js',
                    { scope: '/' }
                );

                await navigator.serviceWorker.ready;

                const subscription = await registration.pushManager.subscribe({
                    applicationServerKey:
                        'BFgkMvGGhxYq-Nb4wfY_pwYZOoDebVEb_1CSUEZnmeTo3zsRWCZ9LAyaSv5f46PkQmwvTEoPgSEFA__f1kyhdno',
                    userVisibleOnly: true,
                });

                const unsafeSubscription = JSON.parse(
                    JSON.stringify(subscription)
                );

                if (!unsafeSubscription.endpoint || !unsafeSubscription.keys)
                    throw new Error('Subscription failed.');

                const vapidReq = await apiRequest('POST', '/vapid', {
                    userId: user.id,
                    endpoint: unsafeSubscription.endpoint,
                    keys: unsafeSubscription.keys,
                });

                if (!vapidReq.status.toString().startsWith('2'))
                    throw new Error('Could not register subscription.');

                const permission =
                    await window.Notification.requestPermission();
                if (permission !== 'granted')
                    throw new Error(
                        'Notification permission has been denied or dismissed.'
                    );
            } catch (err) {
                console.error(err);
            }

            setTimeout(() => {
                router.push(
                    `/app/${
                        user?.accountType || localData.get('user.accountType')
                    }`
                );
            }, 500);
        })();
    }, [router.isReady]);

    return <></>;
};

export default AppIndex;
