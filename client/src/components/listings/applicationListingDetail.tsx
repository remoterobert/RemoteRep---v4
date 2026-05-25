import {
    CalendarDaysIcon,
    ClipboardDocumentCheckIcon,
    EnvelopeIcon,
    MapPinIcon,
    GlobeAltIcon,
    RocketLaunchIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { RoundButton } from 'components/commons/roundButton';
import { useRouter } from 'next/router';
import Rating from 'components/Stars/Rating';
import apiRequest from 'services/apiRequest';
import { Listing, TalentApplication } from 'types';
import * as localData from 'services/localData';
import * as formFields from 'services/formFields';
import { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, Transition } from '@headlessui/react';
import FormBuilder from 'components/forms/formBuilder';
import { useNotification } from 'contexts/NotificationContext';

const BrowseSkillCard: React.FC<{
    k: string;
    v: string | string[];
    match?: boolean;
}> = ({ k, v, match }) => {
    return (
        <div
            className={`text-xs rounded-full shadow-sm p-2 bg-background dark:bg-lightForeground inline-flex`}
        >
            <span
                className={`font-medium ${
                    match ? 'text-green-700' : 'text-subscribed'
                }`}
            >{`${k}:`}</span>
            <span
                className={`ml-1 font-bold ${match ? 'text-green-700' : 'text-subscribed'}`}
            >
                {Array.isArray(v) ? v.join(', ') : v}
            </span>
        </div>
    );
};

const ApplicationListingDetail = ({
    selectedApplication,
    update,
    setUpdate,
}: {
    selectedApplication: TalentApplication | Listing;
    update: number;
    setUpdate: (update: number) => void;
}) => {
    const [preferences, setPreferences] = useState<any>({});
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [selfId, setSelfId] = useState<string>('');
    const [showApply, setShowApply] = useState(false);
    const applicationForm = useForm();

    const router = useRouter();

    const { addNotification } = useNotification();

    const { photoUrl, ...clientData } =
        selectedApplication.client?.clientData?.profile || {};

    const rating = 4.3;
    const reviews = 52;
    
    const socialMediaLinks = {
        instagramUrl: 'https://www.instagram.com/',
        tiktokUrl: 'https://www.tiktok.com/',
        twitterUrl: 'https://twitter.com/',
        facebookUrl: 'https://www.facebook.com/'
    };

    useEffect(() => {
        setPreferences(localData.get('user.talentData') || {});
        setBookmarks(localData.get('user.talentData.bookmarkedListings') || []);
        setSelfId(localData.get('user.id') || '');
    }, []);

    return (
        <div className="h-full w-full bg-white dark:bg-darkForeground shadow-xl rounded-xl w-full overflow-y-auto scrollbar-thin overflow-x-auto">
            <div className="flex justify-between items-center w-full pl-8 pt-8 pr-8 text-black dark:text-white">
                        <div>
                            <span className="text-sm md:text-xl font-bold">
                                {(
                                        selectedApplication?.listing ||
                                        selectedApplication
                                    ).title || null}
                            </span>
                        </div>
                        <div className="justify-self-end">
                            <span className="text-sm">
                                Posted on: Feb 21,2024
                            </span>
                        </div>

            </div>

            <div className="w-full md:flex md:justify-between px-4 py-4">
                <div className="inline-flex">
                    {selectedApplication.client?.deleted ||
                    selectedApplication?.client?.suspended ? (
                        <div className="h-24 w-24 rounded-full bg-gray-500" />
                    ) : (
                        <img
                            src={
                                selectedApplication?.client?.clientData?.profile
                                    ?.photoUrl
                            }
                            className="h-16 w-16 md:h-24 md:w-24 rounded-full"
                        />
                    )}

                    <div className="ml-4 font-medium text-black dark:text-white flex items-center">
                        <div>
                            <div className="mt-2">
                                <span className="mt- text-lg whitespace-nowrap">
                                    {selectedApplication?.client?.contact
                                        ?.companyName || null}
                                </span>
                            </div>
                            <div className="mt-2">
                                <span className="text-sm inline-flex text-gray-700 dark:text-white">
                                    {selectedApplication.client?.deleted ? (
                                        'Deleted user'
                                    ) : selectedApplication.client
                                          ?.suspended ? (
                                        'Suspended user'
                                    ) : (
                                        <>
                                            <MapPinIcon className="my-auto h-4 w-4 text-gray-700" />
                                            {[
                                                selectedApplication?.client
                                                    ?.contact?.addressCity,
                                                selectedApplication?.client
                                                    ?.contact?.addressState,
                                                selectedApplication?.client
                                                    ?.contact?.addressCountry,
                                            ].join(', ')}
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {!selectedApplication.client?.deleted &&
                    !selectedApplication.client?.suspended && (
                        <div className="mt-4 md:mt-0 min-h-full flex justify-center items-center gap-2 px-4">
                            <div className="px-4 py-4 inline-flex">
                                <div className="flex justify-center items-center gap-2 md:gap-6 px-8">
                                    {!selectedApplication?.applications?.find(
                                        (a) => a?.talent === selfId
                                    )?.applicationStatus ? (
                                        <RoundButton
                                            {...{
                                                name: 'Apply',
                                                icon: ClipboardDocumentCheckIcon,
                                                onClick: () =>
                                                    setShowApply(true),
                                            }}
                                        />
                                    ) : null}
                                    {selectedApplication?.applications?.find(
                                        (a) => a?.talent === selfId
                                    )?.applicationStatus === 'invited' ? (
                                        <RoundButton
                                            {...{
                                                name: 'Accept invite',
                                                icon: ClipboardDocumentCheckIcon,
                                                onClick: () =>
                                                    setShowApply(true),
                                            }}
                                        />
                                    ) : null}
                                    {['interviewing', 'shortlisted'].includes(
                                        selectedApplication?.applications?.find(
                                            (a) => a?.talent === selfId
                                        )?.applicationStatus
                                    ) ? (
                                        <>
                                            {selectedApplication?.calendarLink && (
                                                <RoundButton
                                                    {...{
                                                        name: 'Schedule interview',
                                                        icon: CalendarDaysIcon,
                                                        onClick: () =>
                                                            window.open(
                                                                selectedApplication?.calendarLink,
                                                                '_blank'
                                                            ),
                                                    }}
                                                />
                                            )}

                                            <RoundButton
                                                {...{
                                                    name: 'Message',
                                                    icon: EnvelopeIcon,
                                                    onClick: () =>
                                                        router.push(
                                                            `/app/talent/chats?target=${selectedApplication.client.id}`
                                                        ),
                                                }}
                                            />
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    )}
            </div>

            <div className="flex items-center justify-center w-full bg-white dark:bg-darkForeground  pl-8 pr-8 pb-8">
                <Rating
                    rating={rating}
                    reviews={reviews}
                    instagramUrl={socialMediaLinks.instagramUrl}
                    tiktokUrl={socialMediaLinks.tiktokUrl}
                    twitterUrl={socialMediaLinks.twitterUrl}
                    facebookUrl={socialMediaLinks.facebookUrl}
                />
            </div>


            <div className="mx-8 mb-8">
                <ul className="grid grid-cols-12 list-disc px-4 text-black dark:text-white">
                    <li className="col-span-4 mb-4">Company Age: 12 yrs</li>
                    <li className="col-span-4 mb-4">Sales team size: 23</li>
                    <li className="col-span-4 mb-4">B2B</li>
                    <li className="col-span-4">Average Rep Earnings</li>
                    <li className="col-span-4">The rep's desired role</li>
                    <li className="col-span-4">Full time</li>
                </ul>
            </div>

            <div className="grid grid-cols-12 w-full mb-8">
                        <div className="col-span-4 text-center pl-8 pr-4">
                            <div className="h-36 bg-background dark:bg-lightForeground rounded-lg flex flex-col justify-center items-center text-black dark:text-white">
                                    <GlobeAltIcon className="w-[42px] mb-4"/>
                                    <p>Website/Funnel</p>
                            </div>
                        </div>
                        <div className="col-span-4 text-center pl-4 pr-4">
                            <div className="h-36 bg-background dark:bg-lightForeground rounded-lg flex flex-col justify-center items-center text-black dark:text-white">
                                    <DocumentTextIcon className="w-[42px] mb-4"/>
                                    <p>View Application</p>
                            </div>
                        </div>
                        <div className="col-span-4 text-center pl-4 pr-8">
                            <div className="h-36 bg-background dark:bg-lightForeground rounded-lg flex flex-col justify-center items-center text-black dark:text-white">
                                    <RocketLaunchIcon className="w-[42px] mb-4"/>
                                    <p>Hiring Procees</p>
                            </div>
                        </div>
            </div>  

            {!selectedApplication.client?.deleted && (
                <>
                    {(selectedApplication?.listing || selectedApplication)
                        .description && (
                        <>
                            <div className="flex justify-between items-center px-8 mb-4 text-black dark:text-white">
                                <p className="text-xl font-bold">Job Details</p>
                                <p>Posted on:Feb 21, 2024</p>
                            </div>
                            <div className="relative">
                                
                                <div className="relative flex">
                                    <span className="ml-8 text-lg font-semibold leading-6 text-black dark:text-white">
                                        Job Description
                                    </span>
                                </div>
                            </div>
                            <div className="px-8 py-2 mb-4 text-black dark:text-white">
                                <p className="mt-2 break-words whitespace-pre-wrap">
                                    {
                                        (
                                            selectedApplication?.listing ||
                                            selectedApplication
                                        ).description
                                    }
                                </p>
                            </div>
                            <div className="mx-8 mb-4">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                        </>
                    )}

                    {(selectedApplication?.listing || selectedApplication)
                        .instructions && (
                        <>
                            <div className="relative">
                                
                                <div className="relative flex">
                                    <span className="ml-8 bg-white text-lg font-semibold leading-6 text-black dark:text-white">
                                        Application instructions
                                    </span>
                                </div>
                            </div>
                            <div className="px-8 py-2 mb-4">
                                <p className="mt-2 break-words whitespace-pre-wrap">
                                    {
                                        (
                                            selectedApplication?.listing ||
                                            selectedApplication
                                        ).instructions
                                    }
                                </p>
                            </div>
                            <div className="mx-8 mb-4">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                        </>
                    )}

                    {(selectedApplication?.listing || selectedApplication)
                        .details &&
                        Object.values(
                            (
                                selectedApplication?.listing ||
                                selectedApplication
                            ).details
                        ).some((v: any) => v) && (
                            <>
                                <div className="relative">
                                    <div className="relative flex">
                                        <span className="ml-8 text-lg font-semibold leading-6 text-black dark:text-white">
                                            Details
                                        </span>
                                    </div>
                                </div>
                                <div className="px-8 py-2">
                                    {(
                                        selectedApplication?.listing ||
                                        selectedApplication
                                    ).details ? (
                                        <>
                                            <div className="py-2 flex flex-wrap gap-2">
                                                {Object.entries(
                                                    (
                                                        selectedApplication?.listing ||
                                                        selectedApplication
                                                    ).details
                                                ).map(([k, v]: any) => {
                                                    return v ? (
                                                        <BrowseSkillCard
                                                            {...{
                                                                k: (
                                                                    formFields.get(
                                                                        'listingDetails'
                                                                    ) as any[]
                                                                ).find(
                                                                    (f: any) =>
                                                                        f.name ===
                                                                        k
                                                                ).label,
                                                                v,
                                                                match: !(
                                                                    (k ==
                                                                        'salesRole' &&
                                                                        (!preferences
                                                                            ?.goals
                                                                            ?.salesRoles ||
                                                                            !preferences?.goals?.salesRoles?.includes(
                                                                                (
                                                                                    selectedApplication?.listing ||
                                                                                    selectedApplication
                                                                                )
                                                                                    .details
                                                                                    ?.salesRole
                                                                            ))) ||
                                                                    (k ==
                                                                        'commitment' &&
                                                                        (!preferences
                                                                            ?.goals
                                                                            ?.commitments ||
                                                                            !preferences?.goals?.commitments?.includes(
                                                                                (
                                                                                    selectedApplication?.listing ||
                                                                                    selectedApplication
                                                                                )
                                                                                    .details
                                                                                    ?.commitment
                                                                            ))) ||
                                                                    (k ==
                                                                        'compensationType' &&
                                                                        (!preferences
                                                                            ?.goals
                                                                            ?.compensationTypes ||
                                                                            !preferences?.goals?.compensationTypes?.includes(
                                                                                (
                                                                                    selectedApplication?.listing ||
                                                                                    selectedApplication
                                                                                )
                                                                                    .details
                                                                                    ?.compensationType
                                                                            ))) ||
                                                                    (k ==
                                                                        'benefits' &&
                                                                        (!preferences
                                                                            ?.goals
                                                                            ?.benefits ||
                                                                            !preferences?.goals?.benefits?.every(
                                                                                (
                                                                                    b: string
                                                                                ) =>
                                                                                    (
                                                                                        selectedApplication?.listing ||
                                                                                        selectedApplication
                                                                                    ).details?.benefits.includes(
                                                                                        b
                                                                                    )
                                                                            ))) ||
                                                                    (k ==
                                                                        'minimumCompensation' &&
                                                                        (!preferences
                                                                            ?.goals
                                                                            ?.minimumCompensation ||
                                                                            preferences
                                                                                ?.goals
                                                                                ?.minimumCompensation >
                                                                                ((
                                                                                    selectedApplication?.listing ||
                                                                                    selectedApplication
                                                                                )
                                                                                    .details
                                                                                    ?.minimumCompensation ||
                                                                                    0)))
                                                                ),
                                                            }}
                                                        />
                                                    ) : null;
                                                })}
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                                <div className="mx-8 mb-4">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                            </>
                        )}

                    {(selectedApplication?.listing || selectedApplication)
                        .requirements &&
                        Object.values(
                            (
                                selectedApplication?.listing ||
                                selectedApplication
                            ).requirements
                        ).some((v: any) => v) && (
                            <>
                                <div className="relative text-black dark:text-white">
                                    <div className="relative flex">
                                        <span className="ml-8 text-lg font-semibold leading-6">
                                            Requirements
                                        </span>
                                    </div>
                                </div>
                                <div className="px-8 py-2">
                                    {(
                                        selectedApplication?.listing ||
                                        selectedApplication
                                    ).requirements ? (
                                        <>
                                            <div className="py-2 flex flex-wrap gap-2">
                                                {Object.entries(
                                                    (
                                                        selectedApplication?.listing ||
                                                        selectedApplication
                                                    ).requirements
                                                ).map(([k, v]: any) => {
                                                    return v ? (
                                                        <BrowseSkillCard
                                                            {...{
                                                                k: (
                                                                    formFields.get(
                                                                        'listingRequirements'
                                                                    ) as any[]
                                                                ).find(
                                                                    (f: any) =>
                                                                        f.name ===
                                                                        k
                                                                ).label,
                                                                v,
                                                                match: !(
                                                                    (k ===
                                                                        'yearsOfExperience' &&
                                                                        (!preferences
                                                                            ?.experience
                                                                            ?.yearsOfExperience ||
                                                                            (
                                                                                selectedApplication?.listing ||
                                                                                selectedApplication
                                                                            )
                                                                                .requirements
                                                                                .yearsOfExperience >
                                                                                preferences
                                                                                    ?.experience
                                                                                    ?.yearsOfExperience)) ||
                                                                    (k ===
                                                                        'technologies' &&
                                                                        !(
                                                                            selectedApplication?.listing ||
                                                                            selectedApplication
                                                                        ).requirements.technologies.every(
                                                                            (
                                                                                t: string
                                                                            ) =>
                                                                                preferences?.experience?.technologies?.includes(
                                                                                    t
                                                                                )
                                                                        )) ||
                                                                    (k ===
                                                                        'leadTypes' &&
                                                                        !(
                                                                            selectedApplication?.listing ||
                                                                            selectedApplication
                                                                        ).requirements?.leadTypes?.some(
                                                                            (
                                                                                l: string
                                                                            ) =>
                                                                                preferences?.experience?.leadTypes?.includes(
                                                                                    l
                                                                                )
                                                                        )) ||
                                                                    (k ===
                                                                        'education' &&
                                                                        !(
                                                                            selectedApplication?.listing ||
                                                                            selectedApplication
                                                                        ).requirements.education.includes(
                                                                            preferences
                                                                                ?.experience
                                                                                ?.education
                                                                        )) ||
                                                                    (k ===
                                                                        'salesRoles' &&
                                                                        !(
                                                                            selectedApplication?.listing ||
                                                                            selectedApplication
                                                                        ).requirements.salesRoles.some(
                                                                            (
                                                                                s: string
                                                                            ) =>
                                                                                preferences?.experience?.salesRoles?.includes(
                                                                                    s
                                                                                )
                                                                        )) ||
                                                                    (k ===
                                                                        'industries' &&
                                                                        !(
                                                                            selectedApplication?.listing ||
                                                                            selectedApplication
                                                                        ).requirements.industries.some(
                                                                            (
                                                                                i: string
                                                                            ) =>
                                                                                preferences?.experience?.industries?.includes(
                                                                                    i
                                                                                )
                                                                        )) ||
                                                                    (k ===
                                                                        'salesCycles' &&
                                                                        !(
                                                                            selectedApplication?.listing ||
                                                                            selectedApplication
                                                                        ).requirements.salesCycles.some(
                                                                            (
                                                                                s: string
                                                                            ) =>
                                                                                preferences?.experience?.salesCycles?.includes(
                                                                                    s
                                                                                )
                                                                        )) ||
                                                                    (k ===
                                                                        'salesTypes' &&
                                                                        !(
                                                                            selectedApplication?.listing ||
                                                                            selectedApplication
                                                                        ).requirements.salesTypes.some(
                                                                            (
                                                                                s: string
                                                                            ) =>
                                                                                preferences?.experience?.salesTypes?.includes(
                                                                                    s
                                                                                )
                                                                        )) ||
                                                                    (k ===
                                                                        'decisionMakers' &&
                                                                        !(
                                                                            selectedApplication?.listing ||
                                                                            selectedApplication
                                                                        ).requirements.decisionMakers.some(
                                                                            (
                                                                                d: string
                                                                            ) =>
                                                                                preferences?.experience?.decisionMakers?.includes(
                                                                                    d
                                                                                )
                                                                        )) ||
                                                                    (k ===
                                                                        'dealAmounts' &&
                                                                        !(
                                                                            selectedApplication?.listing ||
                                                                            selectedApplication
                                                                        ).requirements.dealAmounts.some(
                                                                            (
                                                                                d: string
                                                                            ) =>
                                                                                preferences?.experience?.dealAmounts?.includes(
                                                                                    d
                                                                                )
                                                                        )) ||
                                                                    (k ===
                                                                        'salesVolumes' &&
                                                                        !(
                                                                            selectedApplication?.listing ||
                                                                            selectedApplication
                                                                        ).requirements.salesVolumes.some(
                                                                            (
                                                                                s: string
                                                                            ) =>
                                                                                preferences?.experience?.salesVolumes?.includes(
                                                                                    s
                                                                                )
                                                                        )) ||
                                                                    (k ===
                                                                        'salesEnvironments' &&
                                                                        !(
                                                                            selectedApplication?.listing ||
                                                                            selectedApplication
                                                                        ).requirements.salesEnvironments.some(
                                                                            (
                                                                                s: string
                                                                            ) =>
                                                                                preferences?.experience?.salesEnvironments?.includes(
                                                                                    s
                                                                                )
                                                                        ))
                                                                ),
                                                            }}
                                                        />
                                                    ) : null;
                                                })}
                                            </div>
                                        </>
                                    ) : null}
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
                                                            Are you sure you
                                                            want to apply for{' '}
                                                            <span className="font-medium">
                                                                {selectedApplication?.title ||
                                                                    selectedApplication
                                                                        ?.listing
                                                                        ?.title}
                                                            </span>
                                                            ?
                                                            <br />
                                                            Your resume and
                                                            profile details will
                                                            be shared with the
                                                            hiring manager.
                                                        </p>
                                                        <div className="mt-6">
                                                            <FormBuilder
                                                                formHook={
                                                                    applicationForm
                                                                }
                                                                formName="listingApplication"
                                                                postFunc={async (
                                                                    data: any
                                                                ) => {
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
                                                                                        (
                                                                                            selectedApplication?.listing ||
                                                                                            selectedApplication
                                                                                        )
                                                                                            ?.id,
                                                                                }
                                                                            );

                                                                        if (
                                                                            applyReq.status ===
                                                                            201
                                                                        ) {
                                                                            addNotification(
                                                                                {
                                                                                    type: 'success',
                                                                                    title: 'Application sent successfully',
                                                                                    text: 'You will be notified when the client accepts your application...',
                                                                                }
                                                                            );
                                                                            setTimeout(
                                                                                () =>
                                                                                    setShowApply(
                                                                                        false
                                                                                    ),
                                                                                1000
                                                                            );

                                                                            setUpdate(
                                                                                update +
                                                                                    1
                                                                            );

                                                                            return true;
                                                                        } else
                                                                            return false;
                                                                    } catch {
                                                                        addNotification(
                                                                            {
                                                                                type: 'error',
                                                                                title: 'Error sending application',
                                                                                text: 'Please try again later...',
                                                                            }
                                                                        );
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
                            </>
                        )}
                </>
            )}
        </div>
    );
};

export default ApplicationListingDetail;
