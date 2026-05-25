import DynamicListing from 'components/listings/dynamicListing';
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
    ssListing: any;
}> = async (context) => {
    const listingReq = await serverRequest(
        'GET',
        `/listings/${context.query.listingId}`
    );

    let ssListing: any = null;

    if (listingReq.status === 200) ssListing = listingReq.data;
    return { props: { ssListing } };
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

const Listing: NextPage<{ ssListing: any }> = ({ ssListing }) => {
    const router = useRouter();

    const [listing, setListing] = useState<any>(ssListing);
    const [updateListing, setUpdateListing] = useState(0);

    useEffect(() => {
        if (!router.isReady) return;

        (async () => {
            const listingReq = await apiRequest(
                'GET',
                `/listings/${router.query.listingId}`
            );

            if (listingReq.status === 200) setListing(listingReq.data);
        })();
    }, [router.isReady, router.query, updateListing]);

    return (
        <>
            {listing && (
                <DynamicListing
                    {...{ listing, updateListing, setUpdateListing }}
                />
            )}
        </>
    );
};

export default Listing;
