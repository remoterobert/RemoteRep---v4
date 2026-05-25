import type { NextPage } from 'next';
import { ClockIcon } from '@heroicons/react/24/outline';
import { Fragment, useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';
import * as localData from '../../../services/localData';
import { useForm } from 'react-hook-form';
import { Dialog, Transition } from '@headlessui/react';
import FormBuilder from 'components/forms/formBuilder';
import { useRouter } from 'next/router';
import FilterContainer from 'components/filters/filterContainer';
import FilterBadges from 'components/share/filterBadges';
import ListingListItem from 'components/listings/listingListItem';
import { Client, Listing } from 'types';
import ListingDetail from 'components/listings/listingDetail';
import DetailModal from 'components/share/detailModal';
import { useNotification } from 'contexts/NotificationContext';
import { getListingMatchScore } from 'services/utils/getListingMatchScore';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { getMatchScore } from 'services/utils/getMatchScore';
import { Switch } from '@headlessui/react';

const BrowseListings: NextPage = () => {
    const [loading, setLoading] = useState(true);
    const [listings, setListings] = useState<Listing[]>([]);
    const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
    const [selectedListing, setSelectedListing] = useState<Listing>();
    const [filters, setFilters] = useState<any>({});
    const [preferences, setPreferences] = useState<any>({});
    const [showApply, setShowApply] = useState(false);
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [client, setClient] = useState<Client>();
    const [inspecting, setInspecting] = useState(false);
    const [countryFilter, setCountryFilter] = useState({
        country: '',
    });
    const [usOnlyActive, setUsOnlyActive] = useState(false);
    const [update, setUpdate] = useState(0);
    const [sortBy, setSortBy] = useState('match');

    const sortForm = useForm();
    const filtersForm = useForm();
    const applicationForm = useForm();
    const countryFiltersForm = useForm();

    const router = useRouter();

    const { addNotification } = useNotification();

    let didInit = false;
    let lastUpdate: number;

    useEffect(() => {
        if (didInit || update === lastUpdate) return;
        if (!didInit) didInit = true;
        else lastUpdate = update;

        (async () => {
            setPreferences(localData.get('user.talentData'));
            setBookmarks(
                localData.get('user.talentData.bookmarkedListings') || []
            );

            const listingsReq = await apiRequest('GET', '/talent/listings');

            if (listingsReq?.data?.listings.length)
                setListings(listingsReq.data.listings);

            if (selectedListing?.id)
                setSelectedListing(
                    listingsReq?.data?.listings?.find(
                        (l: any) => l.id === selectedListing.id
                    ) || selectedListing
                );

            setLoading(false);
        })();
    }, [update]);

    useEffect(() => {
        const { ...restFilters } = filters;

        const filteredListings = listings.filter((l) => {
            let passed = true;

            const filterData = l.details;

            if (
                (client?.id && client.id !== l?.client.id) ||
                (restFilters.salesRoles &&
                    !restFilters.salesRoles
                        .split(', ')
                        .includes(filterData?.salesRole)) ||
                (restFilters.commitments &&
                    !restFilters.commitments
                        .split(', ')
                        .includes(filterData?.commitment)) ||
                (restFilters.compensationTypes &&
                    !restFilters.compensationTypes
                        .split(', ')
                        .includes(filterData?.compensationType)) ||
                (restFilters.benefits &&
                    !restFilters.benefits
                        .split(', ')
                        .every((b: string) =>
                            filterData?.benefits.includes(b)
                        )) ||
                (restFilters.minimumCompensation &&
                    restFilters.minimumCompensation >
                        (filterData?.minimumCompensation || 0))
            )
                passed = false;

            if (countryFilter?.country) {
                if (
                    !countryFilter?.country
                        ?.split(', ')
                        .includes(l.client?.contact?.addressCountry)
                ) {
                    passed = false;
                }
            }

            if (
                restFilters?.lastActivity &&
                (!l?.client?.dateLastOnline ||
                    l.client.dateLastOnline +
                        1000 *
                            60 *
                            60 *
                            24 *
                            7 *
                            (restFilters.lastActivity === 'This month'
                                ? 4
                                : 1) <
                        Date.now())
            )
                passed = false;

            return passed;
        });

        const listingsWithMatchScore = filteredListings
            .map((listing) => {
                const matchScore = getListingMatchScore({
                    talent: preferences,
                    client: {
                        details: {
                            ...listing.details!,
                            ...listing.client?.clientData?.profile,
                        },
                        requirements: listing.requirements,
                    },
                });
                return { ...listing, matchScore };
            })
            .sort((prev, next) =>
                sortBy === 'match'
                    ? (next?.matchScore || 0) - (prev?.matchScore || 0)
                    : (next?.client?.dateLastOnline || 0) - (prev?.client?.dateLastOnline || 0)
            );

        setFilteredListings(listingsWithMatchScore);
    }, [listings, filters, client, countryFilter, sortBy]);

    useEffect(() => {
        if (!router.isReady) return;

        (async () => {
            if (router?.query?.client) {
                const clientReq = await apiRequest(
                    'GET',
                    `/talent/clients/${router.query.client}`
                );

                setClient(clientReq?.data?.client);
            }
        })();
    }, [router.query]);

    const removeFilter = (filterName: string) => {
        filtersForm.setValue(filterName, '');

        setFilters(
            Object.fromEntries(
                Object.entries(filters).filter(([k, _]) => k !== filterName)
            )
        );
    };

    const bookmark = async (listingId: string, bookmarked: boolean) => {
        const bookmarks =
            (
                await apiRequest('POST', '/talent/bookmarks/listings', {
                    listingId,
                    bookmarked,
                })
            )?.data?.bookmarkedListings || [];

        setBookmarks(bookmarks);
        localData.set('user.talentData.bookmarkedListings', bookmarks);
        addNotification({
            type: 'success',
            title: 'Bookmarks updated successfully',
            text: 'Refreshing your view...',
        });
    };

    const handleChooseListing = (listing: Listing) => {
        setSelectedListing(listing);
        if (window.innerHeight > window.innerWidth) setInspecting(true);
    };

    const clearCountryFilter = () => {
        setCountryFilter({ country: '' });
        setUsOnlyActive(false);
    };

    const handleToggle = (value: boolean) => {
        if (value) {
            setCountryFilter({
                country: 'US',
            });
            setUsOnlyActive(true);
        } else {
            setCountryFilter({
                country: '',
            });
            setUsOnlyActive(false);
        }
    };

    return (
        <>
            {/* <PageHeader
                {...{ title: 'Browse listings', icon: BuildingOffice2Icon }}
            /> */}

            <div className="p-8 dark:bg-darkBackground">
                <div className="py-4 px-8 bg-white dark:bg-darkForeground z-10 rounded-2xl">
                    <div className="relative flex flex-col min-[365px]:flex-row gap-2">
                        <FilterContainer doubled>
                            <FormBuilder
                                {...{
                                    formHook: filtersForm,
                                    formName: 'listingFilters',
                                    submitText: 'Filter',
                                    getFunc: async () => {
                                        return filters;
                                    },
                                    postFunc: async (data) => {
                                        setFilters(data);
                                        return true;
                                    },
                                }}
                            />
                        </FilterContainer>

                        <FilterContainer customTitle="Sort by" doubled>
                            <FormBuilder
                                {...{
                                    formHook: sortForm,
                                    formFieldsOverride: [
                                        {
                                            className: 'col-span-6',
                                            name: 'sortBy',
                                            type: 'select',
                                            label: 'Sort by',
                                            options: [
                                                {
                                                    value: 'match',
                                                    display: 'Match score',
                                                },
                                                {
                                                    value: 'activity',
                                                    display: 'Last activity',
                                                },
                                            ],
                                            validation: { required: false },
                                        },
                                    ],
                                    submitText: 'Sort',
                                    getFunc: async () => ({ sortBy }),
                                    postFunc: async (data) => {
                                        setSortBy(data.sortBy);
                                        return true;
                                    },
                                }}
                            />
                        </FilterContainer>
                        <FilterContainer customTitle="Countries" doubled>
                            <FormBuilder
                                {...{
                                    formHook: countryFiltersForm,
                                    formName: 'countries',
                                    submitText: 'Filter',
                                    getFunc: async () => {
                                        return countryFilter;
                                    },
                                    postFunc: async (data) => {
                                        const dataToSet = {
                                            country:
                                                data.addititonal === 'usOnly'
                                                    ? null
                                                    : data.country,
                                            addititonal: data.addititonal,
                                        };
                                        setCountryFilter(dataToSet);
                                        return true;
                                    },
                                }}
                            />
                        </FilterContainer>
                        <Switch.Group>
                            <div className="ml-2 flex flex-row items-center">
                                <Switch
                                    name="us-only"
                                    defaultChecked={false}
                                    checked={usOnlyActive}
                                    as={Fragment}
                                    onChange={handleToggle}
                                >
                                    {({ checked }) => (
                                        <button
                                            className={`${
                                                checked
                                                    ? 'bg-blue-600'
                                                    : 'bg-gray-200'
                                            } relative inline-flex h-6 w-11 items-center rounded-full`}
                                        >
                                            <span className="sr-only">
                                                US-only
                                            </span>
                                            <span
                                                className={`${
                                                    checked
                                                        ? 'translate-x-6'
                                                        : 'translate-x-1'
                                                } inline-block h-4 w-4 transform rounded-full bg-white dark:bg-darkForeground transition`}
                                            />
                                        </button>
                                    )}
                                </Switch>
                                <Switch.Label
                                    className="text-black dark:text-white font-medium text-xs sm:ml-2"
                                    passive
                                >
                                    US-only
                                </Switch.Label>
                            </div>
                        </Switch.Group>
                    </div>
                </div>
                <div>
                    {(Object.entries(filters).length > 0 ||
                        countryFilter?.country) && (
                        <div className="px-6 lg:px-8 pb-2 flex flex-wrap gap-2 items-center">
                            <FilterBadges
                                filters={filters}
                                removeFilter={removeFilter}
                                formName="talentFilters"
                            />

                            {!!countryFilter?.country && (
                                <div
                                    onClick={() => clearCountryFilter()}
                                    className="relative group text-xs border-2 rounded-full shadow-sm py-1 px-2 bg-white inline-flex hover:bg-red-50 hover:border-red-400"
                                >
                                    <span className="ml-1 text-gray-700 whitespace-nowrap">{`${
                                        countryFilter?.country?.split(', ')
                                            .length > 1
                                            ? `${
                                                  countryFilter?.country?.split(
                                                      ', '
                                                  ).length
                                              } selected countries`
                                            : `${countryFilter?.country}-only`
                                    }`}</span>
                                    <XMarkIcon className="my-auto h-4 w-4 text-gray-400 group-hover:text-red-400" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="md:grid grid-cols-4 h-full bg-background dark:bg-darkBackground">
                <div className="overflow-y-auto scrollbar-thin h-[100vh] scrollbar-thin">
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <ClockIcon className="h-8 w-8 text-gray-900 dark:text-white" />
                        </div>
                    ) : filteredListings.length > 0 ? (
                        <ul role="list" className="divide-y divide-white/5">
                            {filteredListings.map((l) => (
                                <li key={l.id}>
                                    <div
                                        onClick={() => handleChooseListing(l)}
                                        className="bg-background dark:bg-darkBackground w-full"
                                    >
                                        <div className="bg-white dark:bg-darkForeground ml-8 mr-4 mb-8 rounded-2xl">
                                            <ListingListItem
                                                listing={l}
                                                bookmarks={bookmarks}
                                            />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="ml-8 mr-4 mb-8 flex justify-center text-black dark:text-white">
                            <p className="flex justify-center mt-2">
                                We couldn't find any listings that match your filter
                                criteria.
                                <br />
                                Please adjust your filters.
                            </p>
                        </div>
                    )}
                </div>
                <div className="hidden md:block md:col-span-3 pb-8">
                    <div className="flex justify-center rounded-2xl bg-white dark:bg-darkForeground ml-4 mr-8 h-full">
                        {!selectedListing && (
                            <div className="h-[54rem]">
                                <span className="font-medium text-lg text-gray-400 py-4">
                                    Please select a listing to view in detail.
                                </span>
                            </div>
                        )}

                        {selectedListing && (
                            <div className="w-full overflow-y-auto scrollbar-thin overflow-x-hidden h-full">
                                <div className="bg-white dark:bg-darkForeground rounded-2xl">
                                    <ListingDetail
                                        selectedListing={selectedListing}
                                        bookmark={bookmark}
                                        bookmarks={bookmarks}
                                        preferences={preferences}
                                        setShowApply={setShowApply}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Transition.Root show={showApply} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={setShowApply}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto scrollbar-thin">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-visible rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                                    <p className="text-center">
                                        Are you sure you want to apply for{' '}
                                        <span className="font-medium">
                                            {selectedListing?.title}
                                        </span>
                                        ?
                                        <br />
                                        Your resume and profile details will be
                                        shared with the hiring manager.
                                    </p>
                                    <div className="mt-6">
                                        <FormBuilder
                                            formHook={applicationForm}
                                            formName="listingApplication"
                                            postFunc={async (data: any) => {
                                                try {
                                                    const applyReq =
                                                        await apiRequest(
                                                            'POST',
                                                            '/talent/applications/',
                                                            {
                                                                applicationMessage:
                                                                    data?.applicationMessage ||
                                                                    undefined,
                                                                listingId:
                                                                    selectedListing?.id,
                                                            }
                                                        );

                                                    if (
                                                        applyReq.status === 201
                                                    ) {
                                                        addNotification({
                                                            type: 'success',
                                                            title: 'Application sent successfully',
                                                            text: 'You will be notified when the client accepts your application...',
                                                        });
                                                        setTimeout(
                                                            () =>
                                                                setShowApply(
                                                                    false
                                                                ),
                                                            1000
                                                        );

                                                        setUpdate(update + 1);

                                                        return true;
                                                    } else return false;
                                                } catch {
                                                    addNotification({
                                                        type: 'error',
                                                        title: 'Error sending application',
                                                        text: 'Please try again later...',
                                                    });
                                                    return false;
                                                }
                                            }}
                                            submitText="Send application"
                                        />
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            <DetailModal show={inspecting} onClose={setInspecting}>
                {selectedListing && (
                    <div className="h-full bg-white shadow-xl rounded-xl w-full overflow-y-auto scrollbar-thin overflow-x-auto">
                        <ListingDetail
                            selectedListing={selectedListing}
                            bookmark={bookmark}
                            bookmarks={bookmarks}
                            preferences={preferences}
                            setShowApply={setShowApply}
                        />
                    </div>
                )}
            </DetailModal>
        </>
    );
};

export default BrowseListings;
