import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import apiRequest from 'services/apiRequest';

const Referral: NextPage = () => {
    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;

        (async () => {
            const { code } = router.query;

            const clickReq = await apiRequest(
                'GET',
                `/affiliate/clicks/${code}`
            );

            router.push(
                '/authentication/sign-up' +
                    (clickReq.status === 200 ? `?r=${code}` : '')
            );
        })();
    }, [router.isReady]);

    return <></>;
};

export default Referral;
