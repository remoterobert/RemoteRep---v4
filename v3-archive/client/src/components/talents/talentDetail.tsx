import {
    ArrowTopRightOnSquareIcon,
    BookmarkIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    MapPinIcon,
    UserIcon,
    UserPlusIcon,
    HandThumbUpIcon,
    HandThumbDownIcon,
    PlayIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { Listing, Talent } from 'types';
import {
    BookmarkIcon as SolidBookmarkIcon,
    UserPlusIcon as SolidUserPlusIcon,
    HandThumbUpIcon as SolidHandThumbUpIcon,
    HandThumbDownIcon as SolidHandThumbDownIcon
} from '@heroicons/react/24/solid';
import apiRequest from 'services/apiRequest';
import BrowseSkillCard from 'components/share/browseSkillCard';
import Rating from 'components/Stars/Rating';
import * as formFields from '../../services/formFields';
import { RoundButton } from 'components/commons/roundButton';
import { useNotification } from 'contexts/NotificationContext';
import { ResumeModal } from 'components/commons/resumeModal';
import { Dispatch, SetStateAction, useState } from 'react';
import _ from 'lodash';
import { getLastSeenInfo } from 'services/utils/getLastSeenInfo';

const TalentDetail = ({
    selectedTalent,
    listing,
    setUpdate,
    update,
    bookmarks,
    bookmark,
    preferences,
    user,
    hasAccess,
    setShowCreateModal,
}: {
    selectedTalent: Talent;
    listing: Listing | undefined;
    update: number;
    setUpdate: (update: number) => void;
    bookmarks: string[];
    bookmark: (id: string, bookmarked: boolean) => void;
    preferences: any;
    user: any;
    hasAccess: boolean;
    setShowCreateModal: Dispatch<SetStateAction<boolean>>;
}) => {
    const [resumeModalShown, setResumeModalShown] = useState(false);

    const router = useRouter();

    const { addNotification } = useNotification();

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
            <div className="w-full sm:flex md:justify-between px-8 py-8">
                <div className="inline-flex items-center">
                    {selectedTalent?.talentData?.profile?.photoUrl ? (
                        <img
                            src={selectedTalent?.talentData?.profile?.photoUrl}
                            className="h-12 w-12 md:h-24 md:w-24 rounded-full"
                        />
                    ) : (
                        <UserIcon className="h-12 w-12 md:h-24 md:w-24 rounded-full text-gray-300 bg-gray-100" />
                    )}

                    <div className="ml-4 font-medium text-black dark:text-white flex items-center">
                        <div>
                            <div className="mt-2">
                                <span className="mt- text-md md:text-lg">
                                    {selectedTalent?.contact?.firstName}
                                    <span
                                        className={`ml-1 ${
                                            hasAccess ? '' : 'blur-sm'
                                        }`}
                                    >
                                        {selectedTalent?.contact?.lastName}
                                    </span>
                                </span>
                            </div>
                            <div className="mt-2">
                                <span>{selectedTalent?.talentData?.profile?.headline}</span>
                                
                            </div>
                            <div className="text-xs inline-flex text-gray-700">
                                {getLastSeenInfo(
                                    selectedTalent?.dateLastOnline || 0
                                ).replace('seen', 'active')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="min-h-full flex justify-center items-center gap-2 px-4">
                    <RoundButton
                        {...{
                            icon: EnvelopeIcon,
                            name: 'Message',
                            onClick: () =>
                                router.push(
                                    `/app/client/chats?target=${selectedTalent.id}`
                                ),
                        }}
                    />
                    {listing?.id ? (
                        listing?.applications?.some(
                            (a: any) => a.talent === selectedTalent.id
                        ) ? (
                            <RoundButton
                                {...{
                                    icon: SolidUserPlusIcon,
                                    name: 'Invited',
                                    onClick: () => {},
                                    className: 'text-primary',
                                }}
                            />
                        ) : (
                            <RoundButton
                                {...{
                                    icon: UserPlusIcon,
                                    name: 'Invite to apply',
                                    onClick: async () => {
                                        try {
                                            if (!listing?.id) throw new Error();

                                            const inviteReq = await apiRequest(
                                                'POST',
                                                `/client/listings/${listing?.id}/applications`,
                                                {
                                                    talentId: selectedTalent.id,
                                                }
                                            );

                                            if (inviteReq.status === 201) {
                                                addNotification({
                                                    type: 'success',
                                                    title: 'Invite sent successfully',
                                                    text: 'You will be notified when the talent sends an application...',
                                                });

                                                setUpdate(update + 1);
                                            } else if (inviteReq.status === 403)
                                                setShowCreateModal(true);
                                            else
                                                addNotification({
                                                    type: 'error',
                                                    title: 'Error sending invite',
                                                    text: 'Please try again later...',
                                                });
                                        } catch {}
                                    },
                                }}
                            />
                        )
                    ) : null}
                    {bookmarks?.includes(selectedTalent.id) ? (
                        <RoundButton
                            {...{
                                icon: SolidBookmarkIcon,
                                name: 'Unbookmark',
                                onClick: () =>
                                    bookmark(selectedTalent.id, false),
                                className: 'text-subscribed',
                            }}
                        />
                    ) : (
                        <RoundButton
                            {...{
                                icon: BookmarkIcon,
                                name: 'Bookmark',
                                onClick: () =>
                                    bookmark(selectedTalent.id, true),
                            }}
                        />
                    )}

                    {(selectedTalent?.talentData?.files?.resume ||
                        !hasAccess) && (
                        <RoundButton
                            {...{
                                icon: DocumentTextIcon,
                                name: 'View résumé',
                                onClick: () => {
                                    if (!hasAccess) setShowCreateModal(true);
                                    else setResumeModalShown(true);
                                },
                            }}
                        />
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center w-full pl-8 pr-8 mb-4 text-black dark:text-white">
                        <div>
                        <span className="text-sm inline-flex text-gray-700 dark:text-white">
                                    <MapPinIcon className="my-auto h-4 w-4" />
                                    <span
                                        className={`ml-1 ${
                                            hasAccess ? '' : 'blur-sm'
                                        }`}
                                    >
                                        {selectedTalent?.contact?.addressCity}
                                    </span>
                                    ,
                                    <span
                                        className={`ml-1 ${
                                            hasAccess ? '' : 'blur-sm'
                                        }`}
                                    >
                                        {selectedTalent?.contact?.addressState}
                                    </span>
                                    {', '}
                                    {selectedTalent?.contact?.addressCountry}
                                </span>
                        </div>
                        <div className="justify-self-end w-[10rem]">
                            <div className="inline-flex">
                                <div className="px-4 inline-flex items-center">
                                    <button type="button"><SolidHandThumbUpIcon className='h-5 w-5'/></button>
                                    <p className="pl-2">20</p>
                                </div>
                                <div className="px-4 inline-flex items-center">
                                    <button type="button"><HandThumbDownIcon className='h-5 w-5'/></button>
                                    <p className="pl-2">0</p>
                                </div>
                            </div>
                        </div>
            </div>

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
                        <div className="col-span-6 text-center">
                            <div className="h-36 bg-background dark:bg-lightForeground rounded-lg flex flex-col justify-center items-center">
                                    <PlayIcon className="w-[42px] mb-4"/>
                            </div>
                        </div>
                        <div className="col-span-6 text-center">
                            <div className="h-36 bg-background dark:bg-lightForeground rounded-lg flex flex-col justify-center items-center">
                                    <DocumentTextIcon className="w-[42px] mb-4"/>
                                    <p>Résumé</p>
                            </div>
                        </div>
                    </div>
            </div>

            <div className="mx-8 mb-4">
                <div className="w-full border-t border-gray-300" />
            </div>

            {selectedTalent?.talentData?.profile?.about && (
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
                            {selectedTalent?.talentData?.profile?.headline
                                ? `${selectedTalent?.talentData?.profile?.headline} `
                                : null}
                            {selectedTalent?.talentData?.profile?.videoUrl ? (
                                <span className="ml-2">
                                    |{' '}
                                    <span
                                        className="text-primary hover:underline inline-flex items-center"
                                        onClick={() =>
                                            window.open(
                                                selectedTalent?.talentData
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
                            {selectedTalent?.talentData?.profile?.about}
                        </p>
                    </div>
                    <div className="mx-8 mb-4 mt-4">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                </>
            )}

            {selectedTalent?.talentData?.experience &&
                Object.values(selectedTalent?.talentData?.experience).some(
                    (v: any) => v
                ) && (
                    <>
                        <div className="relative text-black dark:text-white">
                            <div className="relative flex">
                                <span className="ml-8 text-lg font-semibold leading-6">
                                    Experience
                                </span>
                            </div>
                        </div>
                        <div className="px-8 py-2 text-black dark:text-white">
                            {selectedTalent?.talentData?.experience ? (
                                <>
                                    <div className="py-2 flex flex-wrap gap-2">
                                        {Object.entries(
                                            selectedTalent?.talentData
                                                ?.experience
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
                                                                f.name === k
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
                                                                        selectedTalent
                                                                            .talentData
                                                                            .experience
                                                                            .yearsOfExperience) ||
                                                                (k ===
                                                                    'technologies' &&
                                                                    !preferences.experience.technologies.every(
                                                                        (
                                                                            t: string
                                                                        ) =>
                                                                            selectedTalent.talentData.experience.technologies?.includes(
                                                                                t
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'leadTypes' &&
                                                                    !preferences.experience.leadTypes.some(
                                                                        (
                                                                            t: string
                                                                        ) =>
                                                                            selectedTalent.talentData.experience.leadTypes?.includes(
                                                                                t
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'education' &&
                                                                    !preferences.experience.education?.includes(
                                                                        selectedTalent
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
                                                                            selectedTalent.talentData.experience.salesRoles?.includes(
                                                                                s
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'industries' &&
                                                                    !preferences.experience.industries.some(
                                                                        (
                                                                            i: string
                                                                        ) =>
                                                                            selectedTalent.talentData.experience.industries?.includes(
                                                                                i
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'salesCycles' &&
                                                                    !preferences.experience.salesCycles.some(
                                                                        (
                                                                            s: string
                                                                        ) =>
                                                                            selectedTalent.talentData.experience.salesCycles?.includes(
                                                                                s
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'salesTypes' &&
                                                                    !preferences.experience.salesTypes.some(
                                                                        (
                                                                            s: string
                                                                        ) =>
                                                                            selectedTalent.talentData.experience.salesTypes?.includes(
                                                                                s
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'decisionMakers' &&
                                                                    !preferences.experience.decisionMakers.some(
                                                                        (
                                                                            d: string
                                                                        ) =>
                                                                            selectedTalent.talentData.experience.decisionMakers?.includes(
                                                                                d
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'dealAmounts' &&
                                                                    !preferences.experience.dealAmounts.some(
                                                                        (
                                                                            d: string
                                                                        ) =>
                                                                            selectedTalent.talentData.experience.dealAmounts?.includes(
                                                                                d
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'salesVolumes' &&
                                                                    !preferences.experience.salesVolumes.some(
                                                                        (
                                                                            s: string
                                                                        ) =>
                                                                            selectedTalent.talentData.experience.salesVolumes?.includes(
                                                                                s
                                                                            )
                                                                    )) ||
                                                                (k ===
                                                                    'salesEnvironments' &&
                                                                    !preferences.experience.salesEnvironments.some(
                                                                        (
                                                                            s: string
                                                                        ) =>
                                                                            selectedTalent.talentData.experience.salesEnvironments?.includes(
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
                    </>
                )}

            {Object.values(selectedTalent?.talentData?.goals)?.some(
                (v) => v
            ) && (
                <>
                    <div className="relative text-black dark:text-white">
                        <div className="relative flex">
                            <span className="ml-8 text-lg font-semibold leading-6">
                                Goals
                            </span>
                        </div>
                    </div>
                    <div className="px-8 py-2 pb-8 text-black dark:text-white">
                        {selectedTalent?.talentData?.goals ? (
                            <>
                                <div className="py-2 flex flex-wrap gap-2">
                                    {Object.entries(
                                        selectedTalent?.talentData?.goals
                                    ).map(([k, v]: any) => {
                                        return v ? (
                                            <BrowseSkillCard
                                                {...{
                                                    k: (
                                                        formFields.get(
                                                            'talentGoals'
                                                        ) as any[]
                                                    ).find(
                                                        (f: any) => f.name === k
                                                    ).label,
                                                    v,
                                                    match:
                                                        preferences &&
                                                        ((k == 'salesRoles' &&
                                                            preferences.goals
                                                                .salesRole &&
                                                            selectedTalent.talentData.goals.salesRoles?.includes(
                                                                preferences
                                                                    .goals
                                                                    .salesRole
                                                            )) ||
                                                            (k ==
                                                                'commitment' &&
                                                                preferences
                                                                    .goals
                                                                    .commitment &&
                                                                selectedTalent.talentData.goals?.commitment.includes(
                                                                    preferences
                                                                        .goals
                                                                        .commitment
                                                                )) ||
                                                            (k ==
                                                                'compensationTypes' &&
                                                                preferences
                                                                    .goals
                                                                    .compensationType &&
                                                                selectedTalent.talentData.goals.compensationTypes?.includes(
                                                                    preferences
                                                                        .goals
                                                                        .compensationType
                                                                )) ||
                                                            (k == 'benefits' &&
                                                                preferences
                                                                    .goals
                                                                    .benefits &&
                                                                preferences.goals.benefits.every(
                                                                    (
                                                                        b: string
                                                                    ) =>
                                                                        selectedTalent.talentData.goals.benefits?.includes(
                                                                            b
                                                                        )
                                                                )) ||
                                                            (k ===
                                                                'industries' &&
                                                                user.clientData
                                                                    ?.profile
                                                                    ?.industry &&
                                                                selectedTalent.talentData.goals.industries.includes(
                                                                    user
                                                                        .clientData
                                                                        ?.profile
                                                                        .industry
                                                                )) ||
                                                            (k ===
                                                                'companyAge' &&
                                                                user.clientData
                                                                    .profile
                                                                    .companyAge &&
                                                                user.clientData
                                                                    .profile
                                                                    .companyAge >=
                                                                    selectedTalent
                                                                        .talentData
                                                                        .goals
                                                                        .companyAge) ||
                                                            (k ===
                                                                'companyHeadcount' &&
                                                                user.clientData
                                                                    ?.profile
                                                                    .companyHeadcount &&
                                                                user.clientData
                                                                    ?.profile
                                                                    .companyHeadcount >=
                                                                    selectedTalent
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
                                                                    selectedTalent
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

            <ResumeModal
                show={resumeModalShown}
                setShow={setResumeModalShown}
                fileUrl={selectedTalent?.talentData?.files?.resume}
            />
        </>
    );
};

export default TalentDetail;
