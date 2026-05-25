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

const ClientMyTalent: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [update, setUpdate] = useState(0);
    const [user, setUser] = useState<any>();
    const [listings, setListings] = useState<any[]>([]);
    const [selectedListing, setSelectedListing] = useState<any>();
    const [talent, setTalent] = useState<any[]>([]);
    const [bookmarks, setBookmarks] = useState<string[]>([]);

    const router = useRouter();

    useEffect(() => {
        setUser(localData.get('user'));

        (async () => {
            const listingsReq = await apiRequest('GET', '/client/listings');

            if (listingsReq?.data?.listings.length)
                setListings(listingsReq.data.listings);

            const talentReq = await apiRequest('GET', '/client/talent');

            if (talentReq?.data?.talent.length)
                setTalent(talentReq.data.talent);

            if (localData.get('user.clientData.bookmarkedTalent'))
                setBookmarks(localData.get('user.clientData.bookmarkedTalent'));

            setLoading(false);
        })();
    }, [update]);

    const TalentCard: React.FC<{ talent: any }> = ({ talent }) => {
        return (
            <div
                key={talent.id}
                className="bg-white shadow-xl rounded-xl w-full"
            >
                <div className="px-4 py-4">
                    <div className="inline-flex">
                        <img
                            src={talent?.talentData?.profile?.photoUrl}
                            className="h-8 w-8 rounded-full my-auto grow-0"
                        />

                        <div className="ml-2 font-medium text-gray-900 flex items-center">
                            <div>
                                <span className="text-sm inline-flex">
                                    {`${talent?.contact?.firstName} ${talent?.contact?.lastName}`}
                                </span>
                                <div>
                                    <span className="text-xs inline-flex text-gray-700">
                                        <MapPinIcon className="my-auto h-3 w-3 text-gray-700" />
                                        {[
                                            talent?.contact?.addressCity,
                                            talent?.contact?.addressState,
                                            talent?.contact?.addressCountry,
                                        ].join(', ')}
                                    </span>
                                </div>
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
                            My talent
                        </h3>

                        <Listbox
                            value={selectedListing}
                            onChange={setSelectedListing}
                        >
                            <div className="ml-4 relative w-32 md:w-72">
                                <Listbox.Button className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                                    <span className="truncate block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                        {selectedListing?.title ||
                                            'Select listing...'}
                                    </span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                        <ChevronUpDownIcon
                                            className="h-5 w-5 text-gray-400"
                                            aria-hidden="true"
                                        />
                                    </span>
                                </Listbox.Button>
                                <Transition
                                    as={Fragment}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <Listbox.Options className="z-10 absolute mt-1 max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                        {listings.map((l, i) => (
                                            <Listbox.Option
                                                key={i}
                                                value={l}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                        active
                                                            ? 'bg-primary text-white'
                                                            : 'text-gray-900'
                                                    }`
                                                }
                                            >
                                                {({ selected, active }) => (
                                                    <>
                                                        <span
                                                            className={`block truncate ${
                                                                selected
                                                                    ? 'font-medium'
                                                                    : 'font-normal'
                                                            }`}
                                                        >
                                                            {l.title}
                                                        </span>
                                                        {selected ? (
                                                            <span
                                                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                    active
                                                                        ? 'text-white'
                                                                        : 'text-primary'
                                                                }`}
                                                            >
                                                                <CheckIcon
                                                                    className="h-5 w-5"
                                                                    aria-hidden="true"
                                                                />
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </Transition>
                            </div>
                        </Listbox>
                    </div>

                    <div className="mt-8 grid grid-cols-6 gap-8">
                        <div className="border-2 border-gray-300 shadow-lg rounded-md h-[40vh] col-span-6 md:col-span-1">
                            <div className="p-4 border-b border-gray-300">
                                <h3 className="text-gray-900 font-medium text-md">
                                    Bookmarked (
                                    {
                                        talent.filter((t: any) =>
                                            bookmarks.includes(t.id)
                                        ).length
                                    }
                                    )
                                </h3>
                            </div>
                            <div className="grid overflow-y-auto scrollbar-thin p-4 h-[85%] bg-gray-50 gap-4">
                                {!talent.filter((t: any) =>
                                    bookmarks.includes(t.id)
                                ).length ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            No bookmarked talent found.
                                        </span>
                                        <span
                                            onClick={() =>
                                                router.push(
                                                    '/app/client/browse-talent'
                                                )
                                            }
                                            className="text-primary font-medium text-sm text-center inline-flex hover:cursor-pointer"
                                        >
                                            Browse talent{' '}
                                            <ArrowTopRightOnSquareIcon className="text-primary ml-2 my-auto h-4 w-4" />
                                        </span>
                                    </div>
                                ) : null}

                                {talent.filter((t: any) =>
                                    bookmarks.includes(t.id)
                                ).length ? (
                                    <>
                                        {talent
                                            .filter((t: any) =>
                                                bookmarks.includes(t.id)
                                            )
                                            .map((talent) => (
                                                <TalentCard {...{ talent }} />
                                            ))}
                                    </>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-2 border-gray-300 shadow-lg rounded-md h-[40vh] col-span-6 md:col-span-1">
                            <div className="p-4 border-b border-gray-300">
                                <h3 className="text-gray-900 font-medium text-md">
                                    Invited (
                                    {selectedListing
                                        ? talent.filter(
                                              (t: any) =>
                                                  selectedListing?.applications &&
                                                  selectedListing.applications.some(
                                                      (a: any) =>
                                                          a.talent === t.id &&
                                                          a.applicationStatus ===
                                                              'invited'
                                                  )
                                          ).length
                                        : 0}
                                    )
                                </h3>
                            </div>
                            <div className="grid overflow-y-auto scrollbar-thin p-4 h-[85%] bg-gray-50 gap-4">
                                {!selectedListing ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            Please select a listing to view
                                            invited talent.
                                        </span>
                                    </div>
                                ) : null}

                                {selectedListing &&
                                !talent.filter(
                                    (t: any) =>
                                        selectedListing?.applications &&
                                        selectedListing.applications.some(
                                            (a: any) =>
                                                a.talent === t.id &&
                                                a.applicationStatus ===
                                                    'invited'
                                        )
                                ).length ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            No bookmarked talent found.
                                        </span>
                                        <span
                                            onClick={() =>
                                                router.push(
                                                    '/app/client/browse-talent'
                                                )
                                            }
                                            className="text-primary font-medium text-sm text-center inline-flex hover:cursor-pointer"
                                        >
                                            Browse talent{' '}
                                            <ArrowTopRightOnSquareIcon className="text-primary ml-2 my-auto h-4 w-4" />
                                        </span>
                                    </div>
                                ) : null}

                                {selectedListing &&
                                talent.filter(
                                    (t: any) =>
                                        selectedListing?.applications &&
                                        selectedListing.applications.some(
                                            (a: any) =>
                                                a.talent === t.id &&
                                                a.applicationStatus ===
                                                    'invited'
                                        )
                                ).length ? (
                                    <>
                                        {talent
                                            .filter(
                                                (t: any) =>
                                                    selectedListing?.applications &&
                                                    selectedListing.applications.some(
                                                        (a: any) =>
                                                            a.talent === t.id &&
                                                            a.applicationStatus ===
                                                                'invited'
                                                    )
                                            )
                                            .map((talent) => (
                                                <TalentCard {...{ talent }} />
                                            ))}
                                    </>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-2 border-gray-300 shadow-lg rounded-md h-[40vh] col-span-6 md:col-span-1">
                            <div className="p-4 border-b border-gray-300">
                                <h3 className="text-gray-900 font-medium text-md">
                                    Applied (
                                    {selectedListing
                                        ? talent.filter(
                                              (t: any) =>
                                                  selectedListing?.applications &&
                                                  selectedListing.applications.some(
                                                      (a: any) =>
                                                          a.talent === t.id &&
                                                          a.applicationStatus ===
                                                              'applied'
                                                  )
                                          ).length
                                        : 0}
                                    )
                                </h3>
                            </div>
                            <div className="grid overflow-y-auto scrollbar-thin p-4 h-[85%] bg-gray-50 gap-4">
                                {!selectedListing ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            Please select a listing to view
                                            applied talent.
                                        </span>
                                    </div>
                                ) : null}

                                {selectedListing &&
                                !talent.filter(
                                    (t: any) =>
                                        selectedListing?.applications &&
                                        selectedListing.applications.some(
                                            (a: any) =>
                                                a.talent === t.id &&
                                                a.applicationStatus ===
                                                    'applied'
                                        )
                                ).length ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            No applied talent found.
                                        </span>
                                        <span
                                            onClick={() =>
                                                router.push(
                                                    '/app/client/browse-talent'
                                                )
                                            }
                                            className="text-primary font-medium text-sm text-center inline-flex hover:cursor-pointer"
                                        >
                                            Browse talent{' '}
                                            <ArrowTopRightOnSquareIcon className="text-primary ml-2 my-auto h-4 w-4" />
                                        </span>
                                    </div>
                                ) : null}

                                {selectedListing &&
                                talent.filter(
                                    (t: any) =>
                                        selectedListing?.applications &&
                                        selectedListing.applications.some(
                                            (a: any) =>
                                                a.talent === t.id &&
                                                a.applicationStatus ===
                                                    'applied'
                                        )
                                ).length ? (
                                    <>
                                        {talent
                                            .filter(
                                                (t: any) =>
                                                    selectedListing?.applications &&
                                                    selectedListing.applications.some(
                                                        (a: any) =>
                                                            a.talent === t.id &&
                                                            a.applicationStatus ===
                                                                'applied'
                                                    )
                                            )
                                            .map((talent) => (
                                                <TalentCard {...{ talent }} />
                                            ))}
                                    </>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-2 border-gray-300 shadow-lg rounded-md h-[40vh] col-span-6 md:col-span-1">
                            <div className="p-4 border-b border-gray-300">
                                <h3 className="text-gray-900 font-medium text-md">
                                    Interviewing (
                                    {selectedListing
                                        ? talent.filter(
                                              (t: any) =>
                                                  selectedListing?.applications &&
                                                  selectedListing.applications.some(
                                                      (a: any) =>
                                                          a.talent === t.id &&
                                                          a.applicationStatus ===
                                                              'interviewing'
                                                  )
                                          ).length
                                        : 0}
                                    )
                                </h3>
                            </div>
                            <div className="grid overflow-y-auto scrollbar-thin p-4 h-[85%] bg-gray-50 gap-4">
                                {!selectedListing ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            Please select a listing to view
                                            talent that you are interviewing.
                                        </span>
                                    </div>
                                ) : null}

                                {selectedListing &&
                                !talent.filter(
                                    (t: any) =>
                                        selectedListing?.applications &&
                                        selectedListing.applications.some(
                                            (a: any) =>
                                                a.talent === t.id &&
                                                a.applicationStatus ===
                                                    'interviewing'
                                        )
                                ).length ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            No talent that you are interviewing
                                            found.
                                        </span>
                                        <span
                                            onClick={() =>
                                                router.push(
                                                    '/app/client/browse-talent'
                                                )
                                            }
                                            className="text-primary font-medium text-sm text-center inline-flex hover:cursor-pointer"
                                        >
                                            Browse talent{' '}
                                            <ArrowTopRightOnSquareIcon className="text-primary ml-2 my-auto h-4 w-4" />
                                        </span>
                                    </div>
                                ) : null}

                                {selectedListing &&
                                talent.filter(
                                    (t: any) =>
                                        selectedListing?.applications &&
                                        selectedListing.applications.some(
                                            (a: any) =>
                                                a.talent === t.id &&
                                                a.applicationStatus ===
                                                    'interviewing'
                                        )
                                ).length ? (
                                    <>
                                        {talent
                                            .filter(
                                                (t: any) =>
                                                    selectedListing?.applications &&
                                                    selectedListing.applications.some(
                                                        (a: any) =>
                                                            a.talent === t.id &&
                                                            a.applicationStatus ===
                                                                'interviewing'
                                                    )
                                            )
                                            .map((talent) => (
                                                <TalentCard {...{ talent }} />
                                            ))}
                                    </>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-2 border-gray-300 shadow-lg rounded-md h-[40vh] col-span-6 md:col-span-1">
                            <div className="p-4 border-b border-gray-300">
                                <h3 className="text-gray-900 font-medium text-md">
                                    Shortlisted (
                                    {selectedListing
                                        ? talent.filter(
                                              (t: any) =>
                                                  selectedListing?.applications &&
                                                  selectedListing.applications.some(
                                                      (a: any) =>
                                                          a.talent === t.id &&
                                                          a.applicationStatus ===
                                                              'shortlisted'
                                                  )
                                          ).length
                                        : 0}
                                    )
                                </h3>
                            </div>
                            <div className="grid overflow-y-auto scrollbar-thin p-4 h-[85%] bg-gray-50 gap-4">
                                {!selectedListing ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            Please select a listing to view
                                            shortlisted talent.
                                        </span>
                                    </div>
                                ) : null}

                                {selectedListing &&
                                !talent.filter(
                                    (t: any) =>
                                        selectedListing?.applications &&
                                        selectedListing.applications.some(
                                            (a: any) =>
                                                a.talent === t.id &&
                                                a.applicationStatus ===
                                                    'shortlisted'
                                        )
                                ).length ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            No shortlisted talent found.
                                        </span>
                                        <span
                                            onClick={() =>
                                                router.push(
                                                    '/app/client/browse-talent'
                                                )
                                            }
                                            className="text-primary font-medium text-sm text-center inline-flex hover:cursor-pointer"
                                        >
                                            Browse talent{' '}
                                            <ArrowTopRightOnSquareIcon className="text-primary ml-2 my-auto h-4 w-4" />
                                        </span>
                                    </div>
                                ) : null}

                                {selectedListing &&
                                talent.filter(
                                    (t: any) =>
                                        selectedListing?.applications &&
                                        selectedListing.applications.some(
                                            (a: any) =>
                                                a.talent === t.id &&
                                                a.applicationStatus ===
                                                    'shortlisted'
                                        )
                                ).length ? (
                                    <>
                                        {talent
                                            .filter(
                                                (t: any) =>
                                                    selectedListing?.applications &&
                                                    selectedListing.applications.some(
                                                        (a: any) =>
                                                            a.talent === t.id &&
                                                            a.applicationStatus ===
                                                                'shortlisted'
                                                    )
                                            )
                                            .map((talent) => (
                                                <TalentCard {...{ talent }} />
                                            ))}
                                    </>
                                ) : null}
                            </div>
                        </div>

                        <div className="border-2 border-gray-300 shadow-lg rounded-md h-[40vh] col-span-6 md:col-span-1">
                            <div className="p-4 border-b border-gray-300">
                                <h3 className="text-gray-900 font-medium text-md">
                                    Hired (
                                    {selectedListing
                                        ? talent.filter(
                                              (t: any) =>
                                                  selectedListing?.applications &&
                                                  selectedListing.applications.some(
                                                      (a: any) =>
                                                          a.talent === t.id &&
                                                          a.applicationStatus ===
                                                              'hired'
                                                  )
                                          ).length
                                        : 0}
                                    )
                                </h3>
                            </div>
                            <div className="grid overflow-y-auto scrollbar-thin p-4 h-[85%] bg-gray-50 gap-4">
                                {!selectedListing ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            Please select a listing to view
                                            hired talent.
                                        </span>
                                    </div>
                                ) : null}

                                {selectedListing &&
                                !talent.filter(
                                    (t: any) =>
                                        selectedListing?.applications &&
                                        selectedListing.applications.some(
                                            (a: any) =>
                                                a.talent === t.id &&
                                                a.applicationStatus === 'hired'
                                        )
                                ).length ? (
                                    <div className="flex items-center justify-center flex-wrap">
                                        <span className="text-gray-400 text-sm text-center">
                                            No hired talent found.
                                        </span>
                                        <span
                                            onClick={() =>
                                                router.push(
                                                    '/app/client/browse-talent'
                                                )
                                            }
                                            className="text-primary font-medium text-sm text-center inline-flex hover:cursor-pointer"
                                        >
                                            Browse talent{' '}
                                            <ArrowTopRightOnSquareIcon className="text-primary ml-2 my-auto h-4 w-4" />
                                        </span>
                                    </div>
                                ) : null}

                                {selectedListing &&
                                talent.filter(
                                    (t: any) =>
                                        selectedListing?.applications &&
                                        selectedListing.applications.some(
                                            (a: any) =>
                                                a.talent === t.id &&
                                                a.applicationStatus === 'hired'
                                        )
                                ).length ? (
                                    <>
                                        {talent
                                            .filter(
                                                (t: any) =>
                                                    selectedListing?.applications &&
                                                    selectedListing.applications.some(
                                                        (a: any) =>
                                                            a.talent === t.id &&
                                                            a.applicationStatus ===
                                                                'hired'
                                                    )
                                            )
                                            .map((talent) => (
                                                <TalentCard {...{ talent }} />
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

export default ClientMyTalent;
