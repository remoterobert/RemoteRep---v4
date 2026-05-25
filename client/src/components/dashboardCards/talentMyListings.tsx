import { Listbox, Transition } from '@headlessui/react';
import {
    ArrowTopRightOnSquareIcon,
    CheckIcon,
    ChevronUpDownIcon,
    MapPinIcon,
} from '@heroicons/react/20/solid';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';
import * as localData from 'services/localData';

const TalentMyListings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [update, setUpdate] = useState(0);
    const [user, setUser] = useState<any>();
    const [listings, setListings] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [bookmarks, setBookmarks] = useState<string[]>([]);

    const router = useRouter();

    useEffect(() => {
        setUser(localData.get('user'));

        (async () => {
            const listingsReq = await apiRequest('GET', '/talent/listings');

            if (listingsReq?.data?.listings.length)
                setListings(listingsReq.data.listings);

            const applicationsReq = await apiRequest(
                'GET',
                '/talent/applications'
            );

            if (applicationsReq?.data?.applications.length)
                setApplications(applicationsReq.data.applications);

            if (localData.get('user.talentData.bookmarkedListings'))
                setBookmarks(
                    localData.get('user.talentData.bookmarkedListings')
                );

            setLoading(false);
        })();
    }, [update]);

    const ListingCard: React.FC<{ listing: any }> = ({ listing }) => {
        return (
            <div
                key={listing.id}
                className="bg-white shadow-xl rounded-xl w-full"
            >
                <div className="px-4 py-4">
                    <div className="inline-flex">
                        <img
                            src={listing?.client?.clientData?.profile?.photoUrl}
                            className="h-8 w-8 rounded-full my-auto grow-0"
                        />

                        <div className="ml-2 font-medium text-gray-900 flex items-center">
                            <div>
                                <span className="text-sm inline-flex">
                                    {listing?.title}
                                </span>
                                <span className="text-xs inline-flex">
                                    {listing?.client?.contact?.companyName}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="md:col-span-6 bg-white border border-gray-300 rounded-md shadow-md p-8">
            {loading && (
                <div className="flex items-center justify-center">
                    <ClockIcon className="h-8 w-8 text-gray-900" />
                </div>
            )}

            {!loading && (
                <>
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-medium text-gray-900">
                            My listings
                        </h3>
                    </div>

                    <div className="mt-8 grid grid-cols-6 gap-8">
                        <div className="border-2 border-gray-300 shadow-lg rounded-md h-[40vh] col-span-6 md:col-span-1">
                            <div className="p-4 border-b border-gray-300">
                                <h3 className="text-gray-900 font-medium text-md">
                                    Bookmarked (
                                    {
                                        listings.filter((l: any) =>
                                            bookmarks.includes(l.id)
                                        ).length
                                    }
                                    )
                                </h3>
                            </div>
                            <div className="grid overflow-y-auto scrollbar-thin p-4 h-[85%] bg-gray-50 gap-4">
                                {!listings.filter((l: any) =>
                                    bookmarks.includes(l.id)
                                ).length ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            No bookmarked listings found.
                                        </span>
                                        <span
                                            onClick={() =>
                                                router.push(
                                                    '/app/talent/browse-listings'
                                                )
                                            }
                                            className="selectedListing?.applications && selectedListing.applications.some(text-primary font-medium text-sm text-center inline-flex hover:cursor-pointer"
                                        >
                                            Browse listings{' '}
                                            <ArrowTopRightOnSquareIcon className="text-primary ml-2 my-auto h-4 w-4" />
                                        </span>
                                    </div>
                                ) : null}

                                {listings.filter((l: any) =>
                                    bookmarks.includes(l.id)
                                ).length ? (
                                    <>
                                        {listings
                                            .filter((l: any) =>
                                                bookmarks.includes(l.id)
                                            )
                                            .map((listing) => (
                                                <ListingCard {...{ listing }} />
                                            ))}
                                    </>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-2 border-gray-300 shadow-lg rounded-md h-[40vh] col-span-6 md:col-span-1">
                            <div className="p-4 border-b border-gray-300">
                                <h3 className="text-gray-900 font-medium text-md">
                                    Invited (
                                    {
                                        applications.filter(
                                            (a: any) =>
                                                a.applicationStatus ===
                                                'invited'
                                        ).length
                                    }
                                    )
                                </h3>
                            </div>
                            <div className="grid overflow-y-auto scrollbar-thin p-4 h-[85%] bg-gray-50 gap-4">
                                {!applications.filter(
                                    (a: any) =>
                                        a.applicationStatus === 'invited'
                                ).length ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            No listings that you are invited to
                                            apply to found.
                                        </span>
                                        <span
                                            onClick={() =>
                                                router.push(
                                                    '/app/talent/browse-listings'
                                                )
                                            }
                                            className="selectedListing?.applications && selectedListing.applications.some(text-primary font-medium text-sm text-center inline-flex hover:cursor-pointer"
                                        >
                                            Browse listings{' '}
                                            <ArrowTopRightOnSquareIcon className="text-primary ml-2 my-auto h-4 w-4" />
                                        </span>
                                    </div>
                                ) : null}

                                {applications.filter(
                                    (a: any) =>
                                        a.applicationStatus === 'invited'
                                ).length ? (
                                    <>
                                        {applications
                                            .filter(
                                                (a: any) =>
                                                    a.applicationStatus ===
                                                    'invited'
                                            )
                                            .map((application) => (
                                                <ListingCard
                                                    {...{
                                                        listing: listings.find(
                                                            (l: any) =>
                                                                l.id ===
                                                                application
                                                                    .listing.id
                                                        ),
                                                    }}
                                                />
                                            ))}
                                    </>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-2 border-gray-300 shadow-lg rounded-md h-[40vh] col-span-6 md:col-span-1">
                            <div className="p-4 border-b border-gray-300">
                                <h3 className="text-gray-900 font-medium text-md">
                                    Applied (
                                    {
                                        applications.filter(
                                            (a: any) =>
                                                a.applicationStatus ===
                                                'applied'
                                        ).length
                                    }
                                    )
                                </h3>
                            </div>
                            <div className="grid overflow-y-auto scrollbar-thin p-4 h-[85%] bg-gray-50 gap-4">
                                {!applications.filter(
                                    (a: any) =>
                                        a.applicationStatus === 'applied'
                                ).length ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            No listings that you have applied to
                                            found.
                                        </span>
                                        <span
                                            onClick={() =>
                                                router.push(
                                                    '/app/talent/browse-listings'
                                                )
                                            }
                                            className="selectedListing?.applications && selectedListing.applications.some(text-primary font-medium text-sm text-center inline-flex hover:cursor-pointer"
                                        >
                                            Browse listings{' '}
                                            <ArrowTopRightOnSquareIcon className="text-primary ml-2 my-auto h-4 w-4" />
                                        </span>
                                    </div>
                                ) : null}

                                {applications.filter(
                                    (a: any) =>
                                        a.applicationStatus === 'applied'
                                ).length ? (
                                    <>
                                        {applications
                                            .filter(
                                                (a: any) =>
                                                    a.applicationStatus ===
                                                    'applied'
                                            )
                                            .map((application) => (
                                                <ListingCard
                                                    {...{
                                                        listing: listings.find(
                                                            (l: any) =>
                                                                l.id ===
                                                                application
                                                                    .listing.id
                                                        ),
                                                    }}
                                                />
                                            ))}
                                    </>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-2 border-gray-300 shadow-lg rounded-md h-[40vh] col-span-6 md:col-span-1">
                            <div className="p-4 border-b border-gray-300">
                                <h3 className="text-gray-900 font-medium text-md">
                                    Interviewing (
                                    {
                                        applications.filter(
                                            (a: any) =>
                                                a.applicationStatus ===
                                                'interviewing'
                                        ).length
                                    }
                                    )
                                </h3>
                            </div>
                            <div className="grid overflow-y-auto scrollbar-thin p-4 h-[85%] bg-gray-50 gap-4">
                                {!applications.filter(
                                    (a: any) =>
                                        a.applicationStatus === 'interviewing'
                                ).length ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            No listings that you are being
                                            interviewed for found.
                                        </span>
                                        <span
                                            onClick={() =>
                                                router.push(
                                                    '/app/talent/browse-listings'
                                                )
                                            }
                                            className="selectedListing?.applications && selectedListing.applications.some(text-primary font-medium text-sm text-center inline-flex hover:cursor-pointer"
                                        >
                                            Browse listings{' '}
                                            <ArrowTopRightOnSquareIcon className="text-primary ml-2 my-auto h-4 w-4" />
                                        </span>
                                    </div>
                                ) : null}

                                {applications.filter(
                                    (a: any) =>
                                        a.applicationStatus === 'interviewing'
                                ).length ? (
                                    <>
                                        {applications
                                            .filter(
                                                (a: any) =>
                                                    a.applicationStatus ===
                                                    'interviewing'
                                            )
                                            .map((application) => (
                                                <ListingCard
                                                    {...{
                                                        listing: listings.find(
                                                            (l: any) =>
                                                                l.id ===
                                                                application
                                                                    .listing.id
                                                        ),
                                                    }}
                                                />
                                            ))}
                                    </>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-2 border-gray-300 shadow-lg rounded-md h-[40vh] col-span-6 md:col-span-1">
                            <div className="p-4 border-b border-gray-300">
                                <h3 className="text-gray-900 font-medium text-md">
                                    Shortlisted (
                                    {
                                        applications.filter(
                                            (a: any) =>
                                                a.applicationStatus ===
                                                'shortlisted'
                                        ).length
                                    }
                                    )
                                </h3>
                            </div>
                            <div className="grid overflow-y-auto scrollbar-thin p-4 h-[85%] bg-gray-50 gap-4">
                                {!applications.filter(
                                    (a: any) =>
                                        a.applicationStatus === 'shortlisted'
                                ).length ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            No listings that you are shortlisted
                                            for found.
                                        </span>
                                        <span
                                            onClick={() =>
                                                router.push(
                                                    '/app/talent/browse-listings'
                                                )
                                            }
                                            className="selectedListing?.applications && selectedListing.applications.some(text-primary font-medium text-sm text-center inline-flex hover:cursor-pointer"
                                        >
                                            Browse listings{' '}
                                            <ArrowTopRightOnSquareIcon className="text-primary ml-2 my-auto h-4 w-4" />
                                        </span>
                                    </div>
                                ) : null}

                                {applications.filter(
                                    (a: any) =>
                                        a.applicationStatus === 'shortlisted'
                                ).length ? (
                                    <>
                                        {applications
                                            .filter(
                                                (a: any) =>
                                                    a.applicationStatus ===
                                                    'shortlisted'
                                            )
                                            .map((application) => (
                                                <ListingCard
                                                    {...{
                                                        listing: listings.find(
                                                            (l: any) =>
                                                                l.id ===
                                                                application
                                                                    .listing.id
                                                        ),
                                                    }}
                                                />
                                            ))}
                                    </>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-2 border-gray-300 shadow-lg rounded-md h-[40vh] col-span-6 md:col-span-1">
                            <div className="p-4 border-b border-gray-300">
                                <h3 className="text-gray-900 font-medium text-md">
                                    Hired (
                                    {
                                        applications.filter(
                                            (a: any) =>
                                                a.applicationStatus === 'hired'
                                        ).length
                                    }
                                    )
                                </h3>
                            </div>
                            <div className="grid overflow-y-auto scrollbar-thin p-4 h-[85%] bg-gray-50 gap-4">
                                {!applications.filter(
                                    (a: any) => a.applicationStatus === 'hired'
                                ).length ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            No listings that you are hired for
                                            found.
                                        </span>
                                        <span
                                            onClick={() =>
                                                router.push(
                                                    '/app/talent/browse-listings'
                                                )
                                            }
                                            className="selectedListing?.applications && selectedListing.applications.some(text-primary font-medium text-sm text-center inline-flex hover:cursor-pointer"
                                        >
                                            Browse listings{' '}
                                            <ArrowTopRightOnSquareIcon className="text-primary ml-2 my-auto h-4 w-4" />
                                        </span>
                                    </div>
                                ) : null}

                                {applications.filter(
                                    (a: any) => a.applicationStatus === 'hired'
                                ).length ? (
                                    <>
                                        {applications
                                            .filter(
                                                (a: any) =>
                                                    a.applicationStatus ===
                                                    'hired'
                                            )
                                            .map((application) => (
                                                <ListingCard
                                                    {...{
                                                        listing: listings.find(
                                                            (l: any) =>
                                                                l.id ===
                                                                application
                                                                    .listing.id
                                                        ),
                                                    }}
                                                />
                                            ))}
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TalentMyListings;
