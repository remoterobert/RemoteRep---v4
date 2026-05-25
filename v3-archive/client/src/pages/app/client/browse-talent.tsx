import type { NextPage } from 'next';
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Fragment, useEffect, useRef, useState } from 'react';
import apiRequest from 'services/apiRequest';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import * as localData from '../../../services/localData';
import { useForm } from 'react-hook-form';
import { FilterModal } from 'components/browseViews/filterModal';
import { Listbox, Transition } from '@headlessui/react';
import FilterContainer from 'components/filters/filterContainer';
import FormBuilder from 'components/forms/formBuilder';
import FilterBadges from 'components/share/filterBadges';
import TalentListItem from 'components/talents/talentLIstItem';
import { Listing, Talent } from 'types';
import TalentDetail from 'components/talents/talentDetail';
import DetailModal from 'components/share/detailModal';
import { getMatchScore } from 'services/utils/getMatchScore';
import { useNotification } from 'contexts/NotificationContext';
import { Switch } from '@headlessui/react';
import { useRouter } from 'next/router';
// import { CreateFirstListingModal } from 'components/commons/createFirstListingModal';
import _ from 'lodash';
import { CreateFirstListingModal } from 'components/commons/createFirstListingModal';
import { FreePlanBanner } from 'components/commons/freePlanBanner';

