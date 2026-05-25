import type { NextPage } from 'next';
import { useNotification } from 'contexts/NotificationContext';
import { useEffect } from 'react';
import apiRequest from 'services/apiRequest';
import * as localData from 'services/localData';

const SignOut: NextPage = () => {
    const { addNotification } = useNotification();

    useEffect(() => {
        (async () => {
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

                const registration = await navigator.serviceWorker.register(
                    '/serviceWorker.js',
                    { scope: '/' }
                );

                await navigator.serviceWorker.ready;

                const subscription =
                    await registration.pushManager.getSubscription();

                if (!subscription) throw new Error('Subscription not found.');

                await subscription.unsubscribe();

                await apiRequest('POST', '/vapid', {
                    userId: localData.get('user.id'),
                    endpoint: subscription.endpoint,
                });
            } catch (err) {
                console.error(err);
            }
        })();

        addNotification({
            type: 'success',
            title: 'Signed out successfully',
            text: 'Redirecting you to the sign-in page...',
        });
    }, []);

    return <></>;
};

export default SignOut;
