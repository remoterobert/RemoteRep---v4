import type { NextPage } from 'next';
import {
    ClipboardDocumentListIcon,
    ClockIcon,
    UserGroupIcon,
    PencilSquareIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from 'components/commons/pageHeader';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { MapPinIcon } from '@heroicons/react/20/solid';
import * as localData from 'services/localData';
import apiRequest from 'services/apiRequest';

const MyListings: NextPage = () => {
    const [user, setUser] = useState<any>({});
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    useEffect(() => {
        (async () => {
            setUser(localData.get('user'));

            const listingsReq = await apiRequest('GET', '/client/listings');

            if (listingsReq?.data?.listings.length)
                setListings(listingsReq.data.listings);

            setLoading(false);
        })();
    }, []);

    return (
        <>
            {/* Common header */}
            <PageHeader
                {...{ title: 'My listings', icon: ClipboardDocumentListIcon }}
            />

            {/* Page-specific content */}
            <div className="w-full p-16">
                <div className="h-[5vh] w-[80vw] mx-auto p-8 bg-gray-900 rounded-t-xl flex items-center justify-between gap-x-8">
                    <span className="text-white font-semibold whitespace-nowrap grow-0">
                        Listings ({listings.length})
                    </span>

                    <span
                        onClick={() =>
                            router.push('/app/client/create-listing')
                        }
                        className="py-1 px-4 bg-white rounded-lg text-gray-900 font-semibold border-2 border-solid border-gray-200 shadow-sm hover:shadow-md"
                    >
                        Create listing
                    </span>
                </div>
                <div className="grid h-[65vh] w-[80vw] mx-auto space-y-8 p-8 bg-gray-50 overflow-y-scroll scrollbar-thin rounded-xl">
                    {loading && (
                        <div className="flex items-center justify-center">
                            <ClockIcon className="h-8 w-8 text-gray-900" />
                        </div>
                    )}

                    {!loading &&
                        listings.map((l) => {
                            return (
                                <div
                                    key={l.id}
                                    className="bg-white shadow-xl rounded-xl w-full"
                                >
                                    <div className="flex justify-between px-4 py-4">
                                        <div className="inline-flex">
                                            <img
                                                src={
                                                    user?.clientData?.profile
                                                        ?.photoUrl
                                                }
                                                className="h-24 w-24 rounded-full"
                                            />

                                            <div className="ml-4 font-medium text-gray-900 flex items-center">
                                                <div>
                                                    <div>
                                                        <span className="text-2xl">
                                                            {l.title}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className="mt- text-lg whitespace-nowrap">
                                                            {user?.contact
                                                                ?.companyName ||
                                                                null}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className="text-sm inline-flex text-gray-700">
                                                            <MapPinIcon className="my-auto h-4 w-4 text-gray-700" />
                                                            {[
                                                                user?.contact
                                                                    ?.addressCity,
                                                                user?.contact
                                                                    ?.addressState,
                                                                user?.contact
                                                                    ?.addressCountry,
                                                            ].join(', ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="min-h-full flex justify-center items-center flex-wrap gap-2 px-4">
                                            <div className="group flex items-center justify-center rounded-full border-2 border-solid border-gray-200 p-2 shadow-sm hover:shadow-md">
                                                <UserPlusIcon
                                                    onClick={() =>
                                                        router.push(
                                                            `/app/client/browse-talent?listing=${l.id}`
                                                        )
                                                    }
                                                    className="h-6 w-6 text-gray-500 group-hover:text-gray-700"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            <div className="group flex items-center justify-center rounded-full border-2 border-solid border-gray-200 p-2 shadow-sm hover:shadow-md">
                                                <UserGroupIcon
                                                    onClick={() =>
                                                        router.push(
                                                            `/app/client/my-listings/applications?id=${l.id}`
                                                        )
                                                    }
                                                    className="h-6 w-6 text-gray-500 group-hover:text-gray-700"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            <div className="group flex items-center justify-center rounded-full border-2 border-solid border-gray-200 p-2 shadow-sm hover:shadow-md">
                                                <PencilSquareIcon
                                                    onClick={() =>
                                                        router.push(
                                                            `/app/listings/${l.id}`
                                                        )
                                                    }
                                                    className="h-6 w-6 text-gray-500 group-hover:text-gray-700"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </>
    );
};

export default MyListings;
