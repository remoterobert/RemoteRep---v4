import { Dialog, Listbox, Transition } from '@headlessui/react';
import {
    ArrowTopRightOnSquareIcon,
    Bars2Icon,
    BookmarkIcon,
    CheckIcon,
    ChevronUpDownIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    HandThumbDownIcon,
    HandThumbUpIcon,
    MapPinIcon,
    UserIcon,
    UserPlusIcon,
    DocumentCheckIcon,
    PlayIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState, Dispatch, SetStateAction } from 'react';
import apiRequest from 'services/apiRequest';
import { ApplicationStatus, Listing, Talent, TalentApplication } from 'types';
import {
    BookmarkIcon as SolidBookmarkIcon,
    HandThumbDownIcon as SolidHandThumbDownIcon,
    HandThumbUpIcon as SolidHandThumbUpIcon,
} from '@heroicons/react/24/solid';
import * as formFields from 'services/formFields';
import { RoundButton } from 'components/commons/roundButton';
import { useNotification } from 'contexts/NotificationContext';
import RatingButton from './ratingButton';
import Rating from 'components/Stars/Rating';
import { ResumeModal } from 'components/commons/resumeModal';

const ratingIcons = [[HandThumbDownIcon], [Bars2Icon], [HandThumbUpIcon]];

