import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const Index: NextPage = () => {
    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;
        else
            setTimeout(() => {
                router.push('/app');
            }, 500);
    }, [router.isReady]);

    return <></>;
};

export default Index;
