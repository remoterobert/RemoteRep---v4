import type { NextPage } from 'next';
import {
    EnvelopeIcon,
    BookmarkIcon,
    UserCircleIcon,
    UserIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import {
    ArrowTopRightOnSquareIcon,
    MapPinIcon,
    PencilSquareIcon,
} from '@heroicons/react/20/solid';
import * as localData from '../../../services/localData';
import * as formFields from '../../../services/formFields';
import { useForm } from 'react-hook-form';
import { Dialog, Transition } from '@headlessui/react';
import FormBuilder from '../../../components/forms/formBuilder';
import apiRequest from '../../../services/apiRequest';
import { PageHeader } from 'components/commons/pageHeader';

const SkillCard: React.FC<{ k: string; v: string | string[] }> = ({ k, v }) => {
    return (
        <div className="text-xs border-2 rounded-full shadow-sm p-2 bg-white inline-flex">
            <span className="font-medium text-gray-900">{`${k}:`}</span>
            <span className="ml-1 text-gray-700">
                {Array.isArray(v) ? v.join(', ') : v}
            </span>
        </div>
    );
};

const EditWrapper: React.FC<{
    children: React.ReactNode;
    onClick: () => void;
}> = ({ children, onClick }) => {
    return (
        <div
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className="group border-dashed border-2 border-primary/50 hover:border-primary rounded-md p-1"
        >
            <PencilSquareIcon className="float-right h-4 w-4 text-primary/50 group-hover:text-primary" />
            <div className="p-3">{children}</div>
        </div>
    );
};

const TalentProfile: NextPage = () => {
    const [user, setUser] = useState<any>({});

    const [photoUpdate, setPhotoUpdate] = useState(0);
    const profileForm = useForm();
    const profileData = profileForm.watch();
    const [showProfileForm, setShowProfileForm] = useState(false);
    const experienceForm = useForm();
    const experienceData = experienceForm.watch();
    const [showExperienceForm, setShowExperienceForm] = useState(false);
    const goalsForm = useForm();
    const goalsData = goalsForm.watch();
    const [showGoalsForm, setShowGoalsForm] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;

        const localUser = localData.get('user');
        setUser(localUser);
    }, []);

    return (
        <>
            {/* Common header */}
            <PageHeader {...{ title: 'Profile', icon: UserIcon }} />

            {/* Page-specific content */}

            <div className="flex items-center justify-center mt-[40vh]">
                <div className="absolute bg-white shadow-xl rounded-xl w-[80vw] md:w-[60vw]">
                    <div className="w-full flex justify-between px-4 py-4">
                        <div className="inline-flex">
                            <EditWrapper
                                onClick={() => setShowProfileForm(true)}
                            >
                                {profileData?.photoUrl ||
                                user?.talentData?.profile?.photoUrl ? (
                                    <img
                                        src={`${
                                            profileData?.photoUrl ||
                                            user?.talentData?.profile?.photoUrl
                                        }?${photoUpdate}`}
                                        className="h-24 w-24 rounded-full"
                                    />
                                ) : (
                                    <UserCircleIcon
                                        className="h-24 w-24 text-gray-300"
                                        aria-hidden="true"
                                    />
                                )}
                            </EditWrapper>

                            <div className="ml-4 font-medium text-gray-900 flex items-center">
                                <div>
                                    <EditWrapper
                                        onClick={() =>
                                            router.push('/app/talent/settings')
                                        }
                                    >
                                        <span className="text-2xl">
                                            {`${user?.contact?.firstName} ${user?.contact?.lastName}`}
                                        </span>
                                        <div className="mt-2">
                                            <span className="text-md inline-flex text-gray-700">
                                                <MapPinIcon className="h-5 w-5 text-gray-700" />
                                                {[
                                                    user?.contact?.addressCity,
                                                    user?.contact?.addressState,
                                                    user?.contact
                                                        ?.addressCountry,
                                                ].join(', ')}
                                            </span>
                                        </div>
                                    </EditWrapper>
                                </div>
                            </div>
                        </div>
                    </div>

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
                    <div className="px-8 py-4 text-gray-700">
                        <EditWrapper onClick={() => setShowProfileForm(true)}>
                            <h3 className="font-medium inline-flex">
                                {profileData?.headline ||
                                user?.talentData?.profile?.headline
                                    ? `${
                                          profileData?.headline ||
                                          user?.talentData?.profile?.headline
                                      } `
                                    : null}
                                {profileData?.videoUrl ||
                                user?.talentData?.profile?.videoUrl ? (
                                    <span className="ml-2">
                                        |{' '}
                                        <span
                                            className="text-primary hover:underline inline-flex items-center"
                                            onClick={() =>
                                                window.open(
                                                    profileData?.videoUrl ||
                                                        user?.talentData
                                                            ?.profile?.videoUrl,
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
                                {profileData?.about ||
                                    user?.talentData?.profile?.about}
                            </p>
                        </EditWrapper>
                    </div>

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
                        <EditWrapper
                            onClick={() => setShowExperienceForm(true)}
                        >
                            {(experienceData &&
                                Object.values(experienceData).some(
                                    (v: any) => v
                                )) ||
                            user?.talentData?.experience ? (
                                <>
                                    <div className="py-2 flex flex-wrap gap-2">
                                        {Object.entries(
                                            Object.values(experienceData).some(
                                                (v: any) => v
                                            )
                                                ? experienceData
                                                : user?.talentData?.experience
                                        ).map(([k, v]: any) => {
                                            return v ? (
                                                <SkillCard
                                                    {...{
                                                        k: (
                                                            formFields.get(
                                                                'talentExperience'
                                                            ) as any[]
                                                        ).find(
                                                            (f: any) =>
                                                                f.name === k
                                                        ).label,
                                                        v,
                                                    }}
                                                />
                                            ) : null;
                                        })}
                                    </div>
                                </>
                            ) : null}
                        </EditWrapper>
                    </div>

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
                        <EditWrapper onClick={() => setShowGoalsForm(true)}>
                            {(goalsData &&
                                Object.values(goalsData).some((v: any) => v)) ||
                            user?.talentData?.goals ? (
                                <>
                                    <div className="py-2 flex flex-wrap gap-2">
                                        {Object.entries(
                                            Object.values(goalsData).some(
                                                (v: any) => v
                                            )
                                                ? goalsData
                                                : user?.talentData?.goals
                                        ).map(([k, v]: any) => {
                                            return v ? (
                                                <SkillCard
                                                    {...{
                                                        k: (
                                                            formFields.get(
                                                                'talentGoals'
                                                            ) as any[]
                                                        ).find(
                                                            (f: any) =>
                                                                f.name === k
                                                        ).label,
                                                        v,
                                                    }}
                                                />
                                            ) : null;
                                        })}
                                    </div>
                                </>
                            ) : null}
                        </EditWrapper>
                    </div>
                </div>
            </div>

            <Transition.Root show={showProfileForm} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={setShowProfileForm}
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
                                    <FormBuilder
                                        {...{
                                            formHook: profileForm,
                                            formName: 'talentProfile',
                                            submitText: 'Save',
                                            getFunc: async () => {
                                                return user?.talentData
                                                    ?.profile;
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
                                                        updateReq.status ===
                                                            200 &&
                                                        updateReq.data
                                                    ) {
                                                        localData.set(
                                                            'user.talentData',
                                                            updateReq.data
                                                                .talentData
                                                        );

                                                        setPhotoUpdate(
                                                            photoUpdate + 1
                                                        );

                                                        setTimeout(
                                                            () =>
                                                                setShowProfileForm(
                                                                    false
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
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            <Transition.Root show={showExperienceForm} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={setShowExperienceForm}
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
                                    <FormBuilder
                                        {...{
                                            formHook: experienceForm,
                                            formName: 'talentExperience',
                                            submitText: 'Save',
                                            getFunc: async () => {
                                                return user?.talentData
                                                    ?.experience;
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
                                                        updateReq.status ===
                                                            200 &&
                                                        updateReq.data
                                                    ) {
                                                        localData.set(
                                                            'user.talentData',
                                                            updateReq.data
                                                                .talentData
                                                        );

                                                        setTimeout(
                                                            () =>
                                                                setShowExperienceForm(
                                                                    false
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
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            <Transition.Root show={showGoalsForm} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={setShowGoalsForm}
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
                                    <FormBuilder
                                        {...{
                                            formHook: goalsForm,
                                            formName: 'talentGoals',
                                            submitText: 'Save',
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
                                                                            if (
                                                                                v
                                                                            )
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
                                                        updateReq.status ===
                                                            200 &&
                                                        updateReq.data
                                                    ) {
                                                        localData.set(
                                                            'user.talentData',
                                                            updateReq.data
                                                                .talentData
                                                        );

                                                        setTimeout(
                                                            () =>
                                                                setShowGoalsForm(
                                                                    false
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
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    );
};

export default TalentProfile;
