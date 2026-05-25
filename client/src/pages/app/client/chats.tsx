import type { NextPage } from 'next';
import ChatsLayout from 'components/chats/layout';
import { CreateFirstListingModal } from 'components/commons/createFirstListingModal';
import { useState, useEffect } from 'react';
import apiRequest from 'services/apiRequest';

const ClientChats: NextPage = () => {
    const [hasAccess, setHasAccess] = useState(true);

    useEffect(() => {
        apiRequest('GET', '/client/access').then((apiRes) =>
            setHasAccess(apiRes.status === 200)
        );
    }, []);

    return (
        <>
            <ChatsLayout />

            <CreateFirstListingModal
                {...{ show: !hasAccess, setShow: setHasAccess }}
            />
        </>
    );
};

export default ClientChats;
