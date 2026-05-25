import type { NextPage } from 'next';
import {
    BookmarkIcon,
    CheckCircleIcon,
    ClipboardDocumentCheckIcon,
    DocumentPlusIcon,
    EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as localData from '../../../services/localData';
import { CheckIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/20/solid';
import FormBuilder from '../../../components/forms/formBuilder';
import apiRequest from '../../../services/apiRequest';
import { Transition } from '@headlessui/react';
import * as formFields from '../../../services/formFields';
import { useRouter } from 'next/router';
import _ from 'lodash';
import { PageHeader } from 'components/commons/pageHeader';
import { Details, Requirements, Talent } from 'types';
import { getMatchScore } from 'services/utils/getMatchScore';
import { transformData } from 'services/utils/transformData';

const SkillCard: React.FC<{ k: string; v: string }> = ({ k, v }) => {
    return (
        <div className="text-xs border-2 rounded-full shadow-sm p-2 bg-white inline-flex">
            <span className="font-medium text-gray-900">{`${k}:`}</span>
            <span className="ml-1 text-gray-700">{v}</span>
        </div>
    );
};

const CreateListing: NextPage = () => {
    const [activeStage, setActiveStage] = useState('basics');
    const [completeSubmitting, setCompleteSubmitting] = useState(false);
    const [completeSaved, setCompleteSaved] = useState(false);
    const [listingData, setListingData] = useState<any>({});
    const [listingId, setListingId] = useState<string>();
    const [clientAccess, setClientAccess] = useState<{
        access: boolean;
        type?: 'listing' | 'legacy' | 'all' | 'privileged';
    }>();
    const [hasFirstListing, setHasFirstListing] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);

    const [user, setUser] = useState<any>({});

    const router = useRouter();

    const basicsForm = useForm();
    const basicsData = basicsForm.watch();
    const instructionsForm = useForm();
    const instructionsData = instructionsForm.watch();
    const requirementsForm = useForm();
    const requirementsData = requirementsForm.watch();
    const detailsForm = useForm();
    const detailsData = detailsForm.watch();

    const [matches, setMatches] = useState(0);
    const [scoreInfo, setScoreInfo] = useState(0);
    const [matchIds, setMatchIds] = useState([]);

    useEffect(() => {
        setUser(localData.get('user'));

        (async () => {
            const accessRes = await apiRequest('GET', '/client/access');

            setClientAccess((accessRes.data as any) || { access: false });

            if (
                accessRes?.data?.type &&
                ['all', 'privileged'].includes(accessRes.data.type)
            )
                return;

            const res = await apiRequest('GET', '/client/listings');

            setHasFirstListing(!!res?.data?.listings?.length);

            const unpaidListings = res?.data?.listings
                ?.filter(
                    (l: any) => l?.hasOwnProperty('paidFor') && !l?.paidFor
                )
                .sort((a: any, b: any) => b?.dateCreated - a?.dateCreated);

            if (!unpaidListings?.length) return;

            setActiveStage('payment');

            const lastUnpaidListing = unpaidListings[0];

            const { title, description, calendarLink, instructions } =
                lastUnpaidListing;

            Object.entries({
                title,
                description,
            }).forEach(([k, v]) => basicsForm.setValue(k, v));

            Object.entries({
                calendarLink,
                instructions,
            }).forEach(([k, v]) => v && instructionsForm.setValue(k, v));

            Object.entries(lastUnpaidListing.requirements).forEach(
                ([k, v]) => v && requirementsForm.setValue(k, v)
            );

            Object.entries(lastUnpaidListing.details).forEach(
                ([k, v]) => v && detailsForm.setValue(k, v)
            );

            setListingId(lastUnpaidListing.id);
        })();
    }, []);

    const getMatches = async () => {
        const talentReq = await apiRequest('GET', '/client/talent');

        if (talentReq?.data?.talent.length) {
            const talents = talentReq?.data.talent;

            const transformedRequirementsData = transformData(
                Object.keys(requirementsData),
                requirementsData
            );
            const transformedDetailsData = transformData(
                Object.keys(detailsData),
                detailsData
            );

            const filteredTalents = talents.filter((t: Talent) => {
                let passed = false;

                const filterData = t?.talentData?.experience;

                if (
                    transformedRequirementsData?.yearsOfExperience <=
                        filterData?.yearsOfExperience ||
                    (transformedRequirementsData.technologies &&
                        transformedRequirementsData.technologies.every(
                            (t: string) => filterData.technologies?.includes(t)
                        )) ||
                    (transformedRequirementsData.leadTypes &&
                        transformedRequirementsData.leadTypes.some(
                            (t: string) => filterData.leadTypes?.includes(t)
                        )) ||
                    (transformedRequirementsData.education &&
                        transformedRequirementsData.education?.includes(
                            filterData.education
                        )) ||
                    (transformedRequirementsData.salesRoles &&
                        transformedRequirementsData.salesRoles.some(
                            (s: string) => filterData.salesRoles?.includes(s)
                        )) ||
                    (transformedRequirementsData.industries &&
                        transformedRequirementsData.industries.some(
                            (i: string) => filterData.industries?.includes(i)
                        )) ||
                    (transformedRequirementsData.salesCycles &&
                        transformedRequirementsData.salesCycles.some(
                            (s: string) => filterData.salesCycles?.includes(s)
                        )) ||
                    (transformedRequirementsData.salesTypes &&
                        transformedRequirementsData.salesTypes.some(
                            (s: string) => filterData.salesTypes?.includes(s)
                        )) ||
                    (transformedRequirementsData.decisionMakers &&
                        transformedRequirementsData.decisionMakers.some(
                            (d: string) =>
                                filterData.decisionMakers?.includes(d)
                        )) ||
                    (transformedRequirementsData.dealAmounts &&
                        transformedRequirementsData.dealAmounts.some(
                            (d: string) => filterData.dealAmounts?.includes(d)
                        )) ||
                    (transformedRequirementsData.salesVolumes &&
                        transformedRequirementsData.salesVolumes.some(
                            (s: string) => filterData.salesVolumes?.includes(s)
                        )) ||
                    (transformedRequirementsData.salesEnvironments &&
                        transformedRequirementsData.salesEnvironments.some(
                            (s: string) =>
                                filterData.salesEnvironments?.includes(s)
                        ))
                ) {
                    passed = true;
                }

                return passed;
            });

            const sortedTalentsByMatchScore = filteredTalents
                .map((talent: Talent) => {
                    const matchScore = getMatchScore({
                        client: {
                            details: {
                                ...(transformedDetailsData as Details),
                                ...user.clientData.profile,
                            },
                            requirements:
                                transformedRequirementsData as Requirements,
                        },
                        talent: talent.talentData,
                    });

                    return {
                        ...talent,
                        matchScore: matchScore,
                    };
                })
                .sort(
                    (prev: any, next: any) => next.matchScore - prev.matchScore
                );

            const amountByMainPercent = sortedTalentsByMatchScore.filter(
                (talent: Talent) => talent.matchScore! >= 80
            ).length;

            if (amountByMainPercent > 0) {
                setMatchIds(
                    sortedTalentsByMatchScore
                        .filter((talent: Talent) => talent.matchScore! >= 80)
                        .map((t: Talent) => t.id)
                );
                setMatches(amountByMainPercent);
                setScoreInfo(80);
                setActiveStage('complete');
                return;
            } else {
                const amountBySecondaryPercent =
                    sortedTalentsByMatchScore.filter(
                        (talent: Talent) => talent.matchScore! >= 60
                    ).length;

                if (amountBySecondaryPercent > 0) {
                    setMatchIds(
                        sortedTalentsByMatchScore
                            .filter(
                                (talent: Talent) => talent.matchScore! >= 60
                            )
                            .map((t: Talent) => t.id)
                    );
                    setMatches(amountBySecondaryPercent);
                    setScoreInfo(60);
                    setActiveStage('complete');
                    return;
                } else {
                    const amountByThirdPercent =
                        sortedTalentsByMatchScore.filter(
                            (talent: Talent) => talent.matchScore! >= 40
                        ).length;
                    if (amountByThirdPercent > 0) {
                        setMatchIds(
                            sortedTalentsByMatchScore
                                .filter(
                                    (talent: Talent) => talent.matchScore! >= 40
                                )
                                .map((t: Talent) => t.id)
                        );
                        setMatches(amountByThirdPercent);
                        setScoreInfo(40);
                        setActiveStage('complete');
                        return;
                    } else {
                        setMatchIds([]);
                        setMatches(0);
                        setScoreInfo(0);
                        setActiveStage('complete');
                        return;
                    }
                }
            }
        }
    };

    return (
        <>
            {/* Common header */}
            <PageHeader
                {...{ title: 'Create listing', icon: DocumentPlusIcon }}
            />

            {/* Page-specific content */}

            <div className="w-full h-full grid grid-cols-5 p-16 gap-x-8">
                <div className="col-span-3 h-[60vh] items-center justify-center hidden md:flex">
                    <div className="bg-white shadow-xl rounded-xl w-[80vw] md:w-[40vw]">
                        <div className="border-b border-gray-200 bg-white py-4 rounded-t-xl">
                            <h3 className="text-center text-sm font-semibold text-gray-900">
                                This is how applicants will see your listing.
                            </h3>
                        </div>

                        <div className="w-full flex justify-between px-4 py-4">
                            <div className="inline-flex">
                                <img
                                    src={user?.clientData?.profile?.photoUrl}
                                    className="h-24 w-24 rounded-full"
                                />

                                <div className="ml-4 font-medium text-gray-900 flex items-center">
                                    <div>
                                        <div>
                                            <span className="text-2xl">
                                                {basicsData?.title}
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="mt- text-lg">
                                                {user?.contact?.companyName}
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-sm inline-flex text-gray-700">
                                                <MapPinIcon className="my-auto h-4 w-4 text-gray-700" />
                                                {[
                                                    user?.contact?.addressCity,
                                                    user?.contact?.addressState,
                                                    user?.contact
                                                        ?.addressCountry,
                                                ].join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="min-h-full flex justify-center items-center gap-2 px-4">
                                <div className="group flex items-center justify-center rounded-full border-2 border-solid border-gray-200 p-2 shadow-sm hover:shadow-md">
                                    <EnvelopeIcon
                                        onClick={() => {}}
                                        className="h-6 w-6 text-gray-500 group-hover:text-gray-700"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="group flex items-center justify-center rounded-full border-2 border-solid border-gray-200 p-2 shadow-sm hover:shadow-md">
                                    <ClipboardDocumentCheckIcon
                                        onClick={() => {}}
                                        className="h-6 w-6 text-gray-500 group-hover:text-gray-700"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="group flex items-center justify-center rounded-full border-2 border-solid border-gray-200 p-2 shadow-sm hover:shadow-md">
                                    <BookmarkIcon
                                        className="h-6 w-6 text-gray-500 group-hover:text-gray-700"
                                        aria-hidden="true"
                                    />
                                </div>
                            </div>
                        </div>

                        {basicsData?.description && (
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
                                    <p className="mt-2 break-words whitespace-pre-wrap">
                                        {basicsData?.description}
                                    </p>
                                </div>
                            </>
                        )}

                        {instructionsData?.instructions && (
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
                                            Application instructions
                                        </span>
                                    </div>
                                </div>
                                <div className="px-8 py-2">
                                    <p className="mt-2 break-words whitespace-pre-wrap">
                                        {instructionsData?.instructions}
                                    </p>
                                </div>
                            </>
                        )}

                        {detailsData &&
                            Object.values(detailsData).some((v: any) => v) && (
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
                                                Details
                                            </span>
                                        </div>
                                    </div>
                                    <div className="px-8 py-2">
                                        {detailsData ? (
                                            <>
                                                <div className="py-2 flex flex-wrap gap-2">
                                                    {Object.entries(
                                                        detailsData
                                                    ).map(([k, v]: any) => {
                                                        return v ? (
                                                            <SkillCard
                                                                {...{
                                                                    k: (
                                                                        formFields.get(
                                                                            'listingDetails'
                                                                        ) as any[]
                                                                    ).find(
                                                                        (
                                                                            f: any
                                                                        ) =>
                                                                            f.name ===
                                                                            k
                                                                    ).label,
                                                                    v,
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

                        {requirementsData &&
                            Object.values(requirementsData).some(
                                (v: any) => v
                            ) && (
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
                                                Requirements
                                            </span>
                                        </div>
                                    </div>
                                    <div className="px-8 py-2">
                                        {requirementsData ? (
                                            <>
                                                <div className="py-2 flex flex-wrap gap-2">
                                                    {Object.entries(
                                                        requirementsData
                                                    ).map(([k, v]: any) => {
                                                        return v ? (
                                                            <SkillCard
                                                                {...{
                                                                    k: (
                                                                        formFields.get(
                                                                            'listingRequirements'
                                                                        ) as any[]
                                                                    ).find(
                                                                        (
                                                                            f: any
                                                                        ) =>
                                                                            f.name ===
                                                                            k
                                                                    ).label,
                                                                    v,
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
                </div>

                <div className="col-span-5 md:col-span-2 h-[60vh] flex items-center justify-center">
                    <Transition
                        appear={true}
                        show={activeStage === 'basics'}
                        enter="transition transform duration-300"
                        enterFrom="opacity-0 translate-y-[5vh]"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition transform duration-300"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 -translate-y-[5vh]"
                    >
                        <div
                            className={`${
                                activeStage !== 'basics' && 'hidden '
                            }bg-white shadow-xl rounded-xl w-[80vw] md:w-[30vw]`}
                        >
                            <div className="border-b border-gray-200 bg-white py-4 rounded-t-xl">
                                <h3 className="text-center text-sm font-semibold text-gray-900">
                                    This information will be displayed publicly.
                                </h3>
                            </div>

                            <div className="px-4 py-5 sm:px-6">
                                <span className="text-xl font-medium text-gray-900">
                                    Let's create your listing.
                                </span>

                                <div className="mt-4">
                                    <FormBuilder
                                        {...{
                                            formHook: basicsForm,
                                            formName: 'listingBasics',
                                            submitText: 'Save and continue',
                                            postFunc: async (data) => {
                                                setListingData({
                                                    ...listingData,
                                                    basics: Object.fromEntries(
                                                        Object.entries(
                                                            data
                                                        ).map(([k, v]) => {
                                                            if (!_.isNil(v))
                                                                return (
                                                                    formFields.get(
                                                                        'listingBasics'
                                                                    ) as any[]
                                                                ).find(
                                                                    (f: any) =>
                                                                        f.name ===
                                                                        k
                                                                ).type ===
                                                                    'multiselect'
                                                                    ? [
                                                                          k,
                                                                          (
                                                                              v as string
                                                                          ).split(
                                                                              ', '
                                                                          ),
                                                                      ]
                                                                    : [k, v];
                                                            else return [];
                                                        })
                                                    ),
                                                });

                                                setTimeout(
                                                    () =>
                                                        setActiveStage(
                                                            'instructions'
                                                        ),
                                                    1000
                                                );

                                                return true;
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Transition>

                    <Transition
                        appear={true}
                        show={activeStage === 'instructions'}
                        enter="transition transform duration-300"
                        enterFrom="opacity-0 translate-y-[5vh]"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition transform duration-300"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 -translate-y-[5vh]"
                    >
                        <div
                            className={`${
                                activeStage !== 'instructions' && 'hidden '
                            }bg-white shadow-xl rounded-xl w-[80vw] md:w-[30vw]`}
                        >
                            <div className="border-b border-gray-200 bg-white py-4 rounded-t-xl">
                                <h3 className="text-center text-sm font-semibold text-gray-900">
                                    This information will be displayed publicly.
                                    Your calendar link will only be shared with
                                    applicants you invite to interview.
                                </h3>
                            </div>

                            <div className="px-4 py-5 sm:px-6">
                                <span className="text-xl font-medium text-gray-900">
                                    Anything we should let applicants know?
                                </span>

                                <div className="mt-4">
                                    <FormBuilder
                                        {...{
                                            formHook: instructionsForm,
                                            formName: 'listingInstructions',
                                            submitText: 'Save and continue',
                                            postFunc: async (data) => {
                                                setListingData({
                                                    ...listingData,
                                                    instructions:
                                                        Object.fromEntries(
                                                            Object.entries(
                                                                data
                                                            ).map(([k, v]) => {
                                                                if (!_.isNil(v))
                                                                    return (
                                                                        formFields.get(
                                                                            'listingInstructions'
                                                                        ) as any[]
                                                                    ).find(
                                                                        (
                                                                            f: any
                                                                        ) =>
                                                                            f.name ===
                                                                            k
                                                                    ).type ===
                                                                        'multiselect'
                                                                        ? [
                                                                              k,
                                                                              (
                                                                                  v as string
                                                                              ).split(
                                                                                  ', '
                                                                              ),
                                                                          ]
                                                                        : [
                                                                              k,
                                                                              v,
                                                                          ];
                                                                else return [];
                                                            })
                                                        ),
                                                });

                                                setTimeout(
                                                    () =>
                                                        setActiveStage(
                                                            'details'
                                                        ),
                                                    1000
                                                );

                                                return true;
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Transition>

                    <Transition
                        show={activeStage === 'details'}
                        enter="transition transform duration-300"
                        enterFrom="opacity-0 translate-y-[5vh]"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition transform duration-300"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 -translate-y-[5vh]"
                    >
                        <div
                            className={`${
                                activeStage !== 'details' && 'hidden '
                            }bg-white shadow-xl rounded-xl w-[80vw] md:w-[30vw]`}
                        >
                            <div className="border-b border-gray-200 bg-white py-4 rounded-t-xl">
                                <h3 className="text-center text-sm font-semibold text-gray-900">
                                    This information will be displayed publicly.
                                </h3>
                            </div>

                            <div className="px-4 py-5 sm:px-6">
                                <span className="text-xl font-medium text-gray-900">
                                    Give us the details.
                                </span>

                                <div className="mt-4">
                                    <FormBuilder
                                        {...{
                                            formHook: detailsForm,
                                            formName: 'listingDetails',
                                            submitText: 'Save and continue',
                                            postFunc: async (data) => {
                                                setListingData({
                                                    ...listingData,
                                                    details: Object.fromEntries(
                                                        Object.entries(
                                                            data
                                                        ).map(([k, v]) => {
                                                            if (!_.isNil(v))
                                                                return (
                                                                    formFields.get(
                                                                        'listingDetails'
                                                                    ) as any[]
                                                                ).find(
                                                                    (f: any) =>
                                                                        f.name ===
                                                                        k
                                                                ).type ===
                                                                    'multiselect'
                                                                    ? [
                                                                          k,
                                                                          (
                                                                              v as string
                                                                          ).split(
                                                                              ', '
                                                                          ),
                                                                      ]
                                                                    : [k, v];
                                                            else return [];
                                                        })
                                                    ),
                                                });

                                                setTimeout(
                                                    () =>
                                                        setActiveStage(
                                                            'requirements'
                                                        ),
                                                    1000
                                                );

                                                return true;
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Transition>

                    <Transition
                        show={activeStage === 'requirements'}
                        enter="transition transform duration-300"
                        enterFrom="opacity-0 translate-y-[5vh]"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition transform duration-300"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 -translate-y-[5vh]"
                    >
                        <div
                            className={`${
                                activeStage !== 'requirements' && 'hidden '
                            }bg-white shadow-xl rounded-xl w-[80vw] md:w-[30vw]`}
                        >
                            <div className="border-b border-gray-200 bg-white py-4 rounded-t-xl">
                                <h3 className="text-center text-sm font-semibold text-gray-900">
                                    This information will be displayed publicly.
                                </h3>
                            </div>

                            <div className="px-4 py-5 sm:px-6">
                                <span className="text-xl font-medium text-gray-900">
                                    What are you looking for?
                                </span>

                                <div className="mt-4">
                                    <FormBuilder
                                        {...{
                                            formHook: requirementsForm,
                                            formName: 'listingRequirements',
                                            submitText: 'Save and continue',
                                            postFunc: async (data) => {
                                                setListingData({
                                                    ...listingData,
                                                    requirements:
                                                        Object.fromEntries(
                                                            Object.entries(
                                                                data
                                                            ).map(([k, v]) => {
                                                                if (!_.isNil(v))
                                                                    return (
                                                                        formFields.get(
                                                                            'listingRequirements'
                                                                        ) as any[]
                                                                    ).find(
                                                                        (
                                                                            f: any
                                                                        ) =>
                                                                            f.name ===
                                                                            k
                                                                    ).type ===
                                                                        'multiselect'
                                                                        ? [
                                                                              k,
                                                                              (
                                                                                  v as string
                                                                              ).split(
                                                                                  ', '
                                                                              ),
                                                                          ]
                                                                        : [
                                                                              k,
                                                                              v,
                                                                          ];
                                                                else return [];
                                                            })
                                                        ),
                                                });

                                                getMatches();

                                                return true;
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Transition>

                    <Transition
                        show={activeStage === 'complete'}
                        enter="transition transform duration-300"
                        enterFrom="opacity-0 translate-y-[5vh]"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition transform duration-300"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 -translate-y-[5vh]"
                    >
                        <div className="bg-white shadow-xl rounded-xl w-[80vw] md:w-[30vw]">
                            <div className="border-b border-gray-200 bg-white py-4 rounded-t-xl">
                                <h3 className="text-center text-sm font-semibold text-gray-900">
                                    That's all.
                                </h3>
                            </div>

                            <div className="px-4 py-5 sm:px-6">
                                <span className="text-xl font-medium text-gray-900">
                                    {matches > 0 ? (
                                        <>
                                            We've found{' '}
                                            <span className="text-primary font-semibold">
                                                {matches}
                                            </span>{' '}
                                            talent profiles with a match score
                                            over{' '}
                                            <span className="text-primary font-semibold">
                                                {scoreInfo}%
                                            </span>
                                            .
                                        </>
                                    ) : (
                                        <>
                                            We've found no talent that matches
                                            this listing's requirements.
                                        </>
                                    )}
                                </span>

                                <div className="mt-4 w-full space-y-2">
                                    {!!(
                                        !hasFirstListing ||
                                        (clientAccess?.type &&
                                            ['all', 'privileged'].includes(
                                                clientAccess.type
                                            ))
                                    ) && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!matchIds.length) {
                                                    setBookmarked(true);
                                                    return;
                                                }

                                                const bookmarkReq =
                                                    await apiRequest(
                                                        'POST',
                                                        '/client/bulk-bookmark',
                                                        { talentIds: matchIds }
                                                    );

                                                if (bookmarkReq.status === 200)
                                                    setBookmarked(true);
                                            }}
                                            className="inline-flex w-full h-12 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 hover:filter hover:brightness-[95%] sm:col-start-1 sm:mt-0 disabled:bg-gray-100"
                                            disabled={bookmarked}
                                        >
                                            {!bookmarked ? (
                                                <>Bookmark all</>
                                            ) : (
                                                <CheckCircleIcon className="h-6 w-6 text-primary" />
                                            )}
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                setCompleteSubmitting(true);

                                                const createReq =
                                                    await apiRequest(
                                                        'POST',
                                                        '/client/listings',
                                                        listingData
                                                    );

                                                if (
                                                    createReq.status === 201 &&
                                                    createReq.data
                                                ) {
                                                    if (
                                                        !hasFirstListing ||
                                                        (clientAccess?.type &&
                                                            [
                                                                'all',
                                                                'privileged',
                                                            ].includes(
                                                                clientAccess.type
                                                            ))
                                                    ) {
                                                        setTimeout(
                                                            () =>
                                                                router.push(
                                                                    '/app/client/browse-talent'
                                                                ),
                                                            1000
                                                        );
                                                    } else {
                                                        setListingId(
                                                            createReq.data.id
                                                        );

                                                        setTimeout(
                                                            () =>
                                                                setActiveStage(
                                                                    'payment'
                                                                ),
                                                            1000
                                                        );
                                                    }
                                                }
                                                setCompleteSaved(true);
                                            } catch {
                                                setCompleteSubmitting(false);
                                            }
                                        }}
                                        className="inline-flex w-full h-12 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 hover:filter hover:brightness-[95%] sm:col-start-1 sm:mt-0"
                                        disabled={
                                            completeSubmitting || completeSaved
                                        }
                                    >
                                        {!completeSaved ? (
                                            !hasFirstListing ||
                                            (clientAccess?.type &&
                                                ['all', 'privileged'].includes(
                                                    clientAccess.type
                                                )) ? (
                                                'Explore talent'
                                            ) : (
                                                'Save and move onto payment'
                                            )
                                        ) : (
                                            <CheckCircleIcon className="h-6 w-6 text-primary" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Transition>

                    <Transition
                        show={activeStage === 'payment'}
                        enter="transition transform duration-300"
                        enterFrom="opacity-0 translate-y-[5vh]"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition transform duration-300"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 -translate-y-[5vh]"
                    >
                        <div className="bg-white shadow-xl rounded-xl w-[80vw] md:w-[30vw]">
                            <div className="px-4 sm:px-6 pb-4">
                                <span className="ml-2 text-xl font-medium text-gray-900">
                                    Choose what suits you best.
                                </span>

                                <div className="overflow-y-scroll scrollbar-thin md:overflow-y-hidden h-[60vh] md:h-auto no-scrollbar">
                                    <p className="p-1 text-gray-600 h-auto md:text-sm">
                                        Our goal is to provide you with speed
                                        and accuracy when making hiring
                                        decisions for your sales team. That's
                                        why you only have two options when
                                        creating a paid account.
                                    </p>
                                    <p className="p-1 text-gray-600 h-auto md:text-sm">
                                        You can either pay for one listing at a
                                        time or you can choose to have unlimited
                                        listings.
                                    </p>
                                    <p className="p-1 text-gray-600 h-auto md:text-sm">
                                        Our $299 per listing plan grants you ALL
                                        of the same features as our Unlimited
                                        plan, but may be more suitable for
                                        smaller companies.
                                    </p>
                                    <p className="p-1 text-gray-600 h-auto md:text-sm">
                                        If you plan to hire for 3 or more roles,
                                        it may be best to choose our Unlimited
                                        subscription at just $780 per year.
                                    </p>

                                    <div className="mt-4 mx-auto grid max-w-lg grid-cols-1 items-center gap-y-6 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
                                        <div className="bg-white/60 sm:mx-8 lg:mx-0 rounded-t-3xl sm:rounded-b-none lg:rounded-tr-none lg:rounded-bl-3xl rounded-3xl p-4 ring-1 ring-gray-900/10 sm:p-8">
                                            <h3 className="text-gray-900 text-base font-semibold leading-7">
                                                Per listing
                                            </h3>
                                            <p className="mt-4 flex items-baseline gap-x-2">
                                                <span className="text-gray-900 text-5xl font-bold tracking-tight">
                                                    $299
                                                </span>
                                                <span className="text-gray-500 text-base">
                                                    one-time
                                                </span>
                                            </p>
                                            <p className="text-gray-600 mt-6 text-base leading-7">
                                                The right choice for businesses
                                                that hire infrequently.
                                            </p>

                                            <ul
                                                role="list"
                                                className="mt-4 space-y-2 text-sm leading-6 text-gray-600"
                                            >
                                                <li className="flex gap-x-3 text-gray-600">
                                                    <XMarkIcon
                                                        className="h-6 w-5 flex-none text-primary"
                                                        aria-hidden="true"
                                                    />
                                                    Create unlimited listings
                                                </li>
                                                <li className="flex gap-x-3 text-gray-600">
                                                    <CheckIcon
                                                        className="h-6 w-5 flex-none text-primary"
                                                        aria-hidden="true"
                                                    />
                                                    Access all talent
                                                    information
                                                </li>
                                                <li className="flex gap-x-3 text-gray-600">
                                                    <CheckIcon
                                                        className="h-6 w-5 flex-none text-primary"
                                                        aria-hidden="true"
                                                    />
                                                    Invite talent to apply
                                                </li>
                                                <li className="flex gap-x-3 text-gray-600">
                                                    <CheckIcon
                                                        className="h-6 w-5 flex-none text-primary"
                                                        aria-hidden="true"
                                                    />
                                                    Manage applications
                                                </li>
                                                <li className="flex gap-x-3 text-gray-600">
                                                    <CheckIcon
                                                        className="h-6 w-5 flex-none text-primary"
                                                        aria-hidden="true"
                                                    />
                                                    Chat with applicants
                                                </li>
                                            </ul>

                                            <a
                                                onClick={(e) => {
                                                    e.preventDefault();

                                                    apiRequest(
                                                        'GET',
                                                        `/client/payment-session/${listingId}`
                                                    ).then(
                                                        (res) =>
                                                            (window.location.href =
                                                                res?.data?.url)
                                                    );
                                                }}
                                                className="text-primary ring-1 ring-inset ring-primary mt-8 block rounded-md py-2.5 px-3.5 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-10"
                                            >
                                                Pay and explore talent
                                            </a>
                                        </div>
                                        <div className="relative bg-gray-900 shadow-2xl sm:rounded-t-none lg:rounded-tr-3xl lg:rounded-bl-none rounded-3xl p-4 ring-1 ring-gray-900/10 sm:p-8">
                                            <h3 className="text-white text-base font-semibold leading-7">
                                                All access
                                            </h3>
                                            <p className="mt-4 flex items-baseline gap-x-2">
                                                <span className="text-white text-5xl font-bold tracking-tight">
                                                    $780
                                                </span>
                                                <span className="text-gray-400 text-base">
                                                    per year
                                                </span>
                                            </p>
                                            <p className="text-gray-300 mt-6 text-base leading-7">
                                                The perfect choice for
                                                businesses that hire frequently.
                                            </p>

                                            <ul
                                                role="list"
                                                className="mt-4 space-y-2 text-sm leading-6 text-gray-600"
                                            >
                                                <li className="flex gap-x-3 text-gray-300">
                                                    <CheckIcon
                                                        className="h-6 w-5 flex-none text-secondary"
                                                        aria-hidden="true"
                                                    />
                                                    Create unlimited listings
                                                </li>
                                                <li className="flex gap-x-3 text-gray-300">
                                                    <CheckIcon
                                                        className="h-6 w-5 flex-none text-secondary"
                                                        aria-hidden="true"
                                                    />
                                                    Access all talent
                                                    information
                                                </li>
                                                <li className="flex gap-x-3 text-gray-300">
                                                    <CheckIcon
                                                        className="h-6 w-5 flex-none text-secondary"
                                                        aria-hidden="true"
                                                    />
                                                    Invite talent to apply
                                                </li>
                                                <li className="flex gap-x-3 text-gray-300">
                                                    <CheckIcon
                                                        className="h-6 w-5 flex-none text-secondary"
                                                        aria-hidden="true"
                                                    />
                                                    Manage applications
                                                </li>
                                                <li className="flex gap-x-3 text-gray-300">
                                                    <CheckIcon
                                                        className="h-6 w-5 flex-none text-secondary"
                                                        aria-hidden="true"
                                                    />
                                                    Chat with applicants
                                                </li>
                                            </ul>

                                            <a
                                                onClick={(e) => {
                                                    e.preventDefault();

                                                    apiRequest(
                                                        'GET',
                                                        `/client/payment-session`
                                                    ).then(
                                                        (res) =>
                                                            (window.location.href =
                                                                res?.data?.url)
                                                    );
                                                }}
                                                className="bg-primary ring-1 ring-inset ring-white text-white shadow-sm mt-8 block rounded-md py-2.5 px-3.5 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-10"
                                            >
                                                Pay and explore talent
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>
        </>
    );
};

export default CreateListing;
