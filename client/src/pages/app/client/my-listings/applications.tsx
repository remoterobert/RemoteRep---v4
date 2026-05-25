import type { NextPage } from 'next';
import {
    BookmarkIcon,
    BuildingOffice2Icon,
    ClipboardDocumentCheckIcon,
    ClockIcon,
    EnvelopeIcon,
    UserGroupIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as SolidBookmarkIcon } from '@heroicons/react/24/solid';
import { Fragment, useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';
import {
    ArrowTopRightOnSquareIcon,
    CheckIcon,
    ChevronUpDownIcon,
    MapPinIcon,
    XMarkIcon,
} from '@heroicons/react/20/solid';
import * as formFields from 'services/formFields';
import * as localData from 'services/localData';
import { useForm } from 'react-hook-form';
import { PageHeader } from 'components/commons/pageHeader';
import { FilterModal } from 'components/browseViews/filterModal';
import { useRouter } from 'next/router';
import { Listbox, Transition } from '@headlessui/react';

const BrowseSkillCard: React.FC<{
    k: string;
    v: string | string[];
    match?: boolean;
}> = ({ k, v, match }) => {
    return (
        <div
            className={`text-xs border-2 rounded-full shadow-sm p-2 ${
                match
                    ? 'bg-green-100 border-green-400'
                    : 'bg-white border-gray-400'
            } inline-flex`}
        >
            <span
                className={`font-medium ${
                    match ? 'text-green-900' : 'text-gray-900'
                }`}
            >{`${k}:`}</span>
            <span
                className={`ml-1 ${match ? 'text-green-700' : 'text-gray-700'}`}
            >
                {Array.isArray(v) ? v.join(', ') : v}
            </span>
        </div>
    );
};

const Applications: NextPage = () => {
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<any[]>([]);
    const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
    const [selectedApplication, setSelectedApplication] = useState<any>();
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<any>({});
    const [preferences, setPreferences] = useState<any>();
    const [listing, setListing] = useState<any>();
    const [user, setUser] = useState<any>();
    const [bookmarks, setBookmarks] = useState<string[]>([]);

    const filtersForm = useForm();

    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;

        setBookmarks(localData.get('user.clientData.bookmarkedTalent') || []);

        (async () => {
            if (router?.query?.id) {
                const listingReq = await apiRequest(
                    'GET',
                    `/client/listings/${router.query.id}`
                );

                setListing(listingReq?.data);

                const applicationsReq = await apiRequest(
                    'GET',
                    `/client/listings/${router.query.id}/applications`
                );

                if (applicationsReq?.data?.applications.length)
                    setApplications(applicationsReq.data.applications);

                setPreferences(
                    {
                        experience: listingReq?.data?.requirements,

                        goals: {
                            ...localData.get('user.clientData.profile'),
                            ...listingReq?.data?.details,
                        },
                    } || null
                );
            }

            setUser(localData.get('user'));

            setLoading(false);
        })();
    }, [router.isReady, router.query]);

    useEffect(() => {
        setFilteredApplications(
            applications.filter((a) => {
                let passed = true;

                const filterData = a?.talent?.talentData?.experience;

                if (
                    (filters.yearsOfExperience &&
                        filters.yearsOfExperience >
                            filterData.yearsOfExperience) ||
                    (filters.technologies &&
                        !filters.technologies
                            .split(', ')
                            .every((t: string) =>
                                filterData.technologies.includes(t)
                            )) ||
                    (filters.leadTypes &&
                        !filters.leadTypes
                            .split(', ')
                            .some((t: string) =>
                                filterData.leadTypes.includes(t)
                            )) ||
                    (filters.education &&
                        !filters.education
                            .split(', ')
                            .includes(filterData.education)) ||
                    (filters.salesRoles &&
                        !filters.salesRoles
                            .split(', ')
                            .some((s: string) =>
                                filterData.salesRoles.includes(s)
                            )) ||
                    (filters.industries &&
                        !filters.industries
                            .split(', ')
                            .some((i: string) =>
                                filterData.industries.includes(i)
                            )) ||
                    (filters.salesCycles &&
                        !filters.salesCycles
                            .split(', ')
                            .some((s: string) =>
                                filterData.salesCycles.includes(s)
                            )) ||
                    (filters.salesTypes &&
                        !filters.salesTypes
                            .split(', ')
                            .some((s: string) =>
                                filterData.salesTypes.includes(s)
                            )) ||
                    (filters.decisionMakers &&
                        !filters.decisionMakers
                            .split(', ')
                            .some((d: string) =>
                                filterData.decisionMakers.includes(d)
                            )) ||
                    (filters.dealAmounts &&
                        !filters.dealAmounts
                            .split(', ')
                            .some((d: string) =>
                                filterData.dealAmounts.includes(d)
                            )) ||
                    (filters.salesVolumes &&
                        !filters.salesVolumes
                            .split(', ')
                            .some((s: string) =>
                                filterData.salesVolumes.includes(s)
                            )) ||
                    (filters.salesEnvironments &&
                        !filters.salesEnvironments
                            .split(', ')
                            .some((s: string) =>
                                filterData.salesEnvironments.includes(s)
                            ))
                )
                    passed = false;

                return passed;
            })
        );
    }, [applications, filters]);

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
    };

    return (
        <>
            {/* Common header */}
            <PageHeader {...{ title: 'Applications', icon: UserGroupIcon }} />

            {/* Page-specific content */}
            {listing && (
                <div className="h-[20vh] w-[40vw] mx-auto bg-white shadow-xl rounded-xl w-full">
                    <div className="border-b border-gray-200 bg-white py-4 rounded-t-xl">
                        <h3 className="text-center text-sm font-semibold text-gray-900">
                            Displaying applications for your listing...
                        </h3>
                    </div>

                    <div className="flex justify-between px-4 py-4">
                        <div className="inline-flex">
                            <img
                                src={user?.clientData?.profile?.photoUrl}
                                className="h-24 w-24 rounded-full"
                            />

                            <div className="ml-4 font-medium text-gray-900 flex items-center">
                                <div>
                                    <div>
                                        <span className="text-2xl">
                                            {listing.title}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <span className="mt- text-lg whitespace-nowrap">
                                            {user?.contact?.companyName}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-sm inline-flex text-gray-700">
                                            <MapPinIcon className="my-auto h-4 w-4 text-gray-700" />
                                            {[
                                                user?.contact?.addressCity,
                                                user?.contact?.addressState,
                                                user?.contact?.addressCountry,
                                            ].join(', ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full grid grid-cols-5 p-16">
                <div className="col-span-3">
                    <div className="h-[10vh] w-[50vw] p-8 bg-gray-900 rounded-t-xl flex items-center justify-between gap-x-8">
                        <span className="text-white font-semibold whitespace-nowrap grow-0">
                            Applications ({filteredApplications.length})
                        </span>

                        <div className="-mt-6 h-full flex gap-2 items-center flex-wrap">
                            {Object.entries(filters).map(([k, v]) => {
                                if (v)
                                    return (
                                        <div
                                            key={k}
                                            onClick={() => removeFilter(k)}
                                            className="relative group text-xs border-2 rounded-full shadow-sm py-1 px-2 bg-white inline-flex hover:bg-red-50 hover:border-red-400"
                                        >
                                            <span className="ml-1 text-gray-700 whitespace-nowrap">{`${
                                                (
                                                    formFields.get(
                                                        'talentFilters'
                                                    ) as any[]
                                                ).find((f: any) => f.name === k)
                                                    .label
                                            }:`}</span>
                                            <span className="ml-1 text-gray-700 whitespace-nowrap">
                                                {(() => {
                                                    const val = Array.isArray(
                                                        v as any
                                                    )
                                                        ? (v as any).join(', ')
                                                        : v;

                                                    return val.length > 20
                                                        ? val.slice(0, 17) +
                                                              '...'
                                                        : val;
                                                })()}
                                            </span>
                                            <XMarkIcon className="my-auto h-4 w-4 text-gray-400 group-hover:text-red-400" />
                                        </div>
                                    );
                            })}
                        </div>

                        <span
                            onClick={() => setShowFilters(true)}
                            className="whitespace-nowrap grow-0 py-1 px-4 bg-white rounded-lg text-gray-900 font-semibold border-2 border-solid border-gray-200 shadow-sm hover:shadow-md"
                        >
                            Filter applications
                        </span>
                    </div>
                    <div className="grid h-[60vh] w-[50vw] space-y-8 p-8 bg-gray-50 overflow-y-scroll scrollbar-thin rounded-b-xl">
                        {loading && (
                            <div className="flex items-center justify-center">
                                <ClockIcon className="h-8 w-8 text-gray-900" />
                            </div>
                        )}

                        {!loading &&
                            filteredApplications.map((a, i) => {
                                return (
                                    <div
                                        key={i}
                                        onClick={() =>
                                            setSelectedApplication(a)
                                        }
                                        className="bg-white shadow-xl rounded-xl w-full"
                                    >
                                        <div className="px-4 py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="inline-flex">
                                                    <img
                                                        src={
                                                            a?.talent
                                                                ?.talentData
                                                                ?.profile
                                                                ?.photoUrl
                                                        }
                                                        className="h-16 w-16 rounded-full"
                                                    />

                                                    <div className="ml-4 font-medium text-gray-900 flex items-center">
                                                        <div>
                                                            <span className="mt- text-lg whitespace-nowrap inline-flex">
                                                                {`${a?.talent?.contact?.firstName} ${a?.talent?.contact?.lastName}`}
                                                                {bookmarks.includes(
                                                                    a?.talent
                                                                        ?.id
                                                                ) && (
                                                                    <SolidBookmarkIcon className="ml-2 my-auto h-6 w-6 text-primary" />
                                                                )}
                                                            </span>
                                                            <div className="mt-2">
                                                                <span className="text-sm inline-flex text-gray-700">
                                                                    <MapPinIcon className="my-auto h-4 w-4 text-gray-700" />
                                                                    {[
                                                                        a
                                                                            ?.talent
                                                                            ?.contact
                                                                            ?.addressCity,
                                                                        a
                                                                            ?.talent
                                                                            ?.contact
                                                                            ?.addressState,
                                                                        a
                                                                            ?.talent
                                                                            ?.contact
                                                                            ?.addressCountry,
                                                                    ].join(
                                                                        ', '
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-center items-center px-16">
                                                    <span
                                                        className={`px-4 py-2 rounded-md border-2 ${
                                                            (a.applicationStatus ===
                                                                'invited' ||
                                                                a.applicationStatus ===
                                                                    'applied') &&
                                                            'bg-gray-200 border-gray-400 text-gray-700'
                                                        } ${
                                                            a.applicationStatus ===
                                                                'interviewing' &&
                                                            'bg-blue-200 border-blue-400 text-blue-700'
                                                        } ${
                                                            a.applicationStatus ===
                                                                'shortlisted' &&
                                                            'bg-purple-200 border-purple-400 text-purple-700'
                                                        } ${
                                                            a.applicationStatus ===
                                                                'hired' &&
                                                            'bg-green-200 border-green-400 text-green-700'
                                                        }`}
                                                    >
                                                        {`${a.applicationStatus[0].toUpperCase()}${a.applicationStatus.slice(
                                                            1
                                                        )}`}
                                                    </span>
                                                </div>
                                            </div>

                                            {a?.applicationMessage && (
                                                <div className="mt-4 mb-2 w-full flex items-center gap-2 px-4">
                                                    <p className="text-md">
                                                        <span className="font-medium">
                                                            Message from
                                                            applicant:{' '}
                                                        </span>
                                                        {a.applicationMessage}
                                                    </p>
                                                </div>
                                            )}

                                            {preferences?.experience && (
                                                <div className="mt-2 w-full flex items-center gap-2 px-4">
                                                    <div className="py-2 flex flex-wrap gap-2">
                                                        {Object.entries(
                                                            a.talent.talentData
                                                                .experience
                                                        ).map(([k, v]: any) => {
                                                            return (k ===
                                                                'yearsOfExperience' &&
                                                                a?.talent
                                                                    .talentData
                                                                    .experience
                                                                    .yearsOfExperience >
                                                                    preferences
                                                                        .experience
                                                                        .yearsOfExperience) ||
                                                                (k ===
                                                                    'technologies' &&
                                                                    !a?.talent.talentData.experience.technologies.every(
                                                                        (
                                                                            t: string
                                                                        ) =>
                                                                            preferences.experience.technologies.includes(
                                                                                t
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'leadTypes' &&
                                                                    !a?.talent.talentData.experience.leadTypes.some(
                                                                        (
                                                                            t: string
                                                                        ) =>
                                                                            preferences.experience.leadTypes.includes(
                                                                                t
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'education' &&
                                                                    !a?.talent.talentData.experience.education.includes(
                                                                        preferences
                                                                            .experience
                                                                            .education
                                                                    )) ||
                                                                (k ===
                                                                    'salesRoles' &&
                                                                    !a?.talent.talentData.experience.salesRoles.some(
                                                                        (
                                                                            s: string
                                                                        ) =>
                                                                            preferences.experience.salesRoles.includes(
                                                                                s
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'industries' &&
                                                                    !a?.talent.talentData.experience.industries.some(
                                                                        (
                                                                            i: string
                                                                        ) =>
                                                                            preferences.experience.industries.includes(
                                                                                i
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'salesCycles' &&
                                                                    !a?.talent.talentData.experience.salesCycles.some(
                                                                        (
                                                                            s: string
                                                                        ) =>
                                                                            preferences.experience.salesCycles.includes(
                                                                                s
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'salesTypes' &&
                                                                    !a?.talent.talentData.experience.salesTypes.some(
                                                                        (
                                                                            s: string
                                                                        ) =>
                                                                            preferences.experience.salesTypes.includes(
                                                                                s
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'decisionMakers' &&
                                                                    !a?.talent.talentData.experience.decisionMakers.some(
                                                                        (
                                                                            d: string
                                                                        ) =>
                                                                            preferences.experience.decisionMakers.includes(
                                                                                d
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'dealAmounts' &&
                                                                    !a?.talent.talentData.experience.dealAmounts.some(
                                                                        (
                                                                            d: string
                                                                        ) =>
                                                                            preferences.experience.dealAmounts.includes(
                                                                                d
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'salesVolumes' &&
                                                                    !a?.talent.talentData.experience.salesVolumes.some(
                                                                        (
                                                                            s: string
                                                                        ) =>
                                                                            preferences.experience.salesVolumes.includes(
                                                                                s
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'salesEnvironments' &&
                                                                    !a?.talent.talentData.experience.salesEnvironments.some(
                                                                        (
                                                                            s: string
                                                                        ) =>
                                                                            preferences.experience.salesEnvironments.includes(
                                                                                s
                                                                            )
                                                                    )) ? null : v ? (
                                                                <BrowseSkillCard
                                                                    {...{
                                                                        k: (
                                                                            formFields.get(
                                                                                'talentExperience'
                                                                            ) as any[]
                                                                        ).find(
                                                                            (
                                                                                f: any
                                                                            ) =>
                                                                                f.name ===
                                                                                k
                                                                        ).label,
                                                                        v,
                                                                        match: true,
                                                                    }}
                                                                />
                                                            ) : null;
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
                <div className="col-span-2">
                    <div
                        className={`${
                            selectedApplication
                                ? 'border-solid border-gray-900'
                                : 'border-dashed border-gray-400'
                        } h-[70vh] border-2 flex items-center justify-center rounded-xl`}
                    >
                        {!selectedApplication && (
                            <span className="font-medium text-lg text-gray-400">
                                Please select an application to view in detail.
                            </span>
                        )}

                        {selectedApplication && (
                            <div className="h-full w-full bg-white shadow-xl rounded-xl w-full overflow-y-auto scrollbar-thin overflow-x-hidden">
                                <div className="w-full flex justify-between px-4 py-4">
                                    <div className="inline-flex">
                                        <img
                                            src={
                                                selectedApplication?.talent
                                                    ?.talentData?.profile
                                                    ?.photoUrl
                                            }
                                            className="h-24 w-24 rounded-full"
                                        />

                                        <div className="ml-4 font-medium text-gray-900 flex items-center">
                                            <div>
                                                <div className="mt-2">
                                                    <span className="mt- text-lg whitespace-nowrap">
                                                        {`${selectedApplication?.talent?.contact?.firstName} ${selectedApplication?.talent?.contact?.lastName}`}
                                                    </span>
                                                </div>
                                                <div className="mt-2">
                                                    <span className="text-sm inline-flex text-gray-700">
                                                        <MapPinIcon className="my-auto h-4 w-4 text-gray-700" />
                                                        {[
                                                            selectedApplication
                                                                ?.talent
                                                                ?.contact
                                                                ?.addressCity,
                                                            selectedApplication
                                                                ?.talent
                                                                ?.contact
                                                                ?.addressState,
                                                            selectedApplication
                                                                ?.talent
                                                                ?.contact
                                                                ?.addressCountry,
                                                        ].join(', ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="min-h-full flex justify-center items-center gap-2 px-4">
                                        <div className="w-48">
                                            {selectedApplication.applicationStatus ===
                                            'invited' ? (
                                                <input
                                                    {...{
                                                        type: 'text',
                                                        className:
                                                            'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500',
                                                        disabled: true,
                                                        value: `${selectedApplication.applicationStatus[0].toUpperCase()}${selectedApplication.applicationStatus.slice(
                                                            1
                                                        )}`,
                                                    }}
                                                />
                                            ) : (
                                                <Listbox
                                                    value={
                                                        selectedApplication.applicationStatus
                                                    }
                                                    onChange={(data) =>
                                                        apiRequest(
                                                            'PATCH',
                                                            `/client/listings/${router.query.id}/applications`,
                                                            {
                                                                talentId:
                                                                    selectedApplication
                                                                        .talent
                                                                        .id,
                                                                applicationStatus:
                                                                    data,
                                                            }
                                                        ).then((data) => {
                                                            setApplications(
                                                                data?.data
                                                                    ?.applications
                                                            );
                                                            setSelectedApplication(
                                                                data?.data?.applications?.find(
                                                                    (aa: any) =>
                                                                        aa
                                                                            .talent
                                                                            .id ===
                                                                        selectedApplication
                                                                            .talent
                                                                            .id
                                                                )
                                                            );
                                                        })
                                                    }
                                                >
                                                    <div className="relative">
                                                        <Listbox.Button className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                                                            <span className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                                                {`${selectedApplication.applicationStatus[0].toUpperCase()}${selectedApplication.applicationStatus.slice(
                                                                    1
                                                                )}`}
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
                                                                {[
                                                                    'applied',
                                                                    'interviewing',
                                                                    'shortlisted',
                                                                    'hired',
                                                                ].map(
                                                                    (
                                                                        option,
                                                                        i
                                                                    ) => (
                                                                        <Listbox.Option
                                                                            key={
                                                                                i
                                                                            }
                                                                            value={
                                                                                option
                                                                            }
                                                                            className={({
                                                                                active,
                                                                            }) =>
                                                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                                    active
                                                                                        ? 'bg-primary text-white'
                                                                                        : 'text-gray-900'
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
                                                                                        {`${option[0].toUpperCase()}${option.slice(
                                                                                            1
                                                                                        )}`}
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
                                                                    )
                                                                )}
                                                            </Listbox.Options>
                                                        </Transition>
                                                    </div>
                                                </Listbox>
                                            )}
                                        </div>
                                        <div className="group flex items-center justify-center rounded-full border-2 border-solid border-gray-200 p-2 shadow-sm hover:shadow-md">
                                            <EnvelopeIcon
                                                onClick={() =>
                                                    router.push(
                                                        `/app/client/chats?target=${selectedApplication.talent.id}`
                                                    )
                                                }
                                                className="h-6 w-6 text-gray-500 group-hover:text-gray-700"
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <div className="group flex items-center justify-center rounded-full border-2 border-solid border-gray-200 p-2 shadow-sm hover:shadow-md">
                                            {bookmarks.includes(
                                                selectedApplication?.talent.id
                                            ) ? (
                                                <SolidBookmarkIcon
                                                    onClick={() =>
                                                        bookmark(
                                                            selectedApplication
                                                                ?.talent.id,
                                                            false
                                                        )
                                                    }
                                                    className="h-6 w-6 text-primary group-hover:text-gray-700"
                                                    aria-hidden="true"
                                                />
                                            ) : (
                                                <BookmarkIcon
                                                    onClick={() =>
                                                        bookmark(
                                                            selectedApplication
                                                                ?.talent.id,
                                                            true
                                                        )
                                                    }
                                                    className="h-6 w-6 text-gray-500 group-hover:text-gray-700"
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {selectedApplication?.applicationMessage && (
                                    <>
                                        <div className="relative">
                                            <div
                                                className="absolute inset-0 flex items-center"
                                                aria-hidden="true"
                                            >
                                                <div className="w-full border-t border-gray-300" />
                                            </div>
                                            <div className="relative flex">
                                                <span className="ml-8 bg-white px-3 text-base font-semibold leading-6 text-gray-900">
                                                    Message from applicant
                                                </span>
                                            </div>
                                        </div>
                                        <div className="px-8 py-2">
                                            <p className="break-words whitespace-pre-wrap">
                                                {
                                                    selectedApplication?.applicationMessage
                                                }
                                            </p>
                                        </div>
                                    </>
                                )}

                                {selectedApplication?.talent?.talentData
                                    ?.profile?.about && (
                                    <>
                                        <div className="relative">
                                            <div
                                                className="absolute inset-0 flex items-center"
                                                aria-hidden="true"
                                            >
                                                <div className="w-full border-t border-gray-300" />
                                            </div>
                                            <div className="relative flex">
                                                <span className="ml-8 bg-white px-3 text-base font-semibold leading-6 text-gray-900">
                                                    Description
                                                </span>
                                            </div>
                                        </div>
                                        <div className="px-8 py-2">
                                            <h3 className="font-medium inline-flex">
                                                {selectedApplication?.talent
                                                    ?.talentData?.profile
                                                    ?.headline
                                                    ? `${selectedApplication?.talent?.talentData?.profile?.headline} `
                                                    : null}
                                                {selectedApplication?.talent
                                                    ?.talentData?.profile
                                                    ?.videoUrl ? (
                                                    <span className="ml-2">
                                                        |{' '}
                                                        <span
                                                            className="text-primary hover:underline inline-flex items-center"
                                                            onClick={() =>
                                                                window.open(
                                                                    selectedApplication
                                                                        ?.talent
                                                                        ?.talentData
                                                                        ?.profile
                                                                        ?.videoUrl,
                                                                    '_blank'
                                                                )
                                                            }
                                                        >
                                                            Introduction video{' '}
                                                            <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4 text-primary" />
                                                        </span>
                                                    </span>
                                                ) : null}
                                            </h3>
                                            <p className="mt-2 break-words whitespace-pre-wrap">
                                                {
                                                    selectedApplication?.talent
                                                        ?.talentData?.profile
                                                        ?.about
                                                }
                                            </p>
                                        </div>
                                    </>
                                )}

                                {selectedApplication?.talent?.talentData
                                    ?.experience &&
                                    Object.values(
                                        selectedApplication?.talent?.talentData
                                            ?.experience
                                    ).some((v: any) => v) && (
                                        <>
                                            <div className="relative">
                                                <div
                                                    className="absolute inset-0 flex items-center"
                                                    aria-hidden="true"
                                                >
                                                    <div className="w-full border-t border-gray-300" />
                                                </div>
                                                <div className="relative flex">
                                                    <span className="ml-8 bg-white px-3 text-base font-semibold leading-6 text-gray-900">
                                                        Experience
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="px-8 py-2">
                                                {selectedApplication?.talent
                                                    ?.talentData?.experience ? (
                                                    <>
                                                        <div className="py-2 flex flex-wrap gap-2">
                                                            {Object.entries(
                                                                selectedApplication
                                                                    ?.talent
                                                                    ?.talentData
                                                                    ?.experience
                                                            ).map(
                                                                ([
                                                                    k,
                                                                    v,
                                                                ]: any) => {
                                                                    return v ? (
                                                                        <BrowseSkillCard
                                                                            {...{
                                                                                k: (
                                                                                    formFields.get(
                                                                                        'talentExperience'
                                                                                    ) as any[]
                                                                                ).find(
                                                                                    (
                                                                                        f: any
                                                                                    ) =>
                                                                                        f.name ===
                                                                                        k
                                                                                )
                                                                                    .label,
                                                                                v,
                                                                                match:
                                                                                    preferences &&
                                                                                    !(
                                                                                        (k ===
                                                                                            'yearsOfExperience' &&
                                                                                            preferences
                                                                                                .experience
                                                                                                .yearsOfExperience >
                                                                                                selectedApplication
                                                                                                    ?.talent
                                                                                                    .talentData
                                                                                                    .experience
                                                                                                    .yearsOfExperience) ||
                                                                                        (k ===
                                                                                            'technologies' &&
                                                                                            !preferences.experience.technologies.every(
                                                                                                (
                                                                                                    t: string
                                                                                                ) =>
                                                                                                    selectedApplication?.talent.talentData.experience.technologies.includes(
                                                                                                        t
                                                                                                    )
                                                                                            )) ||
                                                                                        (k ===
                                                                                            'leadTypes' &&
                                                                                            !preferences.experience.leadTypes.some(
                                                                                                (
                                                                                                    t: string
                                                                                                ) =>
                                                                                                    selectedApplication?.talent.talentData.experience.leadTypes.includes(
                                                                                                        t
                                                                                                    )
                                                                                            )) ||
                                                                                        (k ===
                                                                                            'education' &&
                                                                                            !preferences.experience.education.includes(
                                                                                                selectedApplication
                                                                                                    ?.talent
                                                                                                    .talentData
                                                                                                    .experience
                                                                                                    .education
                                                                                            )) ||
                                                                                        (k ===
                                                                                            'salesRoles' &&
                                                                                            !preferences.experience.salesRoles.some(
                                                                                                (
                                                                                                    s: string
                                                                                                ) =>
                                                                                                    selectedApplication?.talent.talentData.experience.salesRoles.includes(
                                                                                                        s
                                                                                                    )
                                                                                            )) ||
                                                                                        (k ===
                                                                                            'industries' &&
                                                                                            !preferences.experience.industries.some(
                                                                                                (
                                                                                                    i: string
                                                                                                ) =>
                                                                                                    selectedApplication?.talent.talentData.experience.industries.includes(
                                                                                                        i
                                                                                                    )
                                                                                            )) ||
                                                                                        (k ===
                                                                                            'salesCycles' &&
                                                                                            !preferences.experience.salesCycles.some(
                                                                                                (
                                                                                                    s: string
                                                                                                ) =>
                                                                                                    selectedApplication?.talent.talentData.experience.salesCycles.includes(
                                                                                                        s
                                                                                                    )
                                                                                            )) ||
                                                                                        (k ===
                                                                                            'salesTypes' &&
                                                                                            !preferences.experience.salesTypes.some(
                                                                                                (
                                                                                                    s: string
                                                                                                ) =>
                                                                                                    selectedApplication?.talent.talentData.experience.salesTypes.includes(
                                                                                                        s
                                                                                                    )
                                                                                            )) ||
                                                                                        (k ===
                                                                                            'decisionMakers' &&
                                                                                            !preferences.experience.decisionMakers.some(
                                                                                                (
                                                                                                    d: string
                                                                                                ) =>
                                                                                                    selectedApplication?.talent.talentData.experience.decisionMakers.includes(
                                                                                                        d
                                                                                                    )
                                                                                            )) ||
                                                                                        (k ===
                                                                                            'dealAmounts' &&
                                                                                            !preferences.experience.dealAmounts.some(
                                                                                                (
                                                                                                    d: string
                                                                                                ) =>
                                                                                                    selectedApplication?.talent.talentData.experience.dealAmounts.includes(
                                                                                                        d
                                                                                                    )
                                                                                            )) ||
                                                                                        (k ===
                                                                                            'salesVolumes' &&
                                                                                            !preferences.experience.salesVolumes.some(
                                                                                                (
                                                                                                    s: string
                                                                                                ) =>
                                                                                                    selectedApplication?.talent.talentData.experience.salesVolumes.includes(
                                                                                                        s
                                                                                                    )
                                                                                            )) ||
                                                                                        (k ===
                                                                                            'salesEnvironments' &&
                                                                                            !preferences.experience.salesEnvironments.some(
                                                                                                (
                                                                                                    s: string
                                                                                                ) =>
                                                                                                    selectedApplication?.talent.talentData.experience.salesEnvironments.includes(
                                                                                                        s
                                                                                                    )
                                                                                            ))
                                                                                    ),
                                                                            }}
                                                                        />
                                                                    ) : null;
                                                                }
                                                            )}
                                                        </div>
                                                    </>
                                                ) : null}
                                            </div>
                                        </>
                                    )}

                                {Object.values(
                                    selectedApplication?.talent?.talentData
                                        ?.goals
                                )?.some((v) => v) && (
                                    <>
                                        <div className="relative">
                                            <div
                                                className="absolute inset-0 flex items-center"
                                                aria-hidden="true"
                                            >
                                                <div className="w-full border-t border-gray-300" />
                                            </div>
                                            <div className="relative flex">
                                                <span className="ml-8 bg-white px-3 text-base font-semibold leading-6 text-gray-900">
                                                    Goals
                                                </span>
                                            </div>
                                        </div>
                                        <div className="px-8 py-2">
                                            {selectedApplication?.talent
                                                ?.talentData?.goals ? (
                                                <>
                                                    <div className="py-2 flex flex-wrap gap-2">
                                                        {Object.entries(
                                                            selectedApplication
                                                                ?.talent
                                                                ?.talentData
                                                                ?.goals
                                                        ).map(([k, v]: any) => {
                                                            return v ? (
                                                                <BrowseSkillCard
                                                                    {...{
                                                                        k: (
                                                                            formFields.get(
                                                                                'talentGoals'
                                                                            ) as any[]
                                                                        ).find(
                                                                            (
                                                                                f: any
                                                                            ) =>
                                                                                f.name ===
                                                                                k
                                                                        ).label,
                                                                        v,
                                                                        match:
                                                                            preferences &&
                                                                            !(
                                                                                (k ==
                                                                                    'salesRole' &&
                                                                                    preferences
                                                                                        .goals
                                                                                        .salesRoles &&
                                                                                    !preferences.goals.salesRoles.includes(
                                                                                        selectedApplication
                                                                                            ?.talent
                                                                                            .talentData
                                                                                            .goals
                                                                                            .salesRole
                                                                                    )) ||
                                                                                (k ==
                                                                                    'commitment' &&
                                                                                    preferences
                                                                                        .goals
                                                                                        .commitments &&
                                                                                    !preferences.goals.commitments.includes(
                                                                                        selectedApplication
                                                                                            ?.talent
                                                                                            .talentData
                                                                                            .goals
                                                                                            .commitment
                                                                                    )) ||
                                                                                (k ==
                                                                                    'compensationType' &&
                                                                                    preferences
                                                                                        .goals
                                                                                        .compensationTypes &&
                                                                                    !preferences.goals.compensationTypes.includes(
                                                                                        selectedApplication
                                                                                            ?.talent
                                                                                            .talentData
                                                                                            .goals
                                                                                            .compensationType
                                                                                    )) ||
                                                                                (k ==
                                                                                    'benefits' &&
                                                                                    preferences
                                                                                        .goals
                                                                                        .benefits &&
                                                                                    !preferences.goals.benefits.every(
                                                                                        (
                                                                                            b: string
                                                                                        ) =>
                                                                                            selectedApplication?.talent.talentData.goals.benefits.includes(
                                                                                                b
                                                                                            )
                                                                                    )) ||
                                                                                (k ==
                                                                                    'minimumCompensation' &&
                                                                                    preferences
                                                                                        .goals
                                                                                        .minimumCompensation &&
                                                                                    preferences
                                                                                        .goals
                                                                                        .minimumCompensation >
                                                                                        selectedApplication
                                                                                            ?.talent
                                                                                            .talentData
                                                                                            .goals
                                                                                            .minimumCompensation)
                                                                            ),
                                                                    }}
                                                                />
                                                            ) : null;
                                                        })}
                                                    </div>
                                                </>
                                            ) : null}
                                        </div>
                                    </>
                                )}
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
        </>
    );
};

export default Applications;
