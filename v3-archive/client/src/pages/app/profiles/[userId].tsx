import ClientProfile from 'components/profiles/client';
import TalentProfile from 'components/profiles/talent';
import type {
    GetServerSideProps,
    NextPage,
    // Metadata,
    // ResolvingMetadata,
} from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';
import serverRequest from 'services/serverRequest';

export const getServerSideProps: GetServerSideProps<{
    ssUser: any;
}> = async (context) => {
    const profileReq = await serverRequest(
        'GET',
        `/profiles/${context.query.userId}`
    );

    let ssUser: any = null;

    if (profileReq.status === 200) ssUser = profileReq.data;
    return { props: { ssUser } };
};

// export const generateMetadata = ({ ssUser }: { ssUser: any }): Metadata => {
//     return ssUser.accountType === 'talent'
//         ? {
//               title: `${ssUser?.contact?.firstName} ${ssUser?.contact?.lastName} | RemoteRep.com`,
//               openGraph: {
//                   title: `${ssUser?.contact?.firstName} ${ssUser?.contact?.lastName} | RemoteRep.com`,
//                   description: `Explore ${ssUser?.contact?.firstName}'s profile and discover similar talent on RemoteRep.com.`,
//                   images: [ssUser?.talentData?.profile?.photoUrl],
//               },
//           }
//         : {
//               title: `${ssUser?.contact?.companyName} | RemoteRep.com`,
//               openGraph: {
//                   title: `${ssUser?.contact?.companyName} | RemoteRep.com`,
//                   description: `Explore ${ssUser?.contact?.companyName}'s profile and discover similar clients on RemoteRep.com.`,
//                   images: [ssUser?.clientData?.profile?.photoUrl],
//               },
//           };
// };

const Profile: NextPage<{ ssUser: any }> = ({ ssUser }) => {
    const router = useRouter();

    const [user, setUser] = useState<any>(ssUser);
    const [updateUser, setUpdateUser] = useState(0);

    useEffect(() => {
        if (!router.isReady) return;

        (async () => {
            const profileReq = await apiRequest(
                'GET',
                `/profiles/${router.query.userId}`
            );

            if (profileReq.status === 200) setUser(profileReq.data);
        })();
    }, [router.isReady, router.query, updateUser]);

    return (
        <>
            {user &&
                (user.accountType === 'talent' ? (
                    <TalentProfile {...{ user, updateUser, setUpdateUser }} />
                ) : user.accountType === 'client' ? (
                    <ClientProfile {...{ user, updateUser, setUpdateUser }} />
                ) : null)}
        </>
    );
};

export default Profile;
