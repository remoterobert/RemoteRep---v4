import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import {
    ArrowTopRightOnSquareIcon,
    MapPinIcon,
} from '@heroicons/react/20/solid';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import {
    CheckCircleIcon,
    EnvelopeIcon,
    BookmarkIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import * as localData from '../../../services/localData';
import { useForm } from 'react-hook-form';
import FormBuilder from '../../../components/forms/formBuilder';
import apiRequest from '../../../services/apiRequest';
import * as formFields from '../../../services/formFields';
import { Listing } from 'types';
import { getListingMatchScore } from 'services/utils/getListingMatchScore';
import { transformTalentData } from 'services/utils/transformTalentData';

const SkillCard: React.FC<{ k: string; v: string }> = ({ k, v }) => {
    return (
        <div className="text-xs border-2 rounded-full shadow-sm p-2 bg-white inline-flex">
            <span className="font-medium text-gray-900">{`${k}:`}</span>
            <span className="ml-1 text-gray-700">{v}</span>
        </div>
    );
};

const TalentOnboarding: NextPage = () => {
    const [activeStage, setActiveStage] = useState('profile');
    const [showCard, setShowCard] = useState(false);
    const [completeSubmitting, setCompleteSubmitting] = useState(false);
    const [completeSaved, setCompleteSaved] = useState(false);

    const [user, setUser] = useState<any>({});

    const profileForm = useForm();
    const profileData = profileForm.watch();
    const experienceForm = useForm();
    const experienceData = experienceForm.watch();
    const goalsForm = useForm();
    const goalsData = goalsForm.watch();
    const filesForm = useForm();

    const router = useRouter();

    const [matches, setMatches] = useState(0);
    const [scoreInfo, setScoreInfo] = useState(0);

    const getMatches = async () => {
        try {
            const listingsReq = await apiRequest('GET', '/talent/listings');
            if (listingsReq?.data?.listings.length) {
                const listings: Listing[] = listingsReq?.data?.listings;
                const transformedGoalsData = transformTalentData(
                    Object.keys(goalsData),
                    goalsData
                );
                const transformedExperienceData = transformTalentData(
                    Object.keys(experienceData),
                    experienceData
                );

                const filteredListings = listings.filter((l: Listing) => {
                    let passed = true;

                    const filterData = {
                        ...l.details,
                        ...(l.client.clientData?.profile || {}),
                    };

                    if (
                        (goalsData.salesRoles &&
                            !goalsData.salesRoles
                                .split(', ')
                                .includes(filterData?.salesRole)) ||
                        (goalsData.commitments &&
                            !goalsData.commitments
                                .split(', ')
                                .includes(filterData?.commitment)) ||
                        (goalsData.compensationTypes &&
                            !goalsData.compensationTypes
                                .split(', ')
                                .includes(filterData?.compensationType)) ||
                        (goalsData.benefits &&
                            !goalsData.benefits
                                .split(', ')
                                .every((b: string) =>
                                    filterData?.benefits?.includes(b)
                                )) ||
                        (goalsData.minimumCompensation &&
                            goalsData.minimumCompensation >
                                (filterData?.minimumCompensation || 0)) ||
                        (goalsData.companyAge &&
                            +goalsData.companyAge > +filterData?.companyAge) ||
                        (goalsData.companyHeadcount &&
                            +goalsData.companyHeadcount >
                                +filterData?.companyHeadcount) ||
                        (goalsData.industries &&
                            !goalsData?.industries
                                ?.split(', ')
                                .includes(filterData?.industry))
                    )
                        passed = false;

                    return passed;
                });

                const listingsWithMatchScore = filteredListings
                    .map((listing: Listing) => {
                        const matchScore = getListingMatchScore({
                            talent: {
                                goals: transformedGoalsData as Record<
                                    string,
                                    any
                                >,
                                experience: transformedExperienceData as Record<
                                    string,
                                    any
                                >,
                            },
                            client: {
                                details: {
                                    ...listing.details,
                                    ...listing.client?.clientData?.profile,
                                },
                                requirements: listing.requirements,
                            },
                        });
                        return { ...listing, matchScore };
                    })
                    .sort((prev, next) => next.matchScore - prev.matchScore);
                const amountByMainPercent = listingsWithMatchScore.filter(
                    ({ matchScore }) => matchScore >= 80
                ).length;

                if (amountByMainPercent > 0) {
                    setMatches(amountByMainPercent);
                    setScoreInfo(80);
                    router.push('/onboarding/talent/files');
                    return;
                } else {
                    const amountBySecondaryPercent =
                        listingsWithMatchScore.filter(
                            (listing) => listing.matchScore! >= 60
                        ).length;

                    if (amountBySecondaryPercent > 0) {
                        setMatches(amountBySecondaryPercent);
                        setScoreInfo(60);
                        router.push('/onboarding/talent/files');
                        return;
                    } else {
                        const amountByThirdPercent =
                            listingsWithMatchScore.filter(
                                (listing) => listing.matchScore! >= 40
                            ).length;
                        if (amountByThirdPercent > 0) {
                            setMatches(amountByThirdPercent);
                            setScoreInfo(40);
                            router.push('/onboarding/talent/files');
                            return;
                        } else {
                            setMatches(0);
                            setScoreInfo(0);
                            router.push('/onboarding/talent/files');
                            return;
                        }
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (!router.isReady) return;

        const localUser = localData.get('user');
        setUser(localUser);

        switch (router.query.stage) {
            case 'profile':
                setActiveStage('profile');
                break;
            case 'experience':
                setActiveStage('experience');
                break;
            case 'goals':
                setActiveStage('goals');
                break;
            case 'files':
                setActiveStage('files');
                break;
            case 'complete':
                setActiveStage('complete');
                break;
            default:
                router.push('/onboarding/talent/profile');
        }

        setTimeout(() => setShowCard(true), 500);
    }, [router.isReady, router.query]);

    return (
        <>
            <div className="shadow-lg w-full h-16 py-4 px-8">
                <img
                    className="absolute w-auto h-8"
                    src="/white-logo-with-text.svg"
                />
            </div>

            <img
                className="absolute inset-0 h-full w-full object-cover filter blur-xs -z-10"
                src="/sign-up-background.jpg"
            />

            <div className="hidden md:block">
                <Transition
                    appear={true}
                    show={
                        activeStage === 'profile' ||
                        activeStage === 'experience' ||
                        activeStage === 'goals'
                    }
                    enter="transition duration-1000"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition duration-1000"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute flex items-center justify-center h-full max-h-[90vh] w-full md:w-[50vw] overflow-clip">
                        <div className="absolute bg-white dark:bg-darkForeground shadow-xl rounded-xl w-[80vw] md:w-[40vw]">
                            <div className="border-b border-gray-200 bg-white dark:bg-darkForeground py-4 rounded-t-xl">
                                <h3 className="text-center text-sm font-semibold text-gray-900 dark:text-white">
                                    This is how recruiters will see your
                                    profile.
                                </h3>
                            </div>

                            <div className="w-full flex justify-between px-4 py-4">
                                <div className="inline-flex">
                                    {profileData?.photoUrl ||
                                    user?.talentData?.profile?.photoUrl ? (
                                        <img
                                            src={
                                                profileData.photoUrl ||
                                                user?.talentData?.profile
                                                    ?.photoUrl
                                            }
                                            className="h-24 w-24 rounded-full"
                                        />
                                    ) : (
                                        <UserCircleIcon
                                            className="h-24 w-24 text-gray-300"
                                            aria-hidden="true"
                                        />
                                    )}

                                    <div className="ml-4 font-medium text-gray-900 dark:text-white flex items-center">
                                        <div>
                                            <span className="text-2xl">
                                                {`${user?.contact?.firstName} ${user?.contact?.lastName}`}
                                            </span>
                                            <div className="mt-2">
                                                <span className="text-md inline-flex text-gray-700 dark:text-gray-500">
                                                    <MapPinIcon className="h-5 w-5 text-gray-700 dark:text-gray-500" />
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

                                <div className="min-h-full flex justify-center items-center gap-2 px-4">
                                    <div className="group flex items-center justify-center rounded-full border-2 border-solid border-gray-200 p-2 shadow-sm hover:shadow-md">
                                        <EnvelopeIcon
                                            onClick={() => {}}
                                            className="h-6 w-6 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-400"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div className="group flex items-center justify-center rounded-full border-2 border-solid border-gray-200 p-2 shadow-sm hover:shadow-md">
                                        <UserPlusIcon
                                            onClick={() => {}}
                                            className="h-6 w-6 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-400"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div className="group flex items-center justify-center rounded-full border-2 border-solid border-gray-200 p-2 shadow-sm hover:shadow-md">
                                        <BookmarkIcon
                                            className="h-6 w-6 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-400"
                                            aria-hidden="true"
                                        />
                                    </div>
                                </div>
                            </div>

                            {(user?.talentData?.profile?.about ||
                                user?.talentData?.profile?.headline ||
                                user?.talentData?.profile?.videoUrl ||
                                profileData?.about ||
                                profileData?.headline ||
                                profileData?.videoUrl) && (
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
                                                About
                                            </span>
                                        </div>
                                    </div>
                                    <div className="px-8 py-4 text-gray-700 dark:text-white">
                                        <h3 className="font-medium inline-flex">
                                            {profileData?.headline ||
                                            user?.talentData?.profile?.headline
                                                ? `${
                                                      profileData.headline ||
                                                      user?.talentData?.profile
                                                          ?.headline
                                                  } `
                                                : null}
                                            {profileData.videoUrl ||
                                            user?.talentData?.profile
                                                ?.videoUrl ? (
                                                <span className="ml-2">
                                                    |{' '}
                                                    <span
                                                        className="text-primary hover:underline inline-flex items-center"
                                                        onClick={() =>
                                                            window.open(
                                                                profileData.videoUrl ||
                                                                    user
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
                                        <p className="mt-2 whitespace-pre-wrap break-words">
                                            {profileData.about ||
                                                user?.talentData?.profile
                                                    ?.about}
                                        </p>
                                    </div>
                                </>
                            )}

                            {(user?.talentData?.experience || experienceData) &&
                                Object.values(
                                    user?.talentData?.experience ||
                                        experienceData
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
                                            {user?.talentData?.experience ||
                                            experienceData ? (
                                                <>
                                                    <div className="py-2 flex flex-wrap gap-2">
                                                        {Object.entries(
                                                            user?.talentData
                                                                ?.experience ||
                                                                experienceData
                                                        ).map(([k, v]: any) => {
                                                            return v ? (
                                                                <SkillCard
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

                            {(user?.talentData?.goals || goalsData) &&
                                Object.values(
                                    user?.talentData?.goals || goalsData
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
                                                    Goals
                                                </span>
                                            </div>
                                        </div>
                                        <div className="px-8 py-2">
                                            {user?.talentData?.goals ||
                                            goalsData ? (
                                                <>
                                                    <div className="py-2 flex flex-wrap gap-2">
                                                        {Object.entries(
                                                            user?.talentData
                                                                ?.goals ||
                                                                goalsData
                                                        ).map(([k, v]: any) => {
                                                            return v ? (
                                                                <SkillCard
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
                </Transition>
            </div>

            <Transition
                show={showCard && activeStage === 'profile'}
                enter="transition transform duration-300"
                enterFrom="opacity-0 translate-y-[5vh]"
                enterTo="opacity-100 translate-y-0"
                leave="transition transform duration-300"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-[5vh]"
            >
                <div className="flex items-center justify-center h-full max-h-[90vh] w-full mt-[45vh] md:ml-[50vw] md:w-[50vw] overflow-clip">
                    <div className="absolute bg-white dark:bg-darkForeground shadow-xl rounded-xl w-[80vw] md:w-[30vw]">
                        <div className="border-b border-gray-200 bg-white dark:bg-darkForeground py-4 rounded-t-xl">
                            <h3 className="text-center text-sm font-semibold text-gray-900 dark:text-white">
                                This information will be displayed publicly.
                            </h3>
                        </div>

                        <div className="px-4 py-5 sm:px-6">
                            <span className="text-xl font-medium text-gray-900 dark:text-white">
                                Let's create your profile.
                            </span>

                            <div className="mt-4">
                                <FormBuilder
                                    {...{
                                        formHook: profileForm,
                                        formName: 'talentProfile',
                                        submitText: 'Save and continue',
                                        getFunc: async () => {
                                            return user?.talentData?.profile;
                                        },
                                        postFunc: async (data) => {
                                            try {
                                                const updateReq =
                                                    await apiRequest(
                                                        'PATCH',
                                                        '/talent/',
                                                        {
                                                            profile:
                                                                Object.fromEntries(
                                                                    Object.entries(
                                                                        data
                                                                    ).map(
                                                                        ([
                                                                            k,
                                                                            v,
                                                                        ]) => {
                                                                            if (
                                                                                v
                                                                            )
                                                                                return [
                                                                                    k,
                                                                                    v,
                                                                                ];
                                                                            else
                                                                                return [];
                                                                        }
                                                                    )
                                                                ),
                                                        }
                                                    );

                                                if (
                                                    updateReq.status === 200 &&
                                                    updateReq.data
                                                ) {
                                                    localData.set(
                                                        'user.talentData',
                                                        updateReq.data
                                                            .talentData
                                                    );

                                                    setTimeout(
                                                        () =>
                                                            router.push(
                                                                '/onboarding/talent/experience'
                                                            ),
                                                        1000
                                                    );
                                                    return true;
                                                } else return false;
                                            } catch {
                                                return false;
                                            }
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>

            <Transition
                show={showCard && activeStage === 'experience'}
                enter="transition transform duration-300"
                enterFrom="opacity-0 translate-y-[5vh]"
                enterTo="opacity-100 translate-y-0"
                leave="transition transform duration-300"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-[5vh]"
            >
                <div className="flex items-center justify-center h-full max-h-[90vh] w-full mt-[45vh] md:ml-[50vw] md:w-[50vw] overflow-clip">
                    <div className="absolute bg-white dark:bg-darkForeground shadow-xl rounded-xl w-[80vw] md:w-[30vw]">
                        <div className="border-b border-gray-200 bg-white dark:bg-darkForeground py-4 rounded-t-xl">
                            <h3 className="text-center text-sm font-semibold text-gray-900 dark:text-white">
                                This information will be displayed publicly.
                            </h3>
                        </div>

                        <div className="px-4 py-5 sm:px-6">
                            <span className="text-xl font-medium text-gray-900 dark:text-white">
                                What's your background?
                            </span>

                            <div className="mt-4">
                                <FormBuilder
                                    {...{
                                        formHook: experienceForm,
                                        formName: 'talentExperience',
                                        submitText: 'Save and continue',
                                        getFunc: async () => {
                                            return user?.talentData?.experience;
                                        },
                                        postFunc: async (data) => {
                                            try {
                                                const updateReq =
                                                    await apiRequest(
                                                        'PATCH',
                                                        '/talent/',
                                                        {
                                                            experience:
                                                                Object.fromEntries(
                                                                    Object.entries(
                                                                        data
                                                                    ).map(
                                                                        ([
                                                                            k,
                                                                            v,
                                                                        ]: any[]) => {
                                                                            if (
                                                                                v
                                                                            )
                                                                                return (
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
                                                                                    .type ===
                                                                                    'multiselect'
                                                                                    ? [
                                                                                          k,
                                                                                          v.split(
                                                                                              ', '
                                                                                          ),
                                                                                      ]
                                                                                    : [
                                                                                          k,
                                                                                          v,
                                                                                      ];
                                                                            else
                                                                                return [];
                                                                        }
                                                                    )
                                                                ),
                                                        }
                                                    );

                                                if (
                                                    updateReq.status === 200 &&
                                                    updateReq.data
                                                ) {
                                                    localData.set(
                                                        'user.talentData',
                                                        updateReq.data
                                                            .talentData
                                                    );

                                                    setTimeout(
                                                        () =>
                                                            router.push(
                                                                '/onboarding/talent/goals'
                                                            ),
                                                        1000
                                                    );
                                                    return true;
                                                } else return false;
                                            } catch {
                                                return false;
                                            }
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>

            <Transition
                show={showCard && activeStage === 'goals'}
                enter="transition transform duration-300"
                enterFrom="opacity-0 translate-y-[5vh]"
                enterTo="opacity-100 translate-y-0"
                leave="transition transform duration-300"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-[5vh]"
            >
                <div className="flex items-center justify-center h-full max-h-[90vh] w-full mt-[45vh] md:ml-[50vw] md:w-[50vw] overflow-clip">
                    <div className="absolute bg-white dark:bg-darkForeground shadow-xl rounded-xl w-[80vw] md:w-[30vw]">
                        <div className="border-b border-gray-200 bg-white dark:bg-darkForeground py-4 rounded-t-xl">
                            <h3 className="text-center text-sm font-semibold text-gray-900 dark:text-white">
                                This information will be displayed publicly.
                            </h3>
                        </div>

                        <div className="px-4 py-5 sm:px-6">
                            <span className="text-xl font-medium text-gray-900 dark:text-white">
                                What are you looking for?
                            </span>

                            <div className="mt-4">
                                <FormBuilder
                                    {...{
                                        formHook: goalsForm,
                                        formName: 'talentGoals',
                                        submitText: 'Save and continue',
                                        getFunc: async () => {
                                            return user?.talentData?.goals;
                                        },
                                        postFunc: async (data) => {
                                            try {
                                                const updateReq =
                                                    await apiRequest(
                                                        'PATCH',
                                                        '/talent/',
                                                        {
                                                            goals: Object.fromEntries(
                                                                Object.entries(
                                                                    data
                                                                ).map(
                                                                    ([
                                                                        k,
                                                                        v,
                                                                    ]: any[]) => {
                                                                        if (v)
                                                                            return (
                                                                                formFields.get(
                                                                                    'talentGoals'
                                                                                ) as any[]
                                                                            ).find(
                                                                                (
                                                                                    f: any
                                                                                ) =>
                                                                                    f.name ===
                                                                                    k
                                                                            )
                                                                                .type ===
                                                                                'multiselect'
                                                                                ? [
                                                                                      k,
                                                                                      v.split(
                                                                                          ', '
                                                                                      ),
                                                                                  ]
                                                                                : [
                                                                                      k,
                                                                                      v,
                                                                                  ];
                                                                        else
                                                                            return [];
                                                                    }
                                                                )
                                                            ),
                                                        }
                                                    );
                                                if (
                                                    updateReq.status === 200 &&
                                                    updateReq.data
                                                ) {
                                                    localData.set(
                                                        'user.talentData',
                                                        updateReq.data
                                                            .talentData
                                                    );

                                                    setTimeout(
                                                        () =>
                                                            router.push(
                                                                '/onboarding/talent/files'
                                                            ),
                                                        1000
                                                    );
                                                    return true;
                                                } else return false;
                                            } catch {
                                                return false;
                                            }
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>

            <Transition
                show={showCard && activeStage === 'files'}
                enter="transition transform duration-300"
                enterFrom="opacity-0 translate-y-[5vh]"
                enterTo="opacity-100 translate-y-0"
                leave="transition transform duration-300"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-[5vh]"
            >
                <div className="flex items-center justify-center h-full max-h-[90vh] w-full mt-[45vh] md:ml-[50vw] md:w-[50vw] overflow-clip">
                    <div className="absolute bg-white dark:bg-darkForeground shadow-xl rounded-xl w-[80vw] md:w-[30vw]">
                        <div className="border-b border-gray-200 bg-white dark:bg-darkForeground py-4 rounded-t-xl">
                            <h3 className="text-center text-sm font-semibold text-gray-900 dark:text-white">
                                These files can only be accessed by hiring
                                managers and platform administrators.
                            </h3>
                        </div>

                        <div className="px-4 py-5 sm:px-6">
                            <span className="text-xl font-medium text-gray-900 dark:text-white">
                                Just one more step...
                            </span>

                            <div className="mt-4">
                                <FormBuilder
                                    {...{
                                        formHook: filesForm,
                                        formName: 'talentFiles',
                                        submitText: 'Save and continue',
                                        getFunc: async () => {
                                            return user?.talentData?.files;
                                        },
                                        postFunc: async (data) => {
                                            await getMatches();
                                            try {
                                                const updateReq =
                                                    await apiRequest(
                                                        'PATCH',
                                                        '/talent/',
                                                        {
                                                            files: Object.fromEntries(
                                                                Object.entries(
                                                                    data
                                                                ).map(
                                                                    ([
                                                                        k,
                                                                        v,
                                                                    ]) => {
                                                                        if (v)
                                                                            return [
                                                                                k,
                                                                                v,
                                                                            ];
                                                                        else
                                                                            return [];
                                                                    }
                                                                )
                                                            ),
                                                        }
                                                    );
                                                if (
                                                    updateReq.status === 200 &&
                                                    updateReq.data
                                                ) {
                                                    localData.set(
                                                        'user.talentData',
                                                        updateReq.data
                                                            .talentData
                                                    );
                                                    setTimeout(
                                                        () =>
                                                            router.push(
                                                                '/onboarding/talent/complete'
                                                            ),
                                                        1000
                                                    );
                                                    return true;
                                                } else return false;
                                            } catch {
                                                return false;
                                            }
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>

            <Transition
                show={showCard && activeStage === 'complete'}
                enter="transition transform duration-300"
                enterFrom="opacity-0 translate-y-[5vh]"
                enterTo="opacity-100 translate-y-0"
                leave="transition transform duration-300"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-[5vh]"
            >
                <div className="flex items-center justify-center h-full max-h-[90vh] w-full mt-[45vh] md:ml-[50vw] md:w-[50vw] overflow-clip">
                    <div className="absolute bg-white dark:bg-darkForeground shadow-xl rounded-xl w-[80vw] md:w-[30vw]">
                        <div className="border-b border-gray-200 bg-white dark:bg-darkForeground py-4 rounded-t-xl">
                            <h3 className="text-center text-sm font-semibold text-gray-900 dark:text-white">
                                Welcome aboard.
                            </h3>
                        </div>

                        <div className="px-4 py-5 sm:px-6">
                            <span className="text-xl font-medium text-gray-900 dark:text-white">
                                {matches > 0 ? (
                                    <>
                                        We've found{' '}
                                        <span className="text-primary font-semibold">
                                            {matches}
                                        </span>{' '}
                                        job listings with a match score over{' '}
                                        <span className="text-primary font-semibold">
                                            {scoreInfo}%
                                        </span>
                                        .
                                    </>
                                ) : (
                                    <>
                                        We've found no job listings that match
                                        your profile.
                                    </>
                                )}
                            </span>

                            <div className="mt-4 w-full">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const updateReq = await apiRequest(
                                                'PATCH',
                                                '/talent/',
                                                {
                                                    onboardingComplete: true,
                                                }
                                            );

                                            if (
                                                updateReq.status === 200 &&
                                                updateReq.data
                                            ) {
                                                localData.set(
                                                    'user.talentData',
                                                    updateReq.data.talentData
                                                );

                                                setTimeout(
                                                    () =>
                                                        router.push(
                                                            '/app/talent/browse-listings'
                                                        ),
                                                    1000
                                                );
                                                return true;
                                            } else return false;
                                        } catch {
                                            return false;
                                        }
                                    }}
                                    className="inline-flex w-full h-12 items-center justify-center rounded-md bg-primaryBlue px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm hover:filter hover:brightness-[95%] sm:col-start-1 sm:mt-0"
                                    disabled={
                                        completeSubmitting || completeSaved
                                    }
                                >
                                    {!completeSaved ? (
                                        'Explore job listings'
                                    ) : (
                                        <CheckCircleIcon className="h-6 w-6 text-primary" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </>
    );
};

export default TalentOnboarding;
