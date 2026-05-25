import type { NextPage } from 'next';
import { BuildingOffice2Icon, ClockIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, Fragment } from 'react';
import { useForm } from 'react-hook-form';
import { Client, ClientDataProfile } from 'types';
import apiRequest from 'services/apiRequest';
import * as localData from '../../../services/localData';
import FormBuilder from 'components/forms/formBuilder';
import FilterContainer from 'components/filters/filterContainer';
import { PageHeader } from 'components/commons/pageHeader';
import ClientDetail from 'components/clients/clientDetail';
import DetailModal from 'components/share/detailModal';
import ClientListItem from 'components/clients/clientListItem';
import FilterBadges from 'components/share/filterBadges';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { getClientMatchScore } from 'services/utils/getClientsMatchScore';
import { useNotification } from 'contexts/NotificationContext';
import { Switch } from '@headlessui/react';
import { useRouter } from 'next/router';

const BrowseClients: NextPage = () => {
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client>();
    const [filters, setFilters] = useState<any>({});
    const [preferences, setPreferences] = useState<any>({});
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [inspecting, setInspecting] = useState(false);
    const [countryFilter, setCountryFilter] = useState({
        country: '',
    });
    const [usOnlyActive, setUsOnlyActive] = useState(false);
    const [sortBy, setSortBy] = useState('match');

    const sortForm = useForm();
    const filtersForm = useForm();
    const countryFiltersForm = useForm();

    const { addNotification } = useNotification();

    let didInit = false;

    useEffect(() => {
        if (didInit) return;
        didInit = true;

        (async () => {
            setPreferences(localData.get('user.talentData.goals'));
            setBookmarks(
                localData.get('user.talentData.bookmarkedClients') || []
            );

            const clientsReq = await apiRequest('GET', '/talent/clients');

            if (clientsReq?.data?.clients.length)
                setClients(clientsReq.data.clients);

            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        const { ...restFilters } = filters;

        const filteredClients = clients.filter((c) => {
            let passed = true;

            const filterData = c.clientData.profile;

            Object.entries(restFilters).forEach(([k, v]: any[]) => {
                if (v) {
                    if (k === 'lastActivity') {
                        if (
                            !c?.dateLastOnline ||
                            c.dateLastOnline +
                                1000 *
                                    60 *
                                    60 *
                                    24 *
                                    7 *
                                    (v === 'This month' ? 4 : 1) <
                                Date.now()
                        )
                            passed = false;
                    } else {
                        if (
                            Array.isArray(v.split(', ')) &&
                            !v.includes(
                                filterData[k as keyof ClientDataProfile]
                            )
                        )
                            passed = false;
                        if (
                            !isNaN(v) &&
                            filterData[k as keyof ClientDataProfile] < v
                        )
                            passed = false;
                    }
                }
            });

            if (countryFilter?.country) {
                if (
                    !countryFilter?.country
                        ?.split(', ')
                        .includes(c.contact.addressCountry)
                ) {
                    passed = false;
                }
            }

            return passed;
        });

        const clientsWithMatchScore = filteredClients
            .map((client) => {
                const matchScore = getClientMatchScore({
                    client: client.clientData.profile,
                    talent: preferences,
                });

                return { ...client, matchScore };
            })
            .sort((prev, next) =>
                sortBy === 'match'
                    ? (next?.matchScore || 0) - (prev?.matchScore || 0)
                    : (next?.dateLastOnline || 0) - (prev?.dateLastOnline || 0)
            );

        setFilteredClients(clientsWithMatchScore);
    }, [clients, filters, preferences, countryFilter, sortBy]);

    const removeFilter = (filterName: string) => {
        filtersForm.setValue(filterName, '');

        setFilters(
            Object.fromEntries(
                Object.entries(filters).filter(([k, _]) => k !== filterName)
            )
        );
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

    const bookmark = async (clientId: string, bookmarked: boolean) => {
        const bookmarks =
            (
                await apiRequest('POST', '/talent/bookmarks/clients', {
                    clientId,
                    bookmarked,
                })
            )?.data?.bookmarkedClients || [];

        setBookmarks(bookmarks);
        localData.set('user.talentData.bookmarkedClients', bookmarks);
        addNotification({
            type: 'success',
            title: 'Bookmarks updated successfully',
            text: 'Refreshing your view...',
        });
    };

    const handleChooseClient = (c: Client) => {
        setSelectedClient(c);
        if (window.innerHeight > window.innerWidth) setInspecting(true);
    };

    return (
        <>
            {/* <PageHeader
                {...{ title: 'Browse clients', icon: BuildingOffice2Icon }}
            /> */}
            <div className="p-8 bg-background dark:bg-darkBackground">
                <div className="py-4 px-8 left-0 top-0 bg-white dark:bg-darkForeground z-10 rounded-2xl">
                    <div className="relative flex flex-col min-[365px]:flex-row gap-2">
                        <FilterContainer doubled>
                            <FormBuilder
                                {...{
                                    formHook: filtersForm,
                                    formName: 'clientFilters',
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
                            <div className="ml-2 flex items-center flex-row">
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
                                    className="text-black dark:text-white font-medium text-sm sm:ml-2"
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
                                formName="clientFilters"
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
                    ) : filteredClients.length > 0 ? (
                        <ul role="list" className="divide-y divide-white/5">
                            {filteredClients.map((c) => (
                                <li key={c.id}>
                                    <div
                                        onClick={() => handleChooseClient(c)}
                                        className="w-full bg-background dark:bg-darkBackground h-full"
                                    >
                                        <div className="bg-white dark:bg-darkForeground ml-8 mr-4 mb-8 rounded-2xl">
                                            <ClientListItem
                                                client={c}
                                                bookmarks={bookmarks}
                                            />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex justify-center ml-8 mr-4 mb-8 text-black dark:text-white">
                            <p className="flex justify-center mt-2">
                                We couldn't find any clients that match your filter
                                criteria.
                                <br />
                                Please adjust your filters.
                            </p>
                        </div>
                    )}
                </div>

                <div className="hidden md:block md:col-span-3 pb-8">
                    <div className="flex justify-center bg-white dark:bg-darkForeground ml-4 mr-8 rounded-2xl h-full">
                        {!selectedClient && (
                            <div className="h-[54rem]">
                                <span className="font-medium text-lg text-gray-400 py-4">
                                    Please select a client to view their full
                                    profile.
                                </span>
                            </div>
                        )}

                        {selectedClient && (
                             <div className="w-full h-full overflow-y-auto scrollbar-thin overflow-x-hidden">
                                <div className="rounded-2xl">
                                <ClientDetail
                                    selectedClient={selectedClient}
                                    bookmark={bookmark}
                                    bookmarks={bookmarks}
                                    preferences={preferences}
                                />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DetailModal show={inspecting} onClose={setInspecting}>
                {selectedClient && (
                    <div className="h-full w-full bg-white shadow-xl rounded-xl overflow-y-auto scrollbar-thin overflow-x-auto">
                        <ClientDetail
                            selectedClient={selectedClient}
                            bookmark={bookmark}
                            bookmarks={bookmarks}
                            preferences={preferences}
                        />
                    </div>
                )}
            </DetailModal>
        </>
    );
};

export default BrowseClients;
