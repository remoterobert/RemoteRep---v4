import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import {
    ArrowTopRightOnSquareIcon,
    CheckIcon,
    ChevronUpDownIcon,
    MapPinIcon,
} from '@heroicons/react/20/solid';
import {
    DocumentArrowUpIcon,
    PhotoIcon,
    BuildingOffice2Icon,
} from '@heroicons/react/24/solid';
import {
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    EnvelopeIcon,
    BookmarkIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import * as localData from '../../../services/localData';
import { useForm } from 'react-hook-form';
import FormBuilder from '../../../components/forms/formBuilder';
import apiRequest from '../../../services/apiRequest';
import * as formFields from '../../../services/formFields';
import { ClientDataProfile, Talent } from 'types';
import { getTalentsMatchScore } from 'services/utils/getTalentsMatchScore';

const SkillCard: React.FC<{ k: string; v: string }> = ({ k, v }) => {
    return (
        <div className="text-xs border-2 rounded-full shadow-sm p-2 bg-white inline-flex">
            <span className="font-medium text-gray-900">{`${k}:`}</span>
            <span className="ml-1 text-gray-700">{v}</span>
        </div>
    );
};

const ClientOnboarding: NextPage = () => {
    const [activeStage, setActiveStage] = useState('profile');
    const [showCard, setShowCard] = useState(false);
    const [completeSubmitting, setCompleteSubmitting] = useState(false);
    const [completeSaved, setCompleteSaved] = useState(false);

    const [user, setUser] = useState<any>({});

    const profileForm = useForm();
    const profileData = profileForm.watch();

    const router = useRouter();

    const [matches, setMatches] = useState(0);
    const [scoreInfo, setScoreInfo] = useState(0);

    const getMatches = async () => {
        try {
            const talentReq = await apiRequest('GET', '/client/talent');

            if (talentReq?.data?.talent.length) {
                const { photoUrl, ...clientData } = profileData;
                const talents = talentReq?.data.talent;
                const filteredTalents: Talent[] = talents.filter(
                    (talent: Talent) => {
                        const meetsHeadcountCondition =
                            clientData.companyHeadcount >=
                            talent.talentData.goals.companyHeadcount;
                        const meetsAgeCondition =
                            clientData.companyAge >=
                            talent.talentData.goals.companyAge;
                        const hasMatchingIndustry =
                            talent.talentData.goals.industries.includes(
                                clientData.industry
                            );

                        return (
                            meetsHeadcountCondition &&
                            meetsAgeCondition &&
                            hasMatchingIndustry
                        );
                    }
                );

                const talentsWithMatchScore = filteredTalents.map((talent) => {
                    const matchScore = getTalentsMatchScore({
                        client: clientData as ClientDataProfile,
                        talent: talent.talentData.goals,
                    });

                    return { ...talent, matchScore };
                });

                const amountByMainPercent = talentsWithMatchScore.filter(
                    ({ matchScore }) => matchScore >= 80
                ).length;

                if (amountByMainPercent > 0) {
                    setMatches(amountByMainPercent);
                    setScoreInfo(80);
                    router.push('/onboarding/client/complete');
                    return;
                } else {
                    const amountBySecondaryPercent =
                        talentsWithMatchScore.filter(
                            (talent: Talent) => talent.matchScore! >= 60
                        ).length;

                    if (amountBySecondaryPercent > 0) {
                        setMatches(amountBySecondaryPercent);
                        setScoreInfo(60);
                        router.push('/onboarding/client/complete');
                        return;
                    } else {
                        const amountByThirdPercent =
                            talentsWithMatchScore.filter(
                                (talent: Talent) => talent.matchScore! >= 40
                            ).length;
                        if (amountByThirdPercent > 0) {
                            setMatches(amountByThirdPercent);
                            setScoreInfo(40);
                            router.push('/onboarding/client/complete');
                            return;
                        } else {
                            setMatches(0);
                            setScoreInfo(0);
                            router.push('/onboarding/client/complete');
                            return;
                        }
                    }
                }
            }
        } catch (error) {}
    };

    useEffect(() => {
        if (!router.isReady) return;

        const localUser = localData.get('user');
        setUser(localUser);

        switch (router.query.stage) {
            case 'profile':
                setActiveStage('profile');
                break;
            case 'complete':
                setActiveStage('complete');
                break;
            default:
                router.push('/onboarding/client/profile');
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
                    show={activeStage === 'profile'}
                    enter="transition duration-1000"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition duration-1000"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute flex items-center justify-center h-full max-h-[90vh] w-full md:w-[50vw] overflow-clip">
                        <div className="absolute bg-white shadow-xl rounded-xl w-[80vw] md:w-[40vw]">
                            <div className="border-b border-gray-200 bg-white py-4 rounded-t-xl">
                                <h3 className="text-center text-sm font-semibold text-gray-900">
                                    This is how applicants will see your
                                    profile.
                                </h3>
                            </div>

                            <div className="w-full flex justify-between px-4 py-4">
                                <div className="inline-flex">
                                    {profileData?.photoUrl ||
                                    user?.clientData?.profile?.photoUrl ? (
                                        <img
                                            src={
                                                profileData.photoUrl ||
                                                user?.clientData?.profile
                                                    ?.photoUrl
                                            }
                                            className="h-24 w-24 rounded-full"
                                        />
                                    ) : (
                                        <BuildingOffice2Icon
                                            className="h-24 w-24 text-gray-300"
                                            aria-hidden="true"
                                        />
                                    )}

                                    <div className="ml-4 font-medium text-gray-900 flex items-center">
                                        <div>
                                            <span className="text-2xl">
                                                {user?.contact?.companyName ||
                                                    null}
                                            </span>
                                            <div className="mt-2">
                                                <span className="text-md inline-flex text-gray-700">
                                                    <MapPinIcon className="h-5 w-5 text-gray-700" />
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
                                            className="h-6 w-6 text-gray-500 group-hover:text-gray-700"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div className="group flex items-center justify-center rounded-full border-2 border-solid border-gray-200 p-2 shadow-sm hover:shadow-md">
                                        <ClipboardDocumentListIcon
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

                            {(user?.clientData?.profile || profileData) &&
                                Object.entries(
                                    user?.clientData?.profile || profileData
                                ).some(
                                    ([k, v]: any[]) => k !== 'photoUrl' && v
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
                                                    Profile
                                                </span>
                                            </div>
                                        </div>
                                        <div className="px-8 py-2">
                                            {user?.clientData?.profile ||
                                            profileData ? (
                                                <>
                                                    <div className="py-2 flex flex-wrap gap-2">
                                                        {Object.entries(
                                                            user?.clientData
                                                                ?.profile ||
                                                                profileData
                                                        ).map(([k, v]: any) => {
                                                            return k ===
                                                                'photoUrl' ? null : v ? (
                                                                <SkillCard
                                                                    {...{
                                                                        k: (
                                                                            formFields.get(
                                                                                'clientProfile'
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
                    <div className="absolute bg-white shadow-xl rounded-xl w-[80vw] md:w-[30vw]">
                        <div className="border-b border-gray-200 bg-white py-4 rounded-t-xl">
                            <h3 className="text-center text-sm font-semibold text-gray-900">
                                This information will be displayed publicly.
                            </h3>
                        </div>

                        <div className="px-4 py-5 sm:px-6">
                            <span className="text-xl font-medium text-gray-900">
                                Let's create your profile.
                            </span>

                            <div className="mt-4">
                                <FormBuilder
                                    {...{
                                        formHook: profileForm,
                                        formName: 'clientProfile',
                                        submitText: 'Save and continue',
                                        getFunc: async () => {
                                            return user?.clientData?.profile;
                                        },
                                        postFunc: async (data) => {
                                            try {
                                                const updateReq =
                                                    await apiRequest(
                                                        'PATCH',
                                                        '/client/',
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
                                                        'user.clientData',
                                                        updateReq.data
                                                            .clientData
                                                    );
                                                    await getMatches();

                                                    setTimeout(
                                                        () =>
                                                            router.push(
                                                                '/onboarding/client/complete'
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
                    <div className="absolute bg-white shadow-xl rounded-xl w-[80vw] md:w-[30vw]">
                        <div className="px-4 py-5 sm:px-6">
                            <span className="text-xl font-medium text-gray-900">
                                Welcome aboard.
                            </span>

                            <div className="mt-4 w-full">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const updateReq = await apiRequest(
                                                'PATCH',
                                                '/client/',
                                                {
                                                    onboardingComplete: true,
                                                }
                                            );

                                            if (
                                                updateReq.status === 200 &&
                                                updateReq.data
                                            ) {
                                                localData.set(
                                                    'user.clientData',
                                                    updateReq.data.clientData
                                                );

                                                setTimeout(
                                                    () =>
                                                        router.push(
                                                            '/app/client/create-listing'
                                                        ),
                                                    1000
                                                );
                                                return true;
                                            } else return false;
                                        } catch {
                                            return false;
                                        }
                                    }}
                                    className="inline-flex w-full h-12 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 hover:filter hover:brightness-[95%] sm:col-start-1 sm:mt-0"
                                    disabled={
                                        completeSubmitting || completeSaved
                                    }
                                >
                                    {!completeSaved ? (
                                        'Create your first listing'
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

export default ClientOnboarding;
