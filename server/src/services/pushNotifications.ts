import webpush from 'web-push';
import pushNotificationLanguage from '../utilities/pushNotificationLanguage';
import replaceLanguage from '../utilities/replaceLanguage';

webpush.setVapidDetails(
    'https://app.remoterep.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

const sendNotifications = async (
    vapids: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    }[],
    language?: keyof typeof pushNotificationLanguage,
    raw?: { title: string; text: string },
    replace?: { [k: string]: string }
) => {
    vapids.forEach((v) =>
        webpush
            .sendNotification(
                v,
                JSON.stringify(
                    replaceLanguage(
                        language ? pushNotificationLanguage[language] : raw,
                        replace
                    ) as (typeof pushNotificationLanguage)[typeof language]
                )
            )
            .catch((err) => console.log(err))
    );
};

export { sendNotifications };