const BrowseTalent: NextPage = () => {
    const [loading, setLoading] = useState(true);
    const [talent, setTalent] = useState<Talent[]>([]);
    const [filteredTalent, setFilteredTalent] = useState<Talent[]>([]);
    const initialFilteredTalentsRef = useRef<Talent[]>([]);
    const [selectedTalent, setSelectedTalent] = useState<Talent>();
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<any>({});

    const [preferences, setPreferences] = useState<any>();
    const [listing, setListing] = useState<Listing>();
    const [user, setUser] = useState<any>();
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [inspecting, setInspecting] = useState(false);
    const [update, setUpdate] = useState(0);
    const [countryFilter, setCountryFilter] = useState({
        country: '',
    });
    const [usOnlyActive, setUsOnlyActive] = useState(false);
    const [hasAccess, setHasAccess] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sortBy, setSortBy] = useState('match');

    const sortForm = useForm();
    const filtersForm = useForm();
    const countryFiltersForm = useForm();

    const { addNotification } = useNotification();

    useEffect(() => {
        setBookmarks(localData.get('user.clientData.bookmarkedTalent'));

        (async () => {
            const accessReq = await apiRequest('GET', '/client/access');
            setHasAccess(accessReq.data?.access);

            // if (accessReq.status === 200) {
            const listingsReq = await apiRequest('GET', `/client/listings`);

            setListings(
                listingsReq?.data?.listings
                // ?.filter(
                //     (l: any) =>
                //         (accessReq?.data?.type &&
                //             ['all', 'privileged'].includes(
                //                 accessReq.data.type
                //             )) ||
                //         !l?.hasOwnProperty('paidFor') ||
                //         l?.paidFor
                // )
            );

            setUser(localData.get('user'));

            const findListing = listingsReq?.data?.listings?.find(
                (l: Listing) => l?.id === listing?.id
            );

            if (findListing) setListing(findListing);

            const talentReq = await apiRequest('GET', '/client/talent');

            if (talentReq?.data?.talent.length) {
                setTalent(
                    talentReq.data.talent.map((t: Talent) => {
                        return accessReq.data?.access
                            ? t
                            : {
                                  ...t,
                                  contact: {
                                      ...t.contact,
                                      lastName: _.capitalize(
                                          Math.random()
                                              .toString(36)
                                              .slice(
                                                  Math.floor(
                                                      Math.random() * 6
                                                  ) + 4
                                              )
                                      ),
                                      addressState: Math.random()
                                          .toString(36)
                                          .slice(10)
                                          .toUpperCase(),
                                      addressZip: '',
                                      addressCity: _.capitalize(
                                          Math.random()
                                              .toString(36)
                                              .slice(
                                                  Math.floor(
                                                      Math.random() * 6
                                                  ) + 4
                                              )
                                      ),
                                  },
                              };
                    })
                );
            }

            setLoading(false);
            // } else setHasAccess(false);
        })();
    }, [update]);

    useEffect(() => {
        const { country, ...restFilters } = filters;
        const filteredTalents = talent.filter((t) => {
            let passed = true;

            const filterData = t?.talentData?.experience;

            if (
                (restFilters.yearsOfExperience &&
                    restFilters.yearsOfExperience >
                        filterData.yearsOfExperience) ||
                (restFilters.technologies &&
                    !restFilters.technologies
                        .split(', ')
                        .every((t: string) =>
                            filterData.technologies?.includes(t)
                        )) ||
                (restFilters.leadTypes &&
                    !restFilters.leadTypes
                        .split(', ')
                        .some((t: string) =>
                            filterData.leadTypes?.includes(t)
                        )) ||
                (restFilters.education &&
                    !restFilters.education
                        .split(', ')
                        ?.includes(filterData.education)) ||
                (restFilters.salesRoles &&
                    !restFilters.salesRoles
                        .split(', ')
                        .some((s: string) =>
                            filterData.salesRoles?.includes(s)
                        )) ||
                (restFilters.industries &&
                    !restFilters.industries
                        .split(', ')
                        .some((i: string) =>
                            filterData.industries?.includes(i)
                        )) ||
                (restFilters.salesCycles &&
                    !restFilters.salesCycles
                        .split(', ')
                        .some((s: string) =>
                            filterData.salesCycles?.includes(s)
                        )) ||
                (restFilters.salesTypes &&
                    !restFilters.salesTypes
                        .split(', ')
                        .some((s: string) =>
                            filterData.salesTypes?.includes(s)
                        )) ||
                (restFilters.decisionMakers &&
                    !restFilters.decisionMakers
                        .split(', ')
                        .some((d: string) =>
                            filterData.decisionMakers?.includes(d)
                        )) ||
                (restFilters.dealAmounts &&
                    !restFilters.dealAmounts
                        .split(', ')
                        .some((d: string) =>
                            filterData.dealAmounts?.includes(d)
                        )) ||
                (restFilters.salesVolumes &&
                    !restFilters.salesVolumes
                        .split(', ')
                        .some((s: string) =>
                            filterData.salesVolumes?.includes(s)
                        )) ||
                (restFilters.salesEnvironments &&
                    !restFilters.salesEnvironments
                        .split(', ')
                        .some((s: string) =>
                            filterData.salesEnvironments?.includes(s)
                        ))
            )
                passed = false;

            if (countryFilter?.country) {
                if (
                    !countryFilter?.country
                        ?.split(', ')
                        .includes(t.contact.addressCountry)
                ) {
                    passed = false;
                }
            }

            if (
                restFilters?.lastActivity &&
                (!t?.dateLastOnline ||
                    t.dateLastOnline +
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

        setFilteredTalent(
            filteredTalents
                .map((ft) => {
                    return {
                        ...ft,
                        matchScore: listing?.id
                            ? getMatchScore({
                                  client: {
                                      details: {
                                          ...listing.details,
                                          ...user.clientData.profile,
                                      },
                                      requirements: listing.requirements,
                                  },
                                  talent: ft.talentData,
                              })
                            : undefined,
                    };
                })
                .sort((prev, next) =>
                    sortBy === 'match'
                        ? (next?.matchScore || 0) - (prev?.matchScore || 0)
                        : (next?.dateLastOnline || 0) -
                          (prev?.dateLastOnline || 0)
                )
        );
        initialFilteredTalentsRef.current = filteredTalents;
    }, [talent, filters, countryFilter, sortBy]);

    const removeFilter = (filterName: string) => {
        filtersForm.setValue(filterName, '');

        setFilters(
            Object.fromEntries(
                Object.entries(filters).filter(([k, _]) => k !== filterName)
            )
        );
    };

    const bookmark = async (talentId: string, bookmarked: boolean) => {
        const bookmarks =
            (
                await apiRequest('POST', '/client/bookmarks/talent', {
                    talentId,
                    bookmarked,
                })
            )?.data?.bookmarkedTalent || [];

        setBookmarks(bookmarks);
        localData.set('user.clientData.bookmarkedTalent', bookmarks);
        addNotification({
            type: 'success',
            title: 'Bookmarks updated successfully',
            text: 'Refreshing your view...',
        });
    };

    const handleChooseTalent = (talent: Talent) => {
        setSelectedTalent(talent);
        if (window.innerHeight > window.innerWidth) setInspecting(true);
    };

    const handleSelectListing = async (listingId: string) => {
        if (listingId) {
            const listingReq = await apiRequest(
                'GET',
                `/client/listings/${listingId}`
            );
            setListing(listingReq?.data as Listing);

            setFilteredTalent(() => {
                const talentsWithMatchScore = initialFilteredTalentsRef.current
                    .map((talent) => {
                        const matchScore = getMatchScore({
                            client: {
                                details: {
                                    ...listingReq.data!.details,
                                    ...user.clientData.profile,
                                },
                                requirements: listingReq.data!.requirements,
                            },
                            talent: talent.talentData,
                        });

                        return {
                            ...talent,
                            matchScore,
                        };
                    })
                    .sort((prev, next) =>
                        sortBy === 'match'
                            ? (next?.matchScore || 0) - (prev?.matchScore || 0)
                            : (next?.dateLastOnline || 0) -
                              (prev?.dateLastOnline || 0)
                    );

                return talentsWithMatchScore;
            });

            setPreferences(
                {
                    experience: listingReq?.data?.requirements,

                    goals: {
                        ...localData.get('user.clientData.profile'),
                        ...listingReq?.data?.details,
                    },
                } || null
            );
        } else {
            setListing(undefined);
            setPreferences(undefined);
            setTalent(initialFilteredTalentsRef.current);
        }
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
            {!hasAccess && <FreePlanBanner />}
            <div className='bg-background dark:bg-darkBackground p-8'>
                <div className="py-4 px-8 top-4 md:top-0 bg-white dark:bg-darkForeground rounded-2xl">
                    <div className="relative grid grid-cols-2 md:flex flex-col md:flex-row gap-2 items-center">
                        <div className="md:w-72 flex items-center">
                            <Listbox
                                value={listing?.title}
                                onChange={handleSelectListing}
                            >
                                <div className="relative w-full flex items-center">
                                    <Listbox.Button className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-darkForeground text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                                        <span className="truncate block w-full rounded-md border-0 px-2 py-1.5 text-black dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                            {listing?.title ||
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
                                        <Listbox.Options className="z-10 absolute max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-darkBackground py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                            <Listbox.Option
                                                value={undefined}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                        active
                                                            ? 'bg-primaryBlue text-white'
                                                            : 'text-gray-900 dark:text-white'
                                                    }`
                                                }
                                            >
                                                {({ selected, active }) => {
                                                    return (
                                                        <>
                                                            <span
                                                                className={`block truncate ${
                                                                    selected
                                                                        ? 'font-medium'
                                                                        : 'font-normal'
                                                                }`}
                                                            >
                                                                All Listings
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
                                                    );
                                                }}
                                            </Listbox.Option>
                                            {listings.map((l) => {
                                                const selected =
                                                    l.id === listing?.id;

                                                return (
                                                    <Listbox.Option
                                                        value={l.id}
                                                        id={l.id}
                                                        className={({
                                                            active,
                                                        }) =>
                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                active
                                                                    ? 'bg-primaryBlue text-white'
                                                                    : 'text-gray-900 dark:text-white'
                                                            }`
                                                        }
                                                    >
                                                        {({ active }) => (
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
                                                );
                                            })}
                                        </Listbox.Options>
                                    </Transition>
                                </div>
                            </Listbox>
                        </div>
                        <FilterContainer doubled>
                            <FormBuilder
                                {...{
                                    formHook: filtersForm,
                                    formName: 'talentFilters',
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
                        <div className="flex gap-2">
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
                                                        display:
                                                            'Last activity',
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
                                                    data.addititonal ===
                                                    'usOnly'
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
                                <div className="flex flex-row items-center">
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
                                                    } inline-block h-4 w-4 transform rounded-full bg-white dark:bg-darkBackground transition`}
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
                <div className="overflow-y-auto scrollbar-thin h-[100vh]">
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <ClockIcon className="h-8 w-8 text-gray-900 dark:text-white" />
                        </div>
                    ) : filteredTalent.length > 0 ? (
                        <ul role="list" className="divide-y divide-white/5">
                            {filteredTalent.map((t) => (
                                <li key={t.id}>
                                    <div
                                        onClick={() => handleChooseTalent(t)}
                                        className="dark:bg-darkBackground w-full"
                                    >
                                        <div className="bg-white dark:bg-darkForeground ml-8 mr-4 mb-8 rounded-2xl">
                                            <TalentListItem
                                                {...{
                                                    talent: t,
                                                    bookmarks,
                                                    preferences,
                                                    hasAccess,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="flex justify-center mt-2">
                            We couldn't find any talent that match your filter
                            criteria.
                            <br />
                            Please adjust your filters.
                        </p>
                    )}
                </div>

                <div className="overflow-y-auto scrollbar-thin h-full hidden md:block md:col-span-3 pb-8">
                    <div className="flex items-center justify-center rounded-xl bg-white dark:bg-darkForeground ml-4 mr-8 h-full">
                        {!selectedTalent && (
                            <div className="h-[54rem]">
                                <span className="font-medium text-lg text-gray-400 py-4">
                                    Please select talent to view in detail.
                                </span>
                            </div>
                        )}

                        {selectedTalent && (
                            <div className="w-full overflow-y-auto scrollbar-thin overflow-x-hidden h-full">
                                <div className="bg-white dark:bg-darkForeground rounded-2xl">
                                    <TalentDetail
                                        {...{
                                            selectedTalent,
                                            listing,
                                            setUpdate,
                                            update,
                                            bookmarks,
                                            bookmark,
                                            preferences,
                                            user,
                                            hasAccess,
                                            setShowCreateModal,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FilterModal
                {...{
                    show: showFilters,
                    setShow: setShowFilters,
                    filters,
                    setFilters,
                    filtersForm: { hook: filtersForm, name: 'talentFilters' },
                }}
            />

            <DetailModal show={inspecting} onClose={setInspecting}>
                {selectedTalent && (
                    <div className="h-full bg-white shadow-xl rounded-xl w-full overflow-y-auto scrollbar-thin overflow-x-auto">
                        <TalentDetail
                            {...{
                                selectedTalent,
                                listing,
                                setUpdate,
                                update,
                                bookmarks,
                                bookmark,
                                preferences,
                                user,
                                hasAccess,
                                setShowCreateModal,
                            }}
                        />
                    </div>
                )}
            </DetailModal>

            <CreateFirstListingModal
                {...{ show: showCreateModal, setShow: setShowCreateModal }}
            />
        </>
    );
};

export default BrowseTalent;
