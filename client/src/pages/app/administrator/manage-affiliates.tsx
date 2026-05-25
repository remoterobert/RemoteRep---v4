import type { NextPage } from 'next';
import {
    BanknotesIcon,
    CheckIcon,
    ClockIcon,
    CursorArrowRaysIcon,
    LifebuoyIcon,
    LockClosedIcon,
    LockOpenIcon,
    PlusIcon,
    UserIcon,
    UserMinusIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import Table from 'components/tables/table';
import { useNotification } from 'contexts/NotificationContext';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Transition, Listbox, Dialog } from '@headlessui/react';
import apiRequest from 'services/apiRequest';
import { ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/20/solid';
import _ from 'lodash';
import { RoundButton } from 'components/commons/roundButton';
import * as localData from 'services/localData';
import * as authService from 'services/authentication';
import { useForm } from 'react-hook-form';
import FormBuilder from 'components/forms/formBuilder';

const ManageAffiliates: NextPage = () => {
    const [loading, setLoading] = useState(true);
    const [update, setUpdate] = useState(0);
    const [codes, setCodes] = useState<
        {
            id: string;
            creator: {
                name: string;
                email: string;
                imageUrl: string;
                affiliateAccess: string;
            };
            visitors: { dx: number }[];
            leads: { id: string; dx: number }[];
            conversions: { id: string; dx: number }[];
            churned: { id: string; dx: number }[];
            revenue: { amount: number; dx: number }[];
            commissions: { amount: number; dx: number }[];
            dateCreated: number;
            dateUpdated: number;
        }[]
    >();
    const [selectedCode, setSelectedCode] = useState<{
        id: string;
        creator: {
            name: string;
            email: string;
            imageUrl: string;
            affiliateAccess: string;
        };
        visitors: { dx: number }[];
        leads: { id: string; dx: number }[];
        conversions: { id: string; dx: number }[];
        churned: { id: string; dx: number }[];
        revenue: { amount: number; dx: number }[];
        commissions: { amount: number; dx: number }[];
        dateCreated: number;
        dateUpdated: number;
    }>();
    const [showAddModal, setShowAddModal] = useState(false);
    const [startDate, setStartDate] = useState(0);
    const [selectedDate, setSelectedDate] = useState('a');
    const dateOptions = [
        { value: '7d', display: 'Last 7 days' },
        { value: '4w', display: 'Last 4 weeks' },
        { value: 'a', display: 'All time' },
    ];
    const [affiliateSearch, setAffiliateSearch] = useState('');

    const { addNotification } = useNotification();

    const addForm = useForm();

    const refreshCodes = async () => {
        const codesReq = await apiRequest('GET', '/affiliate/codes');

        if (codesReq.status === 200) setCodes(codesReq!.data!.codes);
    };

    useEffect(() => {
        refreshCodes().then(() => setLoading(false));
    }, [update]);

    useEffect(
        () =>
            setStartDate(
                selectedDate === 'a'
                    ? 0
                    : selectedDate === '7d'
                    ? Date.now() - 1000 * 60 * 60 * 24 * 7
                    : 1000 * 60 * 60 * 24 * 7 * 4
            ),
        [selectedDate]
    );

    const searchedAffiliates = useMemo(
        () =>
            codes?.filter((c: any) =>
                affiliateSearch
                    ? c.creator.name
                          .toLowerCase()
                          .includes(affiliateSearch.toLowerCase()) ||
                      c.creator.email
                          .toLowerCase()
                          .includes(affiliateSearch.toLowerCase())
                    : true
            ) || [],
        [affiliateSearch, codes]
    );

    const combinedCodes = useMemo(
        () => ({
            visitors:
                codes?.reduce(
                    (last: any, curr: any) => [...last, ...curr.visitors],
                    []
                ) || [],
            leads:
                codes?.reduce(
                    (last: any, curr: any) => [...last, ...curr.leads],
                    []
                ) || [],
            conversions:
                codes?.reduce(
                    (last: any, curr: any) => [...last, ...curr.conversions],
                    []
                ) || [],
            churned:
                codes?.reduce(
                    (last: any, curr: any) => [...last, ...curr.churned],
                    []
                ) || [],
            revenue:
                codes?.reduce(
                    (last: any, curr: any) => [...last, ...curr.revenue],
                    []
                ) || [],
            commissions:
                codes?.reduce(
                    (last: any, curr: any) => [...last, ...curr.commissions],
                    []
                ) || [],
        }),
        [codes]
    );

    const metrics = useMemo(
        () => ({
            visitors:
                combinedCodes?.visitors.filter((m) => m.dx > startDate)
                    .length || 0,
            leads:
                combinedCodes?.leads.filter((m) => m.dx > startDate).length ||
                0,
            conversions:
                combinedCodes?.conversions.filter((m) => m.dx > startDate)
                    .length || 0,
            churned:
                combinedCodes?.churned.filter((m) => m.dx > startDate).length ||
                0,
            revenue:
                combinedCodes?.revenue
                    .filter((m) => m.dx > startDate)
                    .reduce((last, current) => last + current.amount, 0.0) || 0,
        }),
        [combinedCodes, startDate]
    );

    return (
        <>
            {loading ? (
                <>
                    <div className="flex justify-center dark:bg-darkBackground h-[100vh]">
                        <ClockIcon className="h-8 w-8 text-gray-900 dark:text-white mt-4" />
                    </div>
                </>
            ) : (
                <>
                    <div className="p-4 grid space-y-4">
                        <div className="shadow-lg rounded-lg p-8 space-y-4">
                            <div className="flex justify-between items-center mx-2 sm:mx-8 text-black dark:text-white">
                                <span className="font-medium text-2xl">
                                    Metrics
                                </span>

                                <Listbox
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                >
                                    <div className="relative">
                                        <Listbox.Button className="h-8 relative w-48 cursor-default rounded-lg bg-white dark:bg-darkForeground text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pr-2">
                                                <ChevronUpDownIcon
                                                    className="h-5 w-5 text-gray-400"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                            <span className="px-8 py-2 text-sm text-gray-900 dark:text-white">
                                                {
                                                    dateOptions.find(
                                                        (d) =>
                                                            d.value ===
                                                            selectedDate
                                                    )?.display
                                                }
                                            </span>
                                        </Listbox.Button>
                                        <Transition
                                            as={Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <Listbox.Options className="z-10 absolute mt-1 max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-darkBackground py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                {dateOptions.map((option) => (
                                                    <Listbox.Option
                                                        key={option.value}
                                                        value={option.value}
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
                                                        {({
                                                            selected,
                                                            active,
                                                        }) => (
                                                            <>
                                                                <span
                                                                    className={`block truncate ${
                                                                        selected
                                                                            ? 'font-medium'
                                                                            : 'font-normal'
                                                                    }`}
                                                                >
                                                                    {
                                                                        option.display
                                                                    }
                                                                </span>
                                                                {selected ? (
                                                                    <span
                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                            active
                                                                                ? 'text-white'
                                                                                : 'text-primaryBlue'
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
                            <div className="grid grid-cols-3 sm:grid-cols-5 mx-2 sm:mx-8 gap-x-4 gap-y-4">
                                <div className="rounded-lg bg-white dark:bg-darkForeground text-black dark:text-white text-center flex flex-col items-center justify-between h-44 p-4">
                                    <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-lightForeground w-16 h-16 p-4">
                                        <BanknotesIcon className="h-8 w-8" />
                                    </div>
                                    <span className="text-2xl font-medium">
                                        ${metrics.revenue.toLocaleString()}
                                    </span>
                                    <span className="">Revenue</span>
                                </div>

                                <div className="rounded-lg bg-white dark:bg-darkForeground text-black dark:text-white text-center flex flex-col items-center justify-between h-44 p-4">
                                    <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-lightForeground w-16 h-16 p-4">
                                        <CursorArrowRaysIcon className="h-8 w-8" />
                                    </div>
                                    <span className="text-2xl font-medium">
                                        {metrics.visitors.toLocaleString()}
                                    </span>
                                    <span className="">Clicks</span>
                                </div>

                                <div className="rounded-lg bg-white dark:bg-darkForeground text-black dark:text-white text-center flex flex-col items-center justify-between h-44 p-4">
                                    <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-lightForeground w-16 h-16 p-4">
                                        <UserPlusIcon className="h-8 w-8" />
                                    </div>
                                    <span className="text-2xl font-medium">
                                        {metrics.leads.toLocaleString()}
                                    </span>
                                    <span className="">Leads</span>
                                </div>

                                <div className="rounded-lg bg-white dark:bg-darkForeground text-black dark:text-white text-center flex flex-col items-center justify-between h-44 p-4">
                                    <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-lightForeground w-16 h-16 p-4">
                                        <UserIcon className="h-8 w-8" />
                                    </div>
                                    <span className="text-2xl font-medium">
                                        {metrics.conversions.toLocaleString()}
                                    </span>
                                    <span className="">Customers</span>
                                </div>

                                <div className="rounded-lg bg-white dark:bg-darkForeground text-black dark:text-white text-center flex flex-col items-center justify-between h-44 p-4">
                                    <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-lightForeground w-16 h-16 p-4">
                                        <UserMinusIcon className="h-8 w-8" />
                                    </div>
                                    <span className="text-2xl font-medium">
                                        {metrics.churned.toLocaleString()}
                                    </span>
                                    <span className="">Churned</span>
                                </div>
                            </div>
                        </div>

                        <div className="shadow-lg rounded-lg p-8 space-y-4 text-black dark:text-white">
                            <div className="font-medium text-2xl mx-2 sm:mx-8">
                                Commissions
                            </div>
                            <div className="grid grid-cols-3 space-x-4 mx-2 sm:mx-8">
                                <div className="rounded-lg bg-white dark:bg-darkForeground text-center flex flex-col justify-between h-24 p-4">
                                    <span className="">Pending</span>
                                    <span className="text-2xl font-medium">
                                        $
                                        {(
                                            combinedCodes?.commissions
                                                .filter((c) => !c?.paid)
                                                .reduce(
                                                    (last, current) =>
                                                        last + current.amount,
                                                    0.0
                                                ) || 0
                                        ).toLocaleString()}
                                    </span>
                                </div>

                                <div className="rounded-lg bg-white dark:bg-darkForeground text-center flex flex-col justify-between h-24 p-4">
                                    <span className="">Paid</span>
                                    <span className="text-2xl font-medium">
                                        $
                                        {(
                                            combinedCodes?.commissions
                                                .filter((c) => c?.paid)
                                                .reduce(
                                                    (last, current) =>
                                                        last + current.amount,
                                                    0.0
                                                ) || 0
                                        ).toLocaleString()}
                                    </span>
                                </div>

                                <div className="rounded-lg bg-white dark:bg-darkForeground text-center flex flex-col justify-between h-24 p-4">
                                    <span className="">Total</span>
                                    <span className="text-2xl font-medium">
                                        $
                                        {(
                                            combinedCodes?.commissions.reduce(
                                                (last, current) =>
                                                    last + current.amount,
                                                0.0
                                            ) || 0
                                        ).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="shadow-lg rounded-lg p-8 space-y-4 text-black dark:text-white">
                            <div className="flex justify-between items-center mx-2 sm:mx-8">
                                <span className="font-medium text-2xl">
                                    Affiliates
                                </span>

                                <input
                                    onChange={(e) =>
                                        setAffiliateSearch(e.target.value)
                                    }
                                    type="text"
                                    className="block w-72 h-9 my-auto rounded-md border-0 py-1.5 dark:bg-darkForeground text-gray-900 dark:text-white shadow-sm placeholder:text-gray-400 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                                    placeholder="Search affiliates..."
                                />

                                <Listbox
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                >
                                    <div className="relative">
                                        <Listbox.Button className="h-8 relative w-48 cursor-default rounded-lg bg-white dark:bg-darkForeground text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pr-2">
                                                <ChevronUpDownIcon
                                                    className="h-5 w-5 text-gray-400"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                            <span className="px-8 py-2 text-sm text-gray-900 dark:text-white">
                                                {
                                                    dateOptions.find(
                                                        (d) =>
                                                            d.value ===
                                                            selectedDate
                                                    )?.display
                                                }
                                            </span>
                                        </Listbox.Button>
                                        <Transition
                                            as={Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <Listbox.Options className="z-10 absolute mt-1 max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-darkBackground py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                {dateOptions.map((option) => (
                                                    <Listbox.Option
                                                        key={option.value}
                                                        value={option.value}
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
                                                        {({
                                                            selected,
                                                            active,
                                                        }) => (
                                                            <>
                                                                <span
                                                                    className={`block truncate ${
                                                                        selected
                                                                            ? 'font-medium'
                                                                            : 'font-normal'
                                                                    }`}
                                                                >
                                                                    {
                                                                        option.display
                                                                    }
                                                                </span>
                                                                {selected ? (
                                                                    <span
                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                            active
                                                                                ? 'text-white'
                                                                                : 'text-primaryBlue'
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

                            <div className="w-[80vw] sm:w-auto overflow-x-auto">
                                <Table
                                    {...{
                                        items: searchedAffiliates.sort((a, b) =>
                                            b.dateCreated > a.dateCreated
                                                ? 1
                                                : -1
                                        ),
                                        tableData: {
                                            pageLength: 10,
                                            headers: [
                                                'Affiliate',
                                                'Date affiliated',
                                                'Access',
                                                'Stripe Connect',
                                                'Clicks',
                                                'Leads',
                                                'Customers',
                                                'Churned',
                                                'Revenue',
                                                'Commissions',
                                                'Actions',
                                            ],
                                            dataComponents: [
                                                ({ item }) => (
                                                    <div className="flex items-center">
                                                        <div className="h-11 w-11 flex-shrink-0">
                                                            <img
                                                                className="h-11 w-11 rounded-full"
                                                                src={
                                                                    item
                                                                        ?.creator
                                                                        ?.imageUrl
                                                                }
                                                            />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="font-medium text-gray-900 dark:text-white">
                                                                {
                                                                    item
                                                                        ?.creator
                                                                        ?.name
                                                                }
                                                            </div>
                                                            <div className="mt-1 text-gray-500">
                                                                {
                                                                    item
                                                                        ?.creator
                                                                        ?.email
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                                ({ item }) => (
                                                    <div className="text-sm font-medium flex items-center justify-center">
                                                        {new Date(
                                                            item.dateCreated
                                                        ).toLocaleDateString()}
                                                    </div>
                                                ),
                                                ({ item }) => (
                                                    <div className="text-sm font-medium flex items-center justify-center">
                                                        {_.capitalize(
                                                            item?.creator
                                                                ?.affiliateAccess
                                                        )}
                                                    </div>
                                                ),
                                                ({ item }) => (
                                                    <div className="text-sm font-medium flex items-center justify-center">
                                                        {item?.stripeId ? (
                                                            <CheckIcon className="h-6 w-6 text-primary" />
                                                        ) : (
                                                            <XMarkIcon className="h-6 w-6" />
                                                        )}
                                                    </div>
                                                ),
                                                ({ item }) => (
                                                    <div className="text-sm font-medium flex items-center justify-center">
                                                        {(
                                                            item?.visitors?.filter(
                                                                (m: any) =>
                                                                    m.dx >
                                                                    startDate
                                                            )?.length || 0
                                                        ).toLocaleString()}
                                                    </div>
                                                ),
                                                ({ item }) => (
                                                    <div className="text-sm font-medium flex items-center justify-center">
                                                        {(
                                                            item?.leads?.filter(
                                                                (m: any) =>
                                                                    m.dx >
                                                                    startDate
                                                            )?.length || 0
                                                        ).toLocaleString()}
                                                    </div>
                                                ),
                                                ({ item }) => (
                                                    <div className="text-sm font-medium flex items-center justify-center">
                                                        {(
                                                            item?.conversions?.filter(
                                                                (m: any) =>
                                                                    m.dx >
                                                                    startDate
                                                            )?.length || 0
                                                        ).toLocaleString()}
                                                    </div>
                                                ),
                                                ({ item }) => (
                                                    <div className="text-sm font-medium flex items-center justify-center">
                                                        {(
                                                            item?.churned?.filter(
                                                                (m: any) =>
                                                                    m.dx >
                                                                    startDate
                                                            )?.length || 0
                                                        ).toLocaleString()}
                                                    </div>
                                                ),
                                                ({ item }) => (
                                                    <div className="text-sm font-medium flex items-center justify-center">
                                                        $
                                                        {(
                                                            item?.revenue
                                                                ?.filter(
                                                                    (m: any) =>
                                                                        m.dx >
                                                                        startDate
                                                                )
                                                                ?.reduce(
                                                                    (
                                                                        last: any,
                                                                        curr: any
                                                                    ) =>
                                                                        last +
                                                                        curr.amount,
                                                                    0.0
                                                                ) || 0
                                                        ).toLocaleString()}
                                                    </div>
                                                ),
                                                ({ item }) => (
                                                    <div className="text-sm font-medium flex items-center justify-center">
                                                        $
                                                        {(
                                                            item?.commissions
                                                                ?.filter(
                                                                    (m: any) =>
                                                                        m.dx >
                                                                        startDate
                                                                )
                                                                ?.reduce(
                                                                    (
                                                                        last: any,
                                                                        curr: any
                                                                    ) =>
                                                                        last +
                                                                        curr.amount,
                                                                    0.0
                                                                ) || 0
                                                        ).toLocaleString()}
                                                    </div>
                                                ),
                                                ({ item }) => (
                                                    <div className="flex items-center justify-center space-x-4">
                                                        {/* <LifebuoyIcon
                                            onClick={() =>
                                                apiRequest(
                                                    'GET',
                                                    `/admin/users/${item.id}/impersonate`
                                                ).then((apiRes) => {
                                                    localData.set(
                                                        'impersonator',
                                                        localData.get('user')
                                                    );

                                                    authService.signOut();
                                                    authService
                                                        .getUser(
                                                            apiRes?.data?.token
                                                        )
                                                        .then(
                                                            (_) =>
                                                                (window.location.href =
                                                                    '/')
                                                        );

                                                    addNotification({
                                                        type: 'success',
                                                        title: 'Impersonating',
                                                        text: `You are now impersonating ${item?.email}.`,
                                                    });
                                                })
                                            }
                                            className="h-6 w-6 text-primary group-hover:text-gray-700 grow-0"
                                            aria-hidden="true"
                                            title="Impersonate"
                                        /> */}
                                                        {item?.creator?.id && (
                                                            <RoundButton
                                                                icon={
                                                                    LifebuoyIcon
                                                                }
                                                                name="Impersonate"
                                                                onClick={() =>
                                                                    apiRequest(
                                                                        'GET',
                                                                        `/admin/users/${item.creator.id}/impersonate`
                                                                    ).then(
                                                                        (
                                                                            apiRes
                                                                        ) => {
                                                                            localData.set(
                                                                                'impersonator',
                                                                                localData.get(
                                                                                    'user'
                                                                                )
                                                                            );

                                                                            authService.signOut();
                                                                            authService
                                                                                .getUser(
                                                                                    apiRes
                                                                                        ?.data
                                                                                        ?.token
                                                                                )
                                                                                .then(
                                                                                    (
                                                                                        _
                                                                                    ) =>
                                                                                        (window.location.href =
                                                                                            '/')
                                                                                );

                                                                            addNotification(
                                                                                {
                                                                                    type: 'success',
                                                                                    title: 'Impersonating',
                                                                                    text: `You are now impersonating ${item?.creator?.email}.`,
                                                                                }
                                                                            );
                                                                        }
                                                                    )
                                                                }
                                                            />
                                                        )}

                                                        {item.creator
                                                            .affiliateAccess ===
                                                        'active' ? (
                                                            <RoundButton
                                                                icon={
                                                                    LockClosedIcon
                                                                }
                                                                name="Suspend"
                                                                onClick={() =>
                                                                    apiRequest(
                                                                        'PATCH',
                                                                        `/affiliate/affiliates/${item.id}`,
                                                                        {
                                                                            affiliateAccess:
                                                                                'suspended',
                                                                        }
                                                                    )
                                                                        .then(
                                                                            (
                                                                                data
                                                                            ) => {
                                                                                if (
                                                                                    data.status ===
                                                                                    200
                                                                                )
                                                                                    setUpdate(
                                                                                        (
                                                                                            u
                                                                                        ) =>
                                                                                            u +
                                                                                            1
                                                                                    );
                                                                                addNotification(
                                                                                    {
                                                                                        title:
                                                                                            data.status ===
                                                                                            200
                                                                                                ? 'Affiliate suspended'
                                                                                                : 'Error suspending affiliate',
                                                                                        text:
                                                                                            data.status ===
                                                                                            200
                                                                                                ? 'Refresing your view...'
                                                                                                : 'Please try again later.',
                                                                                        type:
                                                                                            data.status ===
                                                                                            200
                                                                                                ? 'success'
                                                                                                : 'error',
                                                                                    }
                                                                                );
                                                                            }
                                                                        )
                                                                        .catch(
                                                                            () =>
                                                                                addNotification(
                                                                                    {
                                                                                        title: 'Error suspending affiliate',
                                                                                        text: 'Please try again later.',
                                                                                        type: 'error',
                                                                                    }
                                                                                )
                                                                        )
                                                                }
                                                            />
                                                        ) : (
                                                            <RoundButton
                                                                icon={
                                                                    LockOpenIcon
                                                                }
                                                                name="Unsuspend"
                                                                onClick={() =>
                                                                    apiRequest(
                                                                        'PATCH',
                                                                        `/affiliate/affiliates/${item.id}`,
                                                                        {
                                                                            affiliateAccess:
                                                                                'active',
                                                                        }
                                                                    )
                                                                        .then(
                                                                            (
                                                                                data
                                                                            ) => {
                                                                                if (
                                                                                    data.status ===
                                                                                    200
                                                                                )
                                                                                    setUpdate(
                                                                                        (
                                                                                            u
                                                                                        ) =>
                                                                                            u +
                                                                                            1
                                                                                    );
                                                                                addNotification(
                                                                                    {
                                                                                        title:
                                                                                            data.status ===
                                                                                            200
                                                                                                ? 'Affiliate unsuspended'
                                                                                                : 'Error unsuspending affiliate',
                                                                                        text:
                                                                                            data.status ===
                                                                                            200
                                                                                                ? 'Refresing your view...'
                                                                                                : 'Please try again later.',
                                                                                        type:
                                                                                            data.status ===
                                                                                            200
                                                                                                ? 'success'
                                                                                                : 'error',
                                                                                    }
                                                                                );
                                                                            }
                                                                        )
                                                                        .catch(
                                                                            () =>
                                                                                addNotification(
                                                                                    {
                                                                                        title: 'Error unsuspending affiliate',
                                                                                        text: 'Please try again later.',
                                                                                        type: 'error',
                                                                                    }
                                                                                )
                                                                        )
                                                                }
                                                            />
                                                        )}

                                                        {item.creator
                                                            .affiliateAccess ===
                                                        'active' ? (
                                                            <RoundButton
                                                                icon={PlusIcon}
                                                                name="Add commission"
                                                                onClick={() => {
                                                                    setSelectedCode(
                                                                        item
                                                                    );
                                                                    setShowAddModal(
                                                                        true
                                                                    );
                                                                }}
                                                            />
                                                        ) : null}
                                                    </div>
                                                ),
                                            ],
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <Transition.Root show={showAddModal} as={Fragment}>
                        <Dialog
                            as="div"
                            className="relative z-10"
                            onClose={setShowAddModal}
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
                                        <Dialog.Panel className="relative transform overflow-visible rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[25vw] sm:p-6">
                                            <div className="font-medium mb-4">
                                                Add commission to{' '}
                                                {selectedCode?.creator?.name}
                                            </div>

                                            <FormBuilder
                                                formHook={addForm}
                                                formName="addCommission"
                                                submitText="Add commission"
                                                postFunc={async (data: any) => {
                                                    const patchReq =
                                                        await apiRequest(
                                                            'PATCH',
                                                            `/affiliate/affiliates/${
                                                                selectedCode!.id
                                                            }`,
                                                            data
                                                        );

                                                    if (
                                                        patchReq.status === 200
                                                    ) {
                                                        setUpdate((u) => u + 1);

                                                        addNotification({
                                                            title: 'Commission added.',
                                                            text: 'Refresing your view...',
                                                            type: 'success',
                                                        });

                                                        addForm.reset();
                                                        return true;
                                                    } else return false;
                                                }}
                                            />
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </Dialog>
                    </Transition.Root>
                </>
            )}
        </>
    );
};

export default ManageAffiliates;
