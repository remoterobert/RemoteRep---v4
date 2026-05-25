import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import * as localData from 'services/localData';

const Profile: NextPage = () => {
    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;

        const localUser = localData.get('user');

        router.push(localUser?.id ? `/app/profiles/${localUser.id}` : '/app');
    }, [router.isReady]);

    return <></>;
};

export default Profile;