const BrowseSkillCard: React.FC<{
    k: string;
    v: string | string[];
    match?: boolean;
}> = ({ k, v, match }) => {
    return (
        <div
            className={`text-xs rounded-full shadow-sm p-2 inline-flex bg-background dark:bg-lightForeground`}
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

const ApplicationTalentDetail = ({
    application,
    listing,
    update,
    bookmarks,
    preferences,
    bookmark,
    setUpdate,
    onChangeListing,
    hasAccess,
    setShowCreateModal,
}: {
    application:
        | (Omit<TalentApplication, 'talent'> & { talent: Talent })
        | Talent;
    listing: Listing;
    update: number;
    bookmarks: string[];
    preferences: any;
    bookmark: (talentId: string, bookmarked: boolean) => void;
    setUpdate: (update: number) => void;
    onChangeListing: ({
        status,
        rating,
    }: {
        status?: ApplicationStatus;
        rating?: number;
    }) => void;
    hasAccess: boolean;
    setShowCreateModal: Dispatch<SetStateAction<boolean>>;
}) => {
    const router = useRouter();
    const [resumeModalShown, setResumeModalShown] = useState(false);
    const [actuallyHiredShown, setActuallyHiredShown] = useState(false);

    const { addNotification } = useNotification();

    const suspendedOrDeleted =
        (application?.talent || application)?.deleted ||
        (application?.talent || application)?.suspended;

    const rating = 4.3;
    const reviews = 52;
        
    const socialMediaLinks = {
        instagramUrl: 'https://www.instagram.com/',
        tiktokUrl: 'https://www.tiktok.com/',
        twitterUrl: 'https://twitter.com/',
        facebookUrl: 'https://www.facebook.com/'
    };

    return (
        <>
            {application ? (
                <>
                    <div className="w-full grid md:gap-0 md:flex md:justify-between px-8 py-8">
                        <div className="inline-flex">
                            {suspendedOrDeleted ? (
                                <div className="h-16 w-16 md:h-24 md:w-24 rounded-full bg-gray-500" />
                            ) : (application?.talent || application)?.talentData
                                  ?.profile?.photoUrl ? (
                                <img
                                    src={
                                        (application?.talent || application)
                                            ?.talentData?.profile?.photoUrl
                                    }
                                    className="h-16 w-16 md:h-24 md:w-24 rounded-full"
                                />
                            ) : (
                                <UserIcon className="h-16 w-16 md:h-24 md:w-24 rounded-full text-gray-300 bg-gray-100" />
                            )}

                            <div className="ml-4 font-medium text-black dark:text-white flex items-center">
                                <div>
                                    <div className="mt-2">
                                        <span className="mt- text-lg whitespace-nowrap">
                                            {(
                                                application?.talent ||
                                                application
                                            )?.deleted ? (
                                                'Deleted User'
                                            ) : (
                                                  application?.talent ||
                                                  application
                                              )?.suspended ? (
                                                'Suspended user'
                                            ) : (
                                                <>
                                                    {
                                                        (
                                                            application?.talent ||
                                                            application
                                                        )?.contact?.firstName
                                                    }
                                                    <span
                                                        className={`ml-1 ${
                                                            hasAccess
                                                                ? ''
                                                                : 'blur-sm'
                                                        }`}
                                                    >
                                                        {
                                                            (
                                                                application?.talent ||
                                                                application
                                                            )?.contact?.lastName
                                                        }
                                                    </span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        {!suspendedOrDeleted && (
                                            <>
                                            <span>{(application?.talent ||
                                                application
                                            )?.talentData?.profile?.headline}
                                            </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!suspendedOrDeleted && (
                            <div className="inline-flex">
                                <div className="min-h-full flex justify-center items-center gap-2 px-4">
                                    <div
                                        className={
                                            !application?.applicationStatus
                                                ? ''
                                                : 'w-48'
                                        }
                                    >
                                        {!application?.applicationStatus ? (
                                            <RoundButton
                                                {...{
                                                    icon: UserPlusIcon,
                                                    name: 'Invite to apply',
                                                    onClick: () =>
                                                        apiRequest(
                                                            'POST',
                                                            `/client/listings/${listing?.id}/applications`,
                                                            {
                                                                talentId: (
                                                                    application?.talent ||
                                                                    application
                                                                ).id,
                                                            }
                                                        )
                                                            .then((data) => {
                                                                if (
                                                                    data.status ===
                                                                    403
                                                                )
                                                                    setShowCreateModal(
                                                                        true
                                                                    );
                                                                else {
                                                                    addNotification(
                                                                        {
                                                                            type: 'success',
                                                                            title: 'Talent invited successfully',
                                                                            text: 'Refreshing your view...',
                                                                        }
                                                                    );

                                                                    setUpdate(
                                                                        update +
                                                                            1
                                                                    );
                                                                }
                                                            })
                                                            .catch((data) => {
                                                                if (
                                                                    data.status ===
                                                                    403
                                                                )
                                                                    setShowCreateModal(
                                                                        true
                                                                    );
                                                                else
                                                                    addNotification(
                                                                        {
                                                                            type: 'error',
                                                                            title: 'Error inviting talent',
                                                                            text: 'Please try again later...',
                                                                        }
                                                                    );
                                                            }),
                                                    className: 'text-primary',
                                                }}
                                            />
                                        ) : application?.applicationStatus ===
                                          'invited' ? (
                                            <div className="group">
                                                <input
                                                    {...{
                                                        type: 'text',
                                                        className:
                                                            'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500',
                                                        disabled: true,
                                                        value: 'Waiting for talent to accept your invite...',
                                                    }}
                                                />
                                                <p className="hidden group-hover:block absolute mt-2 p-2 rounded-md bg-gray-800 text-white">
                                                    Waiting for talent to accept
                                                    your invite...
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                    <RoundButton
                                        {...{
                                            icon: EnvelopeIcon,
                                            name: 'Message talent',
                                            onClick: () =>
                                                router.push(
                                                    `/app/client/chats?target=${
                                                        (
                                                            application?.talent ||
                                                            application
                                                        ).id
                                                    }`
                                                ),
                                            className: 'text-primary',
                                        }}
                                    />

                                    {bookmarks.includes(
                                        (application?.talent || application).id
                                    ) ? (
                                        <RoundButton
                                            {...{
                                                icon: SolidBookmarkIcon,
                                                name: 'Unbookmark',
                                                onClick: () =>
                                                    bookmark(
                                                        (
                                                            application?.talent ||
                                                            application
                                                        ).id,
                                                        false
                                                    ),
                                                className: 'text-subscribed',
                                            }}
                                        />
                                    ) : (
                                        <RoundButton
                                            {...{
                                                icon: BookmarkIcon,
                                                name: 'Bookmark',
                                                onClick: () =>
                                                    bookmark(
                                                        (
                                                            application?.talent ||
                                                            application
                                                        ).id,
                                                        true
                                                    ),
                                                className: 'text-primary',
                                            }}
                                        />
                                    )}

                                    {((application?.talent || application)
                                        ?.talent?.resume ||
                                        !hasAccess) && (
                                        <RoundButton
                                            {...{
                                                icon: DocumentTextIcon,
                                                name: 'View résumé',
                                                onClick: () => {
                                                    if (!hasAccess)
                                                        setShowCreateModal(
                                                            true
                                                        );
                                                    else
                                                        setResumeModalShown(
                                                            true
                                                        );
                                                },
                                                className: 'text-primary',
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center w-full pl-8 pr-8 mb-4 text-black dark:text-white">
                        <div>
                            <span className="text-sm inline-flex text-gray-700 dark:text-white">
                                                    <MapPinIcon className="my-auto h-4 w-4" />
                                                    <span
                                                        className={`ml-1 ${
                                                            hasAccess
                                                                ? ''
                                                                : 'blur-sm'
                                                        }`}
                                                    >
                                                        {
                                                            (
                                                                application?.talent ||
                                                                application
                                                            )?.contact?.addressCity
                                                        }
                                                    </span>
                                                    ,
                                                    <span
                                                        className={`ml-1 ${
                                                            hasAccess
                                                                ? ''
                                                                : 'blur-sm'
                                                        }`}
                                                    >
                                                        {
                                                            (
                                                                application?.talent ||
                                                                application
                                                            )?.contact?.addressState
                                                        }
                                                    </span>
                                                    {', '}
                                                    {
                                                        (
                                                            application?.talent ||
                                                            application
                                                        )?.contact?.addressCountry
                                                    }
                            </span>
                        </div>
                        <div className='inline-flex items-center'>
                            {!suspendedOrDeleted && application?.applicationStatus && (
                                        <div className="inline-flex items-center">
                                            <div className='inline-flex items-center mr-4'>
                                                <div
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        onChangeListing({
                                                            rating:
                                                                application?.applicationRating ===
                                                                1
                                                                    ? 0
                                                                    : 1,
                                                        });
                                                    }}
                                                    className="flex p-2 h-10 w-10 rounded-md"
                                                >
                                                        <RatingButton
                                                            {...{
                                                                IconComp:
                                                                    SolidHandThumbUpIcon,
                                                                AltIconComp:
                                                                    HandThumbUpIcon,
                                                                showAlt:
                                                                    application?.applicationRating !==
                                                                    1,
                                                            }}
                                                        />
                                                </div>
                                                <p className="">0</p>
                                            </div>
                                            <div className='inline-flex items-center mr-4'>
                                                <div
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        onChangeListing({
                                                            rating:
                                                                application?.applicationRating ===
                                                                -1
                                                                    ? 0
                                                                    : -1,
                                                        });
                                                    }}
                                                    className="my-auto group p-2 h-10 w-10 rounded-md"
                                                >
                                                    <RatingButton
                                                        {...{
                                                            IconComp:
                                                                SolidHandThumbDownIcon,
                                                            AltIconComp:
                                                                HandThumbDownIcon,
                                                            showAlt:
                                                                application?.applicationRating !==
                                                                -1,
                                                        }}
                                                    />
                                                </div>
                                                <p className="">0</p>
                                            </div>
                                        </div>
                                    )}
                            {(application?.applicationStatus && application?.applicationStatus !== "invited") ? (
                                                <Listbox
                                                    value={
                                                        application?.applicationStatus
                                                    }
                                                    onChange={(data) =>
                                                        onChangeListing({
                                                            status: data,
                                                        })
                                                    }
                                                >
                                                    <div className="relative">
                                                        <Listbox.Button className="relative w-[150px] cursor-default overflow-hidden rounded-lg bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                                                            <span className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                                                {`${application?.applicationStatus[0].toUpperCase()}${application?.applicationStatus.slice(
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
                                                                    (option, i) => (
                                                                        <Listbox.Option
                                                                            key={i}
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
                            ) : null}
                        </div>
                    </div>

                    {application?.applicationMessage && (
                        <>
                            <div className="relative text-black dark:text-white">
                                <div className="relative flex">
                                    <span className="ml-8 text-base font-semibold leading-6">
                                        Message from applicant
                                    </span>
                                </div>
                            </div>
                            <div className="px-8 py-2 text-black dark:text-white">
                                <p className="break-words whitespace-pre-wrap text-black dark:text-white">
                                    {application?.applicationMessage}
                                </p>
                            </div>
                        </>
                    )}

                <div className="flex items-center justify-center w-full bg-white dark:bg-darkForeground pl-8 pr-8 pb-8">
                    <Rating
                        rating={rating}
                        reviews={reviews}
                        instagramUrl={socialMediaLinks.instagramUrl}
                        tiktokUrl={socialMediaLinks.tiktokUrl}
                        twitterUrl={socialMediaLinks.twitterUrl}
                        facebookUrl={socialMediaLinks.facebookUrl}
                    />
                </div>

                <div className="mx-8 mb-8 text-black dark:text-white">
                    <ul className="grid grid-cols-12 list-disc px-4">
                        <li className="col-span-4 mb-4">2 years of experience</li>
                        <li className="col-span-4 mb-4">Annual Sales: +$250k/yr</li>
                        <li className="col-span-4 mb-4">Personality type</li>
                        <li className="col-span-4">Full Time</li>
                        <li className="col-span-4">The rep's desired role</li>
                    </ul>
                </div>
                
                <div className="mx-8 mb-4">
                        <div className="w-full border-t border-gray-300" />
                </div>

                <div className='px-8'>
                        <h4 className='text-black dark:text-white text-base md:text-lg font-semibold mb-4'>Rapid Hire Resources</h4>
            <div className="grid grid-cols-12 w-full gap-8 mb-8 text-black dark:text-white">
                        <div className="col-span-4 text-center">
                            <div className="h-36 bg-background dark:bg-lightForeground rounded-lg flex flex-col justify-center items-center">
                                    <PlayIcon className="w-[42px] mb-4"/>
                            </div>
                        </div>
                        <div className="col-span-4 text-center">
                            <div className="h-36 bg-background dark:bg-lightForeground rounded-lg flex flex-col justify-center items-center">
                                    <DocumentTextIcon className="w-[42px] mb-4"/>
                                    <p>Resume</p>
                            </div>
                        </div>
                        <div className="col-span-4 text-center">
                            <div className="h-36 bg-background dark:bg-lightForeground rounded-lg flex flex-col justify-center items-center">
                                    <DocumentCheckIcon className="w-[42px] mb-4"/>
                                    <p>View Application</p>
                            </div>
                        </div>
                    </div>
                    </div>
                    <div className="mx-8 mb-4">
                        <div className="w-full border-t border-gray-300" />
                    </div>

                    {(application?.talent || application)?.talentData?.profile
                        ?.about && (
                        <>
                            <div className="relative text-black dark:text-white">
                                
                                <div className="relative flex">
                                    <span className="ml-8 text-lg font-semibold leading-6">
                                        Description
                                    </span>
                                </div>
                            </div>
                            <div className="px-8 py-2 text-black dark:text-white">
                                <h3 className="font-medium inline-flex">
                                    {(application?.talent || application)
                                        ?.talentData?.profile?.headline
                                        ? `${
                                              (
                                                  application?.talent ||
                                                  application
                                              )?.talentData?.profile?.headline
                                          } `
                                        : null}
                                    {(application?.talent || application)
                                        ?.talentData?.profile?.videoUrl ? (
                                        <span className="ml-2">
                                            |{' '}
                                            <span
                                                className="text-primary hover:underline inline-flex items-center"
                                                onClick={() =>
                                                    window.open(
                                                        (
                                                            application?.talent ||
                                                            application
                                                        )?.talentData?.profile
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
                                <p className="mt-2 break-words whitespace-pre-wrap text-sm">
                                    {
                                        (application?.talent || application)
                                            ?.talentData?.profile?.about
                                    }
                                </p>
                            </div>
                        </>
                    )}

                    <div className="mx-8 mb-4">
                        <div className="w-full border-t border-gray-300" />
                    </div>

                    {(application?.talent || application)?.talentData
                        ?.experience &&
                        Object.values(
                            (application?.talent || application)?.talentData
                                ?.experience
                        ).some((v: any) => v) && (
                            <>
                                <div className="relative text-black dark:text-white">
                                    <div className="relative flex">
                                        <span className="ml-8 text-lg font-semibold leading-6">
                                            Experience
                                        </span>
                                    </div>
                                </div>
                                <div className="px-8 py-2 text-black dark:text-white">
                                    {(application?.talent || application)
                                        ?.talentData?.experience ? (
                                        <>
                                            <div className="py-2 flex flex-wrap gap-2">
                                                {Object.entries(
                                                    (
                                                        application?.talent ||
                                                        application
                                                    )?.talentData?.experience
                                                ).map(([k, v]: any) => {
                                                    return v ? (
                                                        <BrowseSkillCard
                                                            {...{
                                                                k: (
                                                                    formFields.get(
                                                                        'talentExperience'
                                                                    ) as any[]
                                                                ).find(
                                                                    (f: any) =>
                                                                        f.name ===
                                                                        k
                                                                ).label,
                                                                v,
                                                                match:
                                                                    preferences &&
                                                                    !(
                                                                        (k ===
                                                                            'yearsOfExperience' &&
                                                                            preferences
                                                                                .experience
                                                                                .yearsOfExperience >
                                                                                (
                                                                                    application?.talent ||
                                                                                    application
                                                                                )
                                                                                    .talentData
                                                                                    .experience
                                                                                    .yearsOfExperience) ||
                                                                        (k ===
                                                                            'technologies' &&
                                                                            !preferences.experience.technologies.every(
                                                                                (
                                                                                    t: string
                                                                                ) =>
                                                                                    (
                                                                                        application?.talent ||
                                                                                        application
                                                                                    ).talentData.experience.technologies.includes(
                                                                                        t
                                                                                    )
                                                                            )) ||
                                                                        (k ===
                                                                            'leadTypes' &&
                                                                            !preferences.experience.leadTypes.some(
                                                                                (
                                                                                    t: string
                                                                                ) =>
                                                                                    (
                                                                                        application?.talent ||
                                                                                        application
                                                                                    ).talentData.experience.leadTypes.includes(
                                                                                        t
                                                                                    )
                                                                            )) ||
                                                                        (k ===
                                                                            'education' &&
                                                                            !preferences.experience.education.includes(
                                                                                (
                                                                                    application?.talent ||
                                                                                    application
                                                                                )
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
                                                                                    (
                                                                                        application?.talent ||
                                                                                        application
                                                                                    ).talentData.experience.salesRoles.includes(
                                                                                        s
                                                                                    )
                                                                            )) ||
                                                                        (k ===
                                                                            'industries' &&
                                                                            !preferences.experience.industries.some(
                                                                                (
                                                                                    i: string
                                                                                ) =>
                                                                                    (
                                                                                        application?.talent ||
                                                                                        application
                                                                                    ).talentData.experience.industries.includes(
                                                                                        i
                                                                                    )
                                                                            )) ||
                                                                        (k ===
                                                                            'salesCycles' &&
                                                                            !preferences.experience.salesCycles.some(
                                                                                (
                                                                                    s: string
                                                                                ) =>
                                                                                    (
                                                                                        application?.talent ||
                                                                                        application
                                                                                    ).talentData.experience.salesCycles.includes(
                                                                                        s
                                                                                    )
                                                                            )) ||
                                                                        (k ===
                                                                            'salesTypes' &&
                                                                            !preferences.experience.salesTypes.some(
                                                                                (
                                                                                    s: string
                                                                                ) =>
                                                                                    (
                                                                                        application?.talent ||
                                                                                        application
                                                                                    ).talentData.experience.salesTypes.includes(
                                                                                        s
                                                                                    )
                                                                            )) ||
                                                                        (k ===
                                                                            'decisionMakers' &&
                                                                            !preferences.experience.decisionMakers.some(
                                                                                (
                                                                                    d: string
                                                                                ) =>
                                                                                    (
                                                                                        application?.talent ||
                                                                                        application
                                                                                    ).talentData.experience.decisionMakers.includes(
                                                                                        d
                                                                                    )
                                                                            )) ||
                                                                        (k ===
                                                                            'dealAmounts' &&
                                                                            !preferences.experience.dealAmounts.some(
                                                                                (
                                                                                    d: string
                                                                                ) =>
                                                                                    (
                                                                                        application?.talent ||
                                                                                        application
                                                                                    ).talentData.experience.dealAmounts.includes(
                                                                                        d
                                                                                    )
                                                                            )) ||
                                                                        (k ===
                                                                            'salesVolumes' &&
                                                                            !preferences.experience.salesVolumes.some(
                                                                                (
                                                                                    s: string
                                                                                ) =>
                                                                                    (
                                                                                        application?.talent ||
                                                                                        application
                                                                                    ).talentData.experience.salesVolumes.includes(
                                                                                        s
                                                                                    )
                                                                            )) ||
                                                                        (k ===
                                                                            'salesEnvironments' &&
                                                                            !preferences.experience.salesEnvironments.some(
                                                                                (
                                                                                    s: string
                                                                                ) =>
                                                                                    (
                                                                                        application?.talent ||
                                                                                        application
                                                                                    ).talentData.experience.salesEnvironments.includes(
                                                                                        s
                                                                                    )
                                                                            ))
                                                                    ),
                                                            }}
                                                        />
                                                    ) : null;
                                                })}
                                            </div>
                                            <div className="mx-8 mb-4">
                                                <div className="w-full border-t border-gray-300" />
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </>
                        )}



                    {(application?.talent || application)?.talentData
                        ?.experience && (
                        <>
                            <div className="relative text-black dark:text-white">
                                <div className="relative flex">
                                    <span className="ml-8 text-lg font-semibold leading-6">
                                        Goals
                                    </span>
                                </div>
                            </div>
                            <div className="px-8 py-2 text-black dark:text-white">
                                {(application?.talent || application)
                                    ?.talentData?.goals ? (
                                    <>
                                        <div className="py-2 flex flex-wrap gap-2">
                                            {Object.entries(
                                                (
                                                    application?.talent ||
                                                    application
                                                )?.talentData?.goals
                                            ).map(([k, v]: any) => {
                                                return v ? (
                                                    <BrowseSkillCard
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
                                                            match:
                                                                preferences &&
                                                                ((k ==
                                                                    'salesRoles' &&
                                                                    preferences
                                                                        .goals
                                                                        .salesRole &&
                                                                    (
                                                                        application?.talent ||
                                                                        application
                                                                    ).talentData.goals.salesRoles?.includes(
                                                                        preferences
                                                                            .goals
                                                                            .salesRole
                                                                    )) ||
                                                                    (k ==
                                                                        'commitment' &&
                                                                        preferences
                                                                            .goals
                                                                            .commitment &&
                                                                        (
                                                                            application?.talent ||
                                                                            application
                                                                        ).talentData.goals?.commitment.includes(
                                                                            preferences
                                                                                .goals
                                                                                .commitment
                                                                        )) ||
                                                                    (k ==
                                                                        'compensationTypes' &&
                                                                        preferences
                                                                            .goals
                                                                            .compensationType &&
                                                                        (
                                                                            application?.talent ||
                                                                            application
                                                                        ).talentData.goals.compensationTypes?.includes(
                                                                            preferences
                                                                                .goals
                                                                                .compensationType
                                                                        )) ||
                                                                    (k ==
                                                                        'benefits' &&
                                                                        preferences
                                                                            .goals
                                                                            .benefits &&
                                                                        preferences.goals.benefits.every(
                                                                            (
                                                                                b: string
                                                                            ) =>
                                                                                (
                                                                                    application?.talent ||
                                                                                    application
                                                                                ).talentData.goals.benefits?.includes(
                                                                                    b
                                                                                )
                                                                        )) ||
                                                                    (k ===
                                                                        'industries' &&
                                                                        preferences
                                                                            .goals
                                                                            ?.industry &&
                                                                        (
                                                                            application?.talent ||
                                                                            application
                                                                        ).talentData.goals.industries.includes(
                                                                            preferences
                                                                                .goals
                                                                                .industry
                                                                        )) ||
                                                                    (k ===
                                                                        'companyAge' &&
                                                                        preferences
                                                                            .goals
                                                                            .companyAge &&
                                                                        preferences
                                                                            .goals
                                                                            .companyAge >=
                                                                            (
                                                                                application?.talent ||
                                                                                application
                                                                            )
                                                                                .talentData
                                                                                .goals
                                                                                .companyAge) ||
                                                                    (k ===
                                                                        'companyHeadcount' &&
                                                                        preferences
                                                                            .goals
                                                                            .companyHeadcount &&
                                                                        preferences
                                                                            .goals
                                                                            .companyHeadcount >=
                                                                            (
                                                                                application?.talent ||
                                                                                application
                                                                            )
                                                                                .talentData
                                                                                .goals
                                                                                .companyHeadcount) ||
                                                                    (k ==
                                                                        'minimumCompensation' &&
                                                                        preferences
                                                                            .goals
                                                                            .minimumCompensation &&
                                                                        preferences
                                                                            .goals
                                                                            .minimumCompensation >=
                                                                            (
                                                                                application?.talent ||
                                                                                application
                                                                            )
                                                                                .talentData
                                                                                .goals
                                                                                .minimumCompensation)),
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
                </>
            ) : (
                <div className="h-[42rem] w-full flex items-center justify-center bg-white dark:bg-darkForeground">
                    <span className="text-sm font-medium text-gray-500">
                        Please select an application to view in detail.
                    </span>
                </div>
            )}
            <ResumeModal
                show={resumeModalShown}
                setShow={setResumeModalShown}
                fileUrl={application?.talent?.resume}
            />

            <Transition.Root show={actuallyHiredShown} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={setActuallyHiredShown}
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
                                <Dialog.Panel className="relative transform overflow-visible rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:p-6">
                                    <div>
                                        <div className="mt-3 text-center sm:mt-5">
                                            <h3 className="text-base font-semibold leading-6 text-gray-900">
                                                Have you actually hired this
                                                applicant?
                                            </h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">
                                                    Please use the hired tab
                                                    only for applicants that you
                                                    are actively employing.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:col-start-2"
                                            onClick={() => {
                                                onChangeListing({
                                                    status: 'hired',
                                                });
                                                setActuallyHiredShown(false);
                                            }}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                                            onClick={() =>
                                                setActuallyHiredShown(false)
                                            }
                                            data-autofocus
                                        >
                                            No
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    );
};

export default ApplicationTalentDetail;
