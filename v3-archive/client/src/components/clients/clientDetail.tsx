import {
    BookmarkIcon,
    ClipboardDocumentListIcon,
    EnvelopeIcon,
    MapPinIcon,
    GlobeAltIcon,
    RocketLaunchIcon,
    DocumentTextIcon, HandThumbUpIcon, HandThumbDownIcon 
} from '@heroicons/react/24/outline';
import { BookmarkIcon as SolidBookmarkIcon,  GlobeAltIcon as SolidGlobeAltIcon, 
    RocketLaunchIcon as SolidRocketLaunchIcon,
    DocumentTextIcon as SolidDocumentTextIcon, HandThumbUpIcon as SolidHandThumbUpIcon, HandThumbDownIcon as SolidHandThumbDownIcon } from '@heroicons/react/24/solid';
import BrowseSkillCard from 'components/share/browseSkillCard';
import { useRouter } from 'next/router';
import Rating from 'components/Stars/Rating';
import { Client, Listing } from 'types';
import * as formFields from '../../services/formFields';
import { RoundButton } from 'components/commons/roundButton';
import { useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';
import * as localData from '../../services/localData';
import { ClockIcon } from '@heroicons/react/24/outline';
import { getLastSeenInfo } from 'services/utils/getLastSeenInfo';

const ClientDetail = ({
    selectedClient,
    bookmarks,
    bookmark,
    preferences,
}: {
    selectedClient: Client;
    bookmarks: string[];
    bookmark: (clientId: string, bookmarked: boolean) => void;
    preferences: any;
}) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isChatEnabled, setIsChatEnabled] = useState(false);

    const getClientListings = async () => {
        setLoading(true);
        const clientListingsRes = await apiRequest(
            'GET',
            `/talent/clients/${selectedClient.id}`
        );
        if (
            clientListingsRes?.data &&
            clientListingsRes?.data.client.clientData.listings.length > 0
        ) {
            const listings = clientListingsRes?.data.client.clientData.listings;
            const userId = localData.get('user.id');

            const filteredListings = listings.filter((l: Listing) =>
                l.applications?.some((a) => a?.talent === userId)
            );
            const isChatEnabled = filteredListings.length > 0;
            setLoading(false);
            setIsChatEnabled(isChatEnabled);
        } else {
            setLoading(false);
        }
    };

    useEffect(() => {
        getClientListings();
    }, [selectedClient.id]);

    const rating = 4.3;
    const reviews = 52;

    const socialMediaLinks = {
        instagramUrl: 'https://www.instagram.com/',
        tiktokUrl: 'https://www.tiktok.com/',
        twitterUrl: 'https://twitter.com/',
        facebookUrl: 'https://www.facebook.com/'
    };

    const goToChat = () =>
        router.push(`/app/talent/chats?target=${selectedClient.id}`);

    return loading ? (
        <div className="flex items-center justify-center h-[100vh]">
            <ClockIcon className="h-8 w-8 text-gray-900 dark:text-white" />
        </div>
    ) : (
        <>
            <div className="md:flex md:justify-between px-8 py-4">
                <div className="inline-flex items-center">
                    <img
                        src={selectedClient.clientData.profile.photoUrl}
                        className="h-12 md:h-24 w-12 md:w-24 rounded-full shrink-0"
                    />

                    <div className="ml-4 font-medium text-black dark:text-white flex items-center">
                        <div>
                            <span className="text-md md:text-2xl">
                                {selectedClient.contact.companyName}
                            </span>
                            <div className="mt-2">
                                <span className="text-sm md:text-md inline-flex">
                                    <MapPinIcon className="h-5 w-5" />
                                    {[
                                        selectedClient.contact.addressCity,
                                        selectedClient.contact.addressState,
                                        selectedClient.contact.addressCountry,
                                    ].join(', ')}
                                </span>
                            </div>
                            <div className="text-xs inline-flex">
                                {getLastSeenInfo(
                                    selectedClient?.dateLastOnline || 0
                                ).replace('seen', 'active')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 md:mt-0 min-h-full flex justify-center items-center gap-2 px-4">
                    {isChatEnabled && (
                        <RoundButton
                            {...{
                                icon: EnvelopeIcon,
                                name: 'Message',
                                onClick: goToChat,
                            }}
                        />
                    )}
                    <RoundButton
                        {...{
                            icon: ClipboardDocumentListIcon,
                            name: 'Browse listings',
                            onClick: () =>
                                router.push(
                                    `/app/talent/browse-listings?client=${selectedClient.id}`
                                ),
                        }}
                    />
                    {bookmarks.includes(selectedClient.id) ? (
                        <RoundButton
                            {...{
                                icon: SolidBookmarkIcon,
                                name: 'Unbookmark',
                                onClick: () =>
                                    bookmark(selectedClient.id, false),
                                className: 'text-subscribed',
                            }}
                        />
                    ) : (
                        <RoundButton
                            {...{
                                icon: BookmarkIcon,
                                name: 'Bookmark',
                                onClick: () =>
                                    bookmark(selectedClient.id, true),
                            }}
                        />
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center w-full pl-8 pr-8 mb-4 text-black dark:text-white">
                        <div>
                        <span className="text-sm md:text-base inline-flex font-bold">
                                    <MapPinIcon className="h-5 w-5" />
                                    {[
                                        selectedClient.contact.addressCity,
                                        selectedClient.contact.addressState,
                                        selectedClient.contact.addressCountry,
                                    ].join(', ')}
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
            
            <div className="grid grid-cols-12 w-full mb-8 text-black dark:text-white">
                <div className="col-span-6 text-center pl-8 pr-4">
                    <div className="h-36 bg-background dark:bg-lightForeground rounded-lg flex flex-col justify-center items-center">
                        <GlobeAltIcon className="w-[42px] mb-4"/>
                        <p>Website/Funnel</p>
                    </div>
                </div>
                <div className="col-span-6 text-center pl-4 pr-8">
                    <div className="h-36 bg-background dark:bg-lightForeground rounded-lg flex flex-col justify-center items-center">
                        <RocketLaunchIcon className="w-[42px] mb-4"/>
                            <p>Hiring Procees</p>
                    </div>
                </div>
            </div>

            <div className="mx-8 mb-4">
                <div className="w-full border-t border-gray-300" />
            </div>
            <div className="px-8 py-2">
                <div className="py-2 flex flex-wrap gap-2">
                    {Object.entries(selectedClient.clientData.profile).map(
                        ([k, v]: any) => {
                            return k === 'photoUrl' ? null : v ? (
                                <BrowseSkillCard
                                    {...{
                                        k: (
                                            formFields.get(
                                                'clientProfile'
                                            ) as any[]
                                        ).find((f: any) => f.name === k).label,
                                        v,
                                        match: !(
                                            (k === 'companyAge' &&
                                                (!preferences.companyAge ||
                                                    v <
                                                        preferences.companyAge)) ||
                                            (k === 'companyHeadcount' &&
                                                (!preferences.companyHeadcount ||
                                                    v <
                                                        preferences.companyHeadcount)) ||
                                            (k === 'industry' &&
                                                (!preferences.industries ||
                                                    !preferences.industries.includes(
                                                        v
                                                    )))
                                        ),
                                    }}
                                />
                            ) : null;
                        }
                    )}
                </div>
            </div>
        </>
    );
};

export default ClientDetail;
