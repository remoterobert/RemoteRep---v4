import {
    BookmarkIcon,
    ClipboardDocumentCheckIcon,
    EnvelopeIcon,
    MapPinIcon,
    GlobeAltIcon,
    RocketLaunchIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import {
    BookmarkIcon as SolidBookmarkIcon,
    ClipboardDocumentCheckIcon as SolidClipboardDocumentCheckIcon,
    GlobeAltIcon as SolidGlobeAltIcon,
    RocketLaunchIcon as SolidRocketLaunchIcon,
    DocumentTextIcon as SolidDocumentTextIcon
} from '@heroicons/react/24/solid';
import BrowseSkillCard from 'components/share/browseSkillCard';
import Rating from 'components/Stars/Rating';
import * as formFields from '../../services/formFields';
import { Listing } from 'types';
import { useRouter } from 'next/router';
import { RoundButton } from 'components/commons/roundButton';
import { useEffect, useState } from 'react';
import * as localData from 'services/localData';
import { getLastSeenInfo } from 'services/utils/getLastSeenInfo';

const ListingDetail = ({
    selectedListing,
    bookmarks,
    setShowApply,
    bookmark,
    preferences,
}: {
    selectedListing: Listing;
    bookmarks: string[];
    setShowApply: (show: boolean) => void;
    bookmark: (id: string, bookmarked: boolean) => void;
    preferences: any;
}) => {
    const [selfUser, setSelfUser] = useState<any>();
    const { photoUrl, ...clientProfileData } =
        selectedListing?.client?.clientData?.profile || {};
    const isChatAvailable = selectedListing?.applications?.some(
        (application) =>
            application.applicationStatus === 'applied' ||
            application.applicationStatus === 'invited'
    );

    useEffect(() => {
        setSelfUser(localData.get('user'));
    }, []);

    const rating = 4.3;
    const reviews = 52;

    const socialMediaLinks = {
        instagramUrl: 'https://www.instagram.com/',
        tiktokUrl: 'https://www.tiktok.com/',
        twitterUrl: 'https://twitter.com/',
        facebookUrl: 'https://www.facebook.com/'
    };

    const router = useRouter();
    return (
        <>
             <div className="flex justify-between items-center w-full pl-8 pt-8 pr-8 text-black dark:text-white">
                        <div>
                            <span className="text-sm md:text-xl font-bold">
                                {selectedListing?.title || null}
                            </span>
                        </div>
                        <div className="justify-self-end">
                            <span className="text-sm">
                                Posted on: Feb 21,2024
                            </span>
                        </div>

            </div>
            <div className="w-full md:flex md:justify-between px-8 py-4">
                <div className="inline-flex">
                    <img
                        src={
                            selectedListing?.client?.clientData?.profile
                                ?.photoUrl
                        }
                        className="h-12 md:h-24 w-12 md:w-24 rounded-full shrink-0"
                    />

                    <div className="ml-4 font-medium text-black dark:text-white flex items-center">
                        <div>
                            <div className="mt-2">
                                <span className="mt- text-md md:text-lg">
                                    {selectedListing?.client?.contact
                                        ?.companyName || null}
                                </span>
                            </div>
                            <div className="mt-2">
                                <span className="text-sm inline-flex">
                                    <MapPinIcon className="my-auto h-4 w-4" />
                                    {[
                                        selectedListing?.client?.contact
                                            ?.addressCity,
                                        selectedListing?.client?.contact
                                            ?.addressState,
                                        selectedListing?.client?.contact
                                            ?.addressCountry,
                                    ].join(', ')}
                                </span>
                            </div>
                            <div className="text-xs inline-flex">
                                {getLastSeenInfo(
                                    selectedListing?.client?.dateLastOnline || 0
                                )
                                    .replace('seen', 'active')
                                    .replace('L', 'Client l')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 md:mt-0 min-h-full flex justify-center items-center gap-2">
                    {isChatAvailable && (
                        <RoundButton
                            {...{
                                icon: EnvelopeIcon,
                                name: 'Message',
                                onClick: () =>
                                    router.push(
                                        `/app/talent/chats?target=${selectedListing.client.id}`
                                    ),
                            }}
                        />
                    )}
                    {selectedListing?.applications?.some(
                        (a) => a.talent === selfUser?.id
                    ) ? (
                        <RoundButton
                            {...{
                                icon: SolidClipboardDocumentCheckIcon,
                                name: 'Applied',
                                onClick: () => {},
                                className: 'text-subscribed',
                            }}
                        />
                    ) : (
                        <RoundButton
                            {...{
                                icon: ClipboardDocumentCheckIcon,
                                name: 'Apply',
                                onClick: () => setShowApply(true),
                            }}
                        />
                    )}

                    {bookmarks.includes(selectedListing.id) ? (
                        <RoundButton
                            {...{
                                icon: SolidBookmarkIcon,
                                name: 'Unbookmark',
                                onClick: () =>
                                    bookmark(selectedListing.id, false),
                                className: 'text-subscribed',
                            }}
                        />
                    ) : (
                        <RoundButton
                            {...{
                                icon: BookmarkIcon,
                                name: 'Bookmark',
                                onClick: () =>
                                    bookmark(selectedListing.id, true),
                            }}
                        />
                    )}
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
                    <li className="col-span-4 mb-4">Company Age: 12 yrs</li>
                    <li className="col-span-4 mb-4">Sales team size: 23</li>
                    <li className="col-span-4 mb-4">B2B</li>
                    <li className="col-span-4">Average Rep Earnings</li>
                    <li className="col-span-4">The rep's desired role</li>
                    <li className="col-span-4">Full time</li>
                </ul>
            </div>

            <div className="grid grid-cols-12 w-full mb-8 text-black dark:text-white">
                <div className="col-span-4 text-center pl-8 pr-4">
                    <div className="h-36 bg-background dark:bg-lightForeground rounded-lg flex flex-col justify-center items-center">
                        <GlobeAltIcon className="w-[42px] mb-4"/>
                            <p>Website/Funnel</p>
                    </div>
                </div>
                <div className="col-span-4 text-center pl-4 pr-4">
                    <div className="h-36 bg-background dark:bg-lightForeground rounded-lg flex flex-col justify-center items-center">
                        <DocumentTextIcon className="w-[42px] mb-4"/>
                        <p>View Application</p>
                    </div>
                </div>
                <div className="col-span-4 text-center pl-4 pr-8">
                    <div className="h-36 bg-background dark:bg-lightForeground rounded-lg flex flex-col justify-center items-center">
                        <RocketLaunchIcon className="w-[42px] mb-4"/>
                        <p>Hiring Procees</p>
                    </div>
                </div>
            </div>

            <div className="mx-8 mb-4">
                <div className="w-full border-t border-gray-300" />
            </div>

            {selectedListing?.description && (
                <>
                    <div className="flex justify-between items-center px-8 mb-4 text-black dark:text-white">
                        <p className="text-xl font-bold">Job Details</p>
                        <p>Posted on:Feb 21, 2024</p>
                    </div>
                    <div className="relative text-black dark:text-white">
                        <div className="relative flex">
                            <span className="ml-8 text-lg font-semibold leading-6">
                                Job Description
                            </span>
                        </div>
                    </div>
                    <div className="px-8 py-2 mb-4 text-black dark:text-white">
                        <p className="mt-2 break-words whitespace-pre-wrap">
                            {selectedListing?.description}
                        </p>
                    </div>
                    <div className="mx-8 mb-4">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                </>
            )}

            {selectedListing?.instructions && (
                <>
                    <div className="relative text-black dark:text-white">
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
                    <div className="px-8 py-2 mb-4 text-black dark:text-white">
                        <p className="mt-2 break-words whitespace-pre-wrap">
                            {selectedListing?.instructions}
                        </p>
                    </div>
                    <div className="mx-8 mb-4">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                </>
            )}

            {selectedListing?.details &&
                Object.values(selectedListing?.details).some((v: any) => v) && (
                    <>
                        <div className="relative text-black dark:text-white">
                            <div className="relative flex">
                                <span className="ml-8 text-lg font-semibold leading-6">
                                    Details
                                </span>
                            </div>
                        </div>
                        <div className="px-8 py-2">
                            {selectedListing?.details ? (
                                <>
                                    <div className="py-2 flex flex-wrap gap-2">
                                        {Object.entries({
                                            ...selectedListing?.details,
                                            ...clientProfileData,
                                        }).map(([k, v]: any) => {
                                            return v ? (
                                                <BrowseSkillCard
                                                    {...{
                                                        k:
                                                            k === 'industry'
                                                                ? 'Industry'
                                                                : k ===
                                                                  'companyAge'
                                                                ? 'Company age'
                                                                : k ===
                                                                  'companyHeadcount'
                                                                ? 'Company headcount'
                                                                : (
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
                                                        match:
                                                            (k == 'salesRole' &&
                                                                preferences
                                                                    ?.goals
                                                                    ?.salesRoles &&
                                                                preferences?.goals?.salesRoles?.includes(
                                                                    selectedListing
                                                                        .details
                                                                        ?.salesRole
                                                                )) ||
                                                            (k ==
                                                                'commitment' &&
                                                                preferences
                                                                    ?.goals
                                                                    ?.commitment &&
                                                                preferences?.goals?.commitment?.includes(
                                                                    selectedListing
                                                                        .details
                                                                        ?.commitment
                                                                )) ||
                                                            (k ==
                                                                'compensationType' &&
                                                                preferences
                                                                    ?.goals
                                                                    ?.compensationTypes &&
                                                                preferences?.goals?.compensationTypes?.includes(
                                                                    selectedListing
                                                                        .details
                                                                        ?.compensationType
                                                                )) ||
                                                            (k == 'benefits' &&
                                                                preferences
                                                                    ?.goals
                                                                    ?.benefits &&
                                                                preferences?.goals?.benefits?.every(
                                                                    (
                                                                        b: string
                                                                    ) =>
                                                                        selectedListing.details?.benefits.includes(
                                                                            b
                                                                        )
                                                                )) ||
                                                            (k ==
                                                                'minimumCompensation' &&
                                                                preferences
                                                                    ?.goals
                                                                    ?.minimumCompensation &&
                                                                +selectedListing?.details!
                                                                    ?.minimumCompensation >=
                                                                    +preferences
                                                                        ?.goals
                                                                        ?.minimumCompensation) ||
                                                            (k == 'industry' &&
                                                                preferences
                                                                    ?.goals
                                                                    ?.industries &&
                                                                preferences?.goals?.industries.includes(
                                                                    selectedListing
                                                                        .client
                                                                        .clientData
                                                                        .profile
                                                                        .industry
                                                                )) ||
                                                            (k ===
                                                                'companyAge' &&
                                                                preferences
                                                                    ?.goals
                                                                    ?.companyAge &&
                                                                selectedListing
                                                                    .client
                                                                    .clientData
                                                                    .profile
                                                                    .companyAge >=
                                                                    preferences
                                                                        ?.goals
                                                                        ?.companyAge) ||
                                                            (k ===
                                                                'companyHeadcount' &&
                                                                preferences
                                                                    ?.goals
                                                                    ?.companyHeadcount &&
                                                                selectedListing
                                                                    .client
                                                                    .clientData
                                                                    .profile
                                                                    .companyHeadcount >=
                                                                    preferences
                                                                        .goals
                                                                        ?.companyHeadcount),
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

            {selectedListing?.requirements &&
                Object.values(selectedListing?.requirements).some(
                    (v: any) => v
                ) && (
                    <>
                        <div className="relative text-black dark:text-white">
                            <div className="relative flex">
                                <span className="ml-8 text-lg font-semibold leading-6">
                                    Requirements
                                </span>
                            </div>
                        </div>
                        <div className="px-8 py-2 pb-8 text-black dark:text-white">
                            {selectedListing?.requirements ? (
                                <>
                                    <div className="py-2 flex flex-wrap gap-2">
                                        {Object.entries(
                                            selectedListing?.requirements
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
                                                                f.name === k
                                                        ).label,
                                                        v,
                                                        match:
                                                            (k ===
                                                                'yearsOfExperience' &&
                                                                preferences
                                                                    ?.experience
                                                                    ?.yearsOfExperience >=
                                                                    selectedListing
                                                                        ?.requirements
                                                                        ?.yearsOfExperience) ||
                                                            (k ===
                                                                'technologies' &&
                                                                selectedListing.requirements.technologies.every(
                                                                    (
                                                                        t: string
                                                                    ) =>
                                                                        preferences?.experience?.technologies?.includes(
                                                                            t
                                                                        )
                                                                )) ||
                                                            (k ===
                                                                'leadTypes' &&
                                                                selectedListing?.requirements?.leadTypes?.some(
                                                                    (
                                                                        l: string
                                                                    ) =>
                                                                        preferences?.experience?.leadTypes?.includes(
                                                                            l
                                                                        )
                                                                )) ||
                                                            (k ===
                                                                'education' &&
                                                                selectedListing.requirements.education.includes(
                                                                    preferences
                                                                        ?.experience
                                                                        ?.education
                                                                )) ||
                                                            (k ===
                                                                'salesRoles' &&
                                                                selectedListing.requirements.salesRoles.some(
                                                                    (
                                                                        s: string
                                                                    ) =>
                                                                        preferences?.experience?.salesRoles?.includes(
                                                                            s
                                                                        )
                                                                )) ||
                                                            (k ===
                                                                'industries' &&
                                                                selectedListing.requirements.industries.some(
                                                                    (
                                                                        i: string
                                                                    ) =>
                                                                        preferences?.experience?.industries?.includes(
                                                                            i
                                                                        )
                                                                )) ||
                                                            (k ===
                                                                'salesCycles' &&
                                                                selectedListing.requirements.salesCycles.some(
                                                                    (
                                                                        s: string
                                                                    ) =>
                                                                        preferences?.experience?.salesCycles?.includes(
                                                                            s
                                                                        )
                                                                )) ||
                                                            (k ===
                                                                'salesTypes' &&
                                                                selectedListing.requirements.salesTypes.some(
                                                                    (
                                                                        s: string
                                                                    ) =>
                                                                        preferences?.experience?.salesTypes?.includes(
                                                                            s
                                                                        )
                                                                )) ||
                                                            (k ===
                                                                'decisionMakers' &&
                                                                selectedListing.requirements.decisionMakers.some(
                                                                    (
                                                                        d: string
                                                                    ) =>
                                                                        preferences?.experience?.decisionMakers?.includes(
                                                                            d
                                                                        )
                                                                )) ||
                                                            (k ===
                                                                'dealAmounts' &&
                                                                selectedListing.requirements.dealAmounts.some(
                                                                    (
                                                                        d: string
                                                                    ) =>
                                                                        preferences?.experience?.dealAmounts?.includes(
                                                                            d
                                                                        )
                                                                )) ||
                                                            (k ===
                                                                'salesVolumes' &&
                                                                selectedListing.requirements.salesVolumes.some(
                                                                    (
                                                                        s: string
                                                                    ) =>
                                                                        preferences?.experience?.salesVolumes?.includes(
                                                                            s
                                                                        )
                                                                )) ||
                                                            (k ===
                                                                'salesEnvironments' &&
                                                                selectedListing.requirements.salesEnvironments.some(
                                                                    (
                                                                        s: string
                                                                    ) =>
                                                                        preferences?.experience?.salesEnvironments?.includes(
                                                                            s
                                                                        )
                                                                )),
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
    );
};

export default ListingDetail;
