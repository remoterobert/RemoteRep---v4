import {
    BanknotesIcon,
    CheckIcon,
    ClockIcon,
    CursorArrowRaysIcon,
    NoSymbolIcon,
    UserIcon,
    UserMinusIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import Table from 'components/tables/table';
import { useNotification } from 'contexts/NotificationContext';
import { Fragment, useEffect, useMemo, useState } from 'react';
import AffiliateAgreement from './affiliateAgreement';
import { Transition, Dialog, Listbox } from '@headlessui/react';
import apiRequest from 'services/apiRequest';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

const CommonAffiliateContent: React.FC<{}> = ({}) => {
    const [loading, setLoading] = useState(true);
    const [affiliateAccess, setAffiliateAccess] = useState('inactive');
    const [showAgreementModal, setShowAgreementModal] = useState(false);
    const [code, setCode] = useState<{
        id: string;
        creator: string;
        visitors: { dx: number }[];
        leads: { id: string; dx: number }[];
        conversions: { id: string; dx: number }[];
        churned: { id: string; dx: number }[];
        revenue: { amount: number; dx: number }[];
        commissions: { amount: number; dx: number; paid?: boolean }[];
        stripeId?: string;
        dateCreated: number;
        dateUpdated: number;
    }>();
    const [startDate, setStartDate] = useState(0);
    const [selectedDate, setSelectedDate] = useState('a');
    const dateOptions = [
        { value: '7d', display: 'Last 7 days' },
        { value: '4w', display: 'Last 4 weeks' },
        { value: 'a', display: 'All time' },
    ];
    const [referredClients, setReferredClients] = useState([]);
    const [referredTalent, setReferredTalent] = useState([]);
    const [clientSearch, setClientSearch] = useState('');
    const [talentSearch, setTalentSearch] = useState('');
    const [referredLoaded, setReferredLoaded] = useState(false);

    const { addNotification } = useNotification();

    const refreshAccessAndCodes = async () => {
        const accessReq = await apiRequest('GET', '/affiliate/access');

        if (accessReq.status === 200) {
            setAffiliateAccess(accessReq?.data?.affiliateAccess);

            if (accessReq?.data?.affiliateAccess === 'active') {
                const codeReq = await apiRequest('GET', '/affiliate/code');

                console.log(codeReq);

                if (codeReq.status === 200 && codeReq?.data?.code)
                    setCode(codeReq.data.code);
            }
        }
    };

    const refreshReferred = async () => {
        const referredReq = await apiRequest('GET', '/affiliate/referred');

        setReferredClients(referredReq?.data?.referredClients || []);
        setReferredTalent(referredReq?.data?.referredTalent || []);
    };

    useEffect(() => {
        refreshAccessAndCodes().then(() => {
            setLoading(false);

            refreshReferred().then(() => setReferredLoaded(true));
        });
    }, []);

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

    const searchedClients = useMemo(
        () =>
            referredClients.filter((c: any) =>
                clientSearch
                    ? c.name.toLowerCase().includes(clientSearch.toLowerCase())
                    : true
            ),
        [clientSearch, referredClients]
    );

    const searchedTalent = useMemo(
        () =>
            referredTalent.filter((c: any) =>
                talentSearch
                    ? c.name.toLowerCase().includes(talentSearch.toLowerCase())
                    : true
            ),
        [talentSearch, referredTalent]
    );

    const metrics = useMemo(
        () => ({
            visitors:
                code?.visitors.filter((m) => m.dx > startDate).length || 0,
            leads: code?.leads.filter((m) => m.dx > startDate).length || 0,
            conversions:
                code?.conversions.filter((m) => m.dx > startDate).length || 0,
            churned: code?.churned.filter((m) => m.dx > startDate).length || 0,
            revenue:
                code?.revenue
                    .filter((m) => m.dx > startDate)
                    .reduce((last, current) => last + current.amount, 0.0) || 0,
        }),
        [code, startDate]
    );

    return (
        <>
            {loading ? (
                <>
                    <div className="flex justify-center h-[100vh] dark:bg-darkBackground pt-8">
                        <ClockIcon className="h-8 w-8 text-gray-900 dark:text-white" />
                    </div>
                </>
            ) : affiliateAccess === 'active' ? (
                <>
                    <div className="p-4 grid space-y-4 bg-background dark:bg-darkBackground">
                        <div className="shadow-lg rounded-lg p-8 space-y-4 bg-white dark:bg-darkForeground">
                            <div className="mx-2 sm:mx-8 text-black dark:text-white">
                                <span className="font-medium text-2xl my-auto">
                                    Stripe Connect
                                </span>

                                <div className="mt-4 w-full flex flex-col sm:flex-row justify-between items-center space-y-2">
                                    <span className="text-sm font-medium">
                                        {code?.stripeId
                                            ? 'View your Stripe Express dashboard'
                                            : 'Link your account to Stripe Connect to be able to receive commission payments.'}
                                    </span>

                                    <button
                                        onClick={async () => {
                                            if (code?.stripeId) {
                                                const connectReq =
                                                    await apiRequest(
                                                        'GET',
                                                        '/affiliate/connect'
                                                    );

                                                if (
                                                    connectReq.status === 200 &&
                                                    connectReq?.data?.url
                                                )
                                                    window.open(
                                                        connectReq.data.url,
                                                        '_blank'
                                                    );
                                                else
                                                    addNotification({
                                                        title: 'Error logging into Stripe Express',
                                                        text: 'Please try again later...',
                                                        type: 'error',
                                                    });
                                            } else {
                                                const connectReq =
                                                    await apiRequest(
                                                        'POST',
                                                        '/affiliate/connect',
                                                        {}
                                                    );

                                                if (
                                                    connectReq.status === 201 &&
                                                    connectReq?.data?.url
                                                )
                                                    // window.location.href =
                                                    //     connectReq.data.url;
                                                    window.open(connectReq.data.url, '_blank');

                                                else
                                                    addNotification({
                                                        title: 'Error creating Stripe Connect account',
                                                        text: 'Please try again later...',
                                                        type: 'error',
                                                    });
                                            }
                                        }}
                                        className="text-sm inline-flex w-48 items-center justify-center rounded-md bg-primaryBlue px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm hover:filter hover:brightness-[95%] sm:col-start-1 sm:mt-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                    >
                                        {code?.stripeId
                                            ? 'View dashboard'
                                            : 'Link account'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="shadow-lg rounded-lg p-8 space-y-4 bg-white dark:bg-darkForeground">
                            <div className="mx-2 sm:mx-8 text-black dark:text-white">
                                <span className="font-medium text-2xl my-auto">
                                    Your link
                                </span>

                                <div className="mt-4 w-full flex flex-col sm:flex-row justify-between items-center space-y-2">
                                    <span className="text-sm font-medium">
                                        {`${window.location.origin}/r/${code?.id}`}
                                    </span>

                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                `${window.location.origin}/r/${code?.id}`
                                            );

                                            addNotification({
                                                text: 'Your referral link has been copied to your clipboard',
                                                title: 'Link copied',
                                                type: 'success',
                                            });
                                        }}
                                        className="text-sm inline-flex w-48 items-center justify-center rounded-md bg-primaryBlue px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm hover:filter hover:brightness-[95%] sm:col-start-1 sm:mt-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                    >
                                        Copy link
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="shadow-lg rounded-lg p-8 space-y-4 bg-white dark:bg-darkForeground">
                            <div className="flex justify-between items-center mx-2 sm:mx-8 text-black dark:text-white">
                                <span className="font-medium text-2xl">
                                    Metrics
                                </span>

                                <Listbox
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                >
                                    <div className="relative">
                                        <Listbox.Button className="h-8 relative w-48 cursor-default rounded-lg bg-background dark:bg-lightForeground text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
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
                                            <Listbox.Options className="z-10 absolute mt-1 max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-darkForeground py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
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
                            <div className="grid grid-cols-3 sm:grid-cols-5 mx-2 sm:mx-8 gap-x-4 gap-y-4">
                                <div className="rounded-lg bg-background dark:bg-lightForeground text-black dark:text-white text-center flex flex-col items-center justify-between h-44 p-4">
                                    <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-darkForeground w-16 h-16 p-4">
                                        <BanknotesIcon className="h-8 w-8 text-black dark:text-white" />
                                    </div>
                                    <span className="text-2xl font-medium">
                                        ${metrics.revenue.toLocaleString()}
                                    </span>
                                    <span className="">Revenue</span>
                                </div>

                                <div className="rounded-lg bg-background dark:bg-lightForeground text-black dark:text-white text-center flex flex-col items-center justify-between h-44 p-4">
                                    <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-darkForeground w-16 h-16 p-4">
                                        <CursorArrowRaysIcon className="h-8 w-8 text-black dark:text-white" />
                                    </div>
                                    <span className="text-2xl font-medium">
                                        {metrics.visitors.toLocaleString()}
                                    </span>
                                    <span className="">Clicks</span>
                                </div>

                                <div className="rounded-lg bg-background dark:bg-lightForeground text-black dark:text-white text-center flex flex-col items-center justify-between h-44 p-4">
                                    <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-darkForeground w-16 h-16 p-4">
                                        <UserPlusIcon className="h-8 w-8 text-black dark:text-white" />
                                    </div>
                                    <span className="text-2xl font-medium">
                                        {metrics.leads.toLocaleString()}
                                    </span>
                                    <span className="">Leads</span>
                                </div>

                                <div className="rounded-lg bg-background dark:bg-lightForeground text-black dark:text-white text-center flex flex-col items-center justify-between h-44 p-4">
                                    <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-darkForeground w-16 h-16 p-4">
                                        <UserIcon className="h-8 w-8 text-black dark:text-white" />
                                    </div>
                                    <span className="text-2xl font-medium">
                                        {metrics.conversions.toLocaleString()}
                                    </span>
                                    <span className="">Customers</span>
                                </div>

                                <div className="rounded-lg bg-background dark:bg-lightForeground text-black dark:text-white text-center flex flex-col items-center justify-between h-44 p-4">
                                    <div className="flex items-center justify-center rounded-full bg-gray-200 dark:bg-darkForeground w-16 h-16 p-4">
                                        <UserMinusIcon className="h-8 w-8 text-black dark:text-white" />
                                    </div>
                                    <span className="text-2xl font-medium">
                                        {metrics.churned.toLocaleString()}
                                    </span>
                                    <span className="">Churned</span>
                                </div>
                            </div>
                        </div>

                        <div className="shadow-lg rounded-lg p-8 space-y-4 bg-white dark:bg-darkForeground text-black dark:text-white">
                            <div className="font-medium text-2xl mx-2 sm:mx-8">
                                Commissions
                            </div>
                            <div className="grid grid-cols-3 space-x-4 mx-2 sm:mx-8">
                                <div className="rounded-lg bg-background dark:bg-lightForeground text-center flex flex-col justify-between h-24 p-4">
                                    <span className="">Pending</span>
                                    <span className="text-2xl font-medium">
                                        $
                                        {(
                                            code?.commissions
                                                .filter((c) => !c?.paid)
                                                .reduce(
                                                    (last, current) =>
                                                        last + current.amount,
                                                    0.0
                                                ) || 0
                                        ).toLocaleString()}
                                    </span>
                                </div>

                                <div className="rounded-lg bg-background dark:bg-lightForeground text-center flex flex-col justify-between h-24 p-4">
                                    <span className="">Paid</span>
                                    <span className="text-2xl font-medium">
                                        $
                                        {(
                                            code?.commissions
                                                .filter((c) => c?.paid)
                                                .reduce(
                                                    (last, current) =>
                                                        last + current.amount,
                                                    0.0
                                                ) || 0
                                        ).toLocaleString()}
                                    </span>
                                </div>

                                <div className="rounded-lg bg-background dark:bg-lightForeground text-center flex flex-col justify-between h-24 p-4">
                                    <span className="">Total</span>
                                    <span className="text-2xl font-medium">
                                        $
                                        {(
                                            code?.commissions.reduce(
                                                (last, current) =>
                                                    last + current.amount,
                                                0.0
                                            ) || 0
                                        ).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="shadow-lg rounded-lg p-8 space-y-4">
                            <div className="flex justify-between items-center mx-2 sm:mx-8 text-black dark:text-white">
                                <span className="font-medium text-2xl">
                                    Referred clients
                                </span>

                                <input
                                    onChange={(e) =>
                                        setClientSearch(e.target.value)
                                    }
                                    type="text"
                                    className="outline-none block w-48 sm:w-72 h-9 my-auto rounded-md border-0 py-1.5 dark:bg-lightForeground text-gray-900 dark:text-white shadow-sm placeholder:text-gray-400 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                                    placeholder="Search clients..."
                                />
                            </div>

                            {referredLoaded ? (
                                <div className="w-[80vw] sm:w-auto overflow-x-auto">
                                    <Table
                                        {...{
                                            items: searchedClients,
                                            tableData: {
                                                pageLength: 10,
                                                headers: [
                                                    'Name',
                                                    'Date registered',
                                                    'Listings',
                                                    'Hires',
                                                    'Revenue',
                                                    'Commissions',
                                                ],
                                                dataComponents: [
                                                    ({ item }) => (
                                                        <div className="text-sm font-medium flex items-center justify-center">
                                                            {item.name}
                                                        </div>
                                                    ),
                                                    ({ item }) => (
                                                        <div className="text-sm font-medium flex items-center justify-center">
                                                            {new Date(
                                                                item.dx
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    ),
                                                    ({ item }) => (
                                                        <div className="text-sm font-medium flex items-center justify-center">
                                                            {item.listings.toLocaleString()}
                                                        </div>
                                                    ),
                                                    ({ item }) => (
                                                        <div className="text-sm font-medium flex items-center justify-center">
                                                            {item.hires.toLocaleString()}
                                                        </div>
                                                    ),
                                                    ({ item }) => (
                                                        <div className="text-sm font-medium flex items-center justify-center">
                                                            $
                                                            {item.revenue.toLocaleString()}
                                                        </div>
                                                    ),
                                                    ({ item }) => (
                                                        <div className="text-sm font-medium flex items-center justify-center">
                                                            $
                                                            {item.commissions.toLocaleString()}
                                                        </div>
                                                    ),
                                                ],
                                            },
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="w-full flex items-center justify-center">
                                    <ClockIcon className="m-2 h-8 w-8 text-primary" />
                                </div>
                            )}
                        </div>

                        <div className="shadow-lg rounded-lg p-8 space-y-4">
                            <div className="flex justify-between items-center mx-2 sm:mx-8 text-black dark:text-white">
                                <span className="font-medium text-2xl">
                                    Referred talent
                                </span>

                                <input
                                    onChange={(e) =>
                                        setTalentSearch(e.target.value)
                                    }
                                    type="text"
                                    className="block w-48 sm:w-72 h-9 my-auto rounded-md border-0 py-1.5 dark:bg-lightForeground text-gray-900 dark:text-white shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                                    placeholder="Search talent..."
                                />
                            </div>

                            {referredLoaded ? (
                                <div className="w-[80vw] sm:w-auto overflow-x-auto">
                                    <Table
                                        {...{
                                            items: searchedTalent,
                                            tableData: {
                                                pageLength: 10,
                                                headers: [
                                                    'Name',
                                                    'Date registered',
                                                    'Applications',
                                                    'Hired',
                                                    'Revenue',
                                                    'Commissions',
                                                ],
                                                dataComponents: [
                                                    ({ item }) => (
                                                        <div className="text-sm font-medium flex items-center justify-center">
                                                            {item.name}
                                                        </div>
                                                    ),
                                                    ({ item }) => (
                                                        <div className="text-sm font-medium flex items-center justify-center">
                                                            {new Date(
                                                                item.dx
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    ),
                                                    ({ item }) => (
                                                        <div className="text-sm font-medium flex items-center justify-center">
                                                            {item.applications.toLocaleString()}
                                                        </div>
                                                    ),
                                                    ({ item }) => (
                                                        <div className="text-sm font-medium flex items-center justify-center">
                                                            {item.hired.toLocaleString()}
                                                        </div>
                                                    ),
                                                    ({ item }) => (
                                                        <div className="text-sm font-medium flex items-center justify-center">
                                                            $
                                                            {item.revenue.toLocaleString()}
                                                        </div>
                                                    ),
                                                    ({ item }) => (
                                                        <div className="text-sm font-medium flex items-center justify-center">
                                                            $
                                                            {item.commissions.toLocaleString()}
                                                        </div>
                                                    ),
                                                ],
                                            },
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="w-full flex items-center justify-center">
                                    <ClockIcon className="m-2 h-8 w-8 text-primary" />
                                </div>
                            )}
                        </div>

                        <div className="shadow-lg rounded-lg p-8 space-y-4">
                            <div className="flex justify-between items-center mx-2 sm:mx-8 text-black dark:text-white">
                                <span className="font-medium text-2xl my-auto">
                                    Affiliate agreement
                                </span>

                                <button
                                    onClick={() => setShowAgreementModal(true)}
                                    className="text-2xl h-12 inline-flex w-48 items-center justify-center rounded-md bg-primaryBlue px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm hover:filter hover:brightness-[95%] sm:col-start-1 sm:mt-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                >
                                    View agreement
                                </button>
                            </div>
                        </div>
                    </div>

                    <Transition.Root show={showAgreementModal} as={Fragment}>
                        <Dialog
                            as="div"
                            className="relative z-30"
                            onClose={setShowAgreementModal}
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
                                        <Dialog.Panel className="relative transform overflow-visible rounded-lg bg-white dark:bg-darkBackground px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[25vw] sm:p-6">
                                            <div className="font-medium text-2xl text-black dark:text-white">
                                                Affiliate agreement
                                            </div>

                                            <div className="mt-4 h-[50vh] lg:h-[60vh] overflow-y-scroll scrollbar-thin border-2 rounded-lg p-4 bg-white dark:bg-darkBackground">
                                                <AffiliateAgreement />
                                            </div>

                                            <div className="mt-5 sm:mt-6">
                                                <button
                                                    type="button"
                                                    className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                                    onClick={() =>
                                                        setShowAgreementModal(
                                                            false
                                                        )
                                                    }
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </Dialog>
                    </Transition.Root>
                </>
            ) : affiliateAccess === 'suspended' ? (
                <div className="p-4 grid space-x-8">
                    <div className="shadow-lg rounded-lg p-8 space-y-4">
                        <div className="font-medium text-2xl">
                            Affiliate access suspended
                        </div>
                        <div className="text-gray-900">
                            Please send an email to support@remoterep.com if you
                            think this was a mistake.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 grid space-x-8 text-black dark:text-white">
                    <div className="shadow-lg rounded-lg p-8 space-y-4">
                        <div className="font-medium text-2xl">
                            Affiliate onboarding
                        </div>
                        <div className="text-gray-900 dark:text-white">
                            Please read and accept the Affiliate Agreement.
                        </div>
                        <div className="h-[50vh] lg:h-[60vh] overflow-y-scroll scrollbar-thin border-2 rounded-lg p-4">
                            <AffiliateAgreement />
                        </div>
                        <div className="w-full flex justify-end space-x-4">
                            <div className="text-sm text-gray-900 my-auto dark:text-white">
                                By clicking Accept and continue you agree to the
                                Affiliate Agreement.
                            </div>
                            <button
                                onClick={async () => {
                                    const activateReq = await apiRequest(
                                        'GET',
                                        '/affiliate/activate'
                                    );

                                    if (activateReq.status !== 200) {
                                        addNotification({
                                            title: 'Error accepting the agreement',
                                            text: 'Please try again later',
                                            type: 'error',
                                        });
                                    }

                                    refreshAccessAndCodes();
                                }}
                                className="my-auto inline-flex w-64 min-w-max h-12 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm hover:filter hover:brightness-[95%] sm:col-start-1 sm:mt-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                            >
                                Accept and continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CommonAffiliateContent;
