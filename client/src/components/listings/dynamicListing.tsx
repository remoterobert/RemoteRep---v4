import {
    ArrowTopRightOnSquareIcon,
    MapPinIcon,
} from '@heroicons/react/20/solid';
import {
    BookmarkIcon,
    CheckIcon,
    ClipboardDocumentCheckIcon,
    EnvelopeIcon,
    PencilIcon,
    UserIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import {
    BookmarkIcon as SolidBookmarkIcon,
    ClipboardDocumentCheckIcon as SolidClipboardDocumentCheckIcon,
} from '@heroicons/react/24/solid';
import { FormModal } from 'components/commons/formModal';
import { RoundButton } from 'components/commons/roundButton';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';
import * as formFields from 'services/formFields';
import * as localData from 'services/localData';
import { PublicCta } from './publicCta';
import { EditWrapper } from './editWrapper';
import { useNotification } from 'contexts/NotificationContext';

const BrowseSkillCard: React.FC<{
    k: string;
    v: string | string[];
    match?: boolean;
}> = ({ k, v, match }) => {
    return (
        <div
            className={`text-sm border-2 rounded-full shadow-sm p-2 ${
                match
                    ? 'bg-green-100 border-green-200'
                    : 'bg-white border-gray-200'
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

const DynamicListing: React.FC<{
    listing: any;
    updateListing: number;
    setUpdateListing: Dispatch<SetStateAction<number>>;
}> = ({ listing, updateListing, setUpdateListing }) => {
    const [selfUser, setSelfUser] = useState<any>();
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [update, setUpdate] = useState(0);
    const [isEditing, setEditing] = useState(false);

    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showBasicsModal, setShowBasicsModal] = useState(false);
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRequirementsModal, setShowRequirementsModal] = useState(false);

    const { addNotification } = useNotification();

    useEffect(() => {
        const su = localData.get('user');

        if (su?.id) {
            setSelfUser(su);
            if (su.accountType === 'talent') {
                setBookmarks(su?.talentData?.bookmarkedListings || []);
            }
        }
    }, [update]);

    const bookmark = async (listingId: string, bookmarked: boolean) => {
        const bookmarks =
            (
                await apiRequest('POST', '/talent/bookmarks/listings', {
                    listingId,
                    bookmarked,
                })
            )?.data?.bookmarkedListings || [];

        setBookmarks(bookmarks);
        localData.set('user.talentData.bookmarkedListings', bookmarks);
        setUpdate(update + 1);
    };

    const router = useRouter();

    return (
        <>
            <Head>
                <title>{`${listing.title} at ${listing.client.contact.companyName} | RemoteRep.com`}</title>
                <meta
                    property="og:title"
                    content={`${listing.title} at ${listing.client.contact.companyName} | RemoteRep.com`}
                />
                <meta
                    property="og:image"
                    content={listing?.client?.clientData?.profile?.photoUrl}
                />
                <meta
                    property="og:description"
                    content={`NOW HIRING: ${
                        listing?.details?.commitment
                    } ${listing?.requirements?.salesTypes?.join('/')} ${
                        listing?.details?.salesRole
                    } opportunity for talent with over ${
                        listing?.requirements?.yearsOfExperience
                    } years and ${listing?.requirements?.salesVolumes?.join(
                        ' - '
                    )} in annual sales  | Explore ${listing.title} at ${
                        listing.client.contact.companyName
                    } and discover similar listings on RemoteRep.com.`}
                />
            </Head>

            {!selfUser?.id ? (
                <PublicCta
                    title={listing.title}
                    name={listing.client.contact.companyName}
                />
            ) : null}

            <div className="h-full max-w-7xl mx-auto py-16 px-4">
                <div className="w-full grid md:flex md:justify-between px-4 py-4">
                    <div className="inline-flex">
                        {listing?.client?.clientData?.profile?.photoUrl ? (
                            <img
                                src={
                                    listing?.client?.clientData?.profile
                                        ?.photoUrl
                                }
                                className="h-16 w-16 md:h-48 md:w-48 rounded-full"
                            />
                        ) : (
                            <UserIcon
                                className="p-8 h-16 w-16 md:h-48 md:w-48 rounded-full text-gray-300 bg-gray-100"
                                aria-hidden="true"
                            />
                        )}

                        <div className="ml-8 font-medium text-gray-900 flex items-center">
                            <div className="my-auto">
                                <EditWrapper
                                    onClick={() => setShowBasicsModal(true)}
                                    active={isEditing}
                                    escapeMargins
                                >
                                    <span className="text-2xl md:text-5xl">
                                        {listing.title}
                                    </span>
                                </EditWrapper>
                                <div className="mt-2">
                                    <span className="text-lg">
                                        {listing?.client?.contact
                                            ?.companyName || null}
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <span className="text-md md:text-xl inline-flex text-gray-900">
                                        <MapPinIcon className="my-auto h-4 w-4 md:h-6 md:w-6 text-gray-900" />
                                        <span className="ml-2">
                                            {[
                                                listing?.client?.contact
                                                    ?.addressCity,
                                                listing?.client?.contact
                                                    ?.addressState,
                                                listing?.client?.contact
                                                    ?.addressCountry,
                                            ].join(', ')}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-full flex justify-center items-center gap-6 px-4 py-4">
                        {selfUser?.id === listing?.client?.id ? (
                            <>
                                {isEditing ? (
                                    <RoundButton
                                        {...{
                                            name: 'Save changes',
                                            icon: CheckIcon,
                                            onClick: () => setEditing(false),
                                        }}
                                    />
                                ) : (
                                    <RoundButton
                                        {...{
                                            name: 'Edit listing',
                                            icon: PencilIcon,
                                            onClick: () => setEditing(true),
                                        }}
                                    />
                                )}
                            </>
                        ) : (
                            <>
                                <RoundButton
                                    {...{
                                        name: 'Message',
                                        icon: EnvelopeIcon,
                                        onClick: () =>
                                            router.push(
                                                selfUser?.id
                                                    ? `/app/talent/chats?target=${listing.client.id}`
                                                    : `/authentication/sign-up/talent`
                                            ),
                                    }}
                                />
                                {selfUser?.accountType === 'talent' ? (
                                    <>
                                        {listing?.applications?.length &&
                                        listing.applications.some(
                                            (a: any) => a.talent === selfUser.id
                                        ) ? (
                                            <RoundButton
                                                {...{
                                                    name: 'Applied',
                                                    icon: SolidClipboardDocumentCheckIcon,
                                                    onClick: () => {},
                                                    className: 'text-primary',
                                                }}
                                            />
                                        ) : (
                                            <RoundButton
                                                {...{
                                                    name: 'Apply',
                                                    icon: ClipboardDocumentCheckIcon,
                                                    onClick: () =>
                                                        setShowApplyModal(true),
                                                }}
                                            />
                                        )}
                                        {bookmarks.includes(listing.id) ? (
                                            <RoundButton
                                                {...{
                                                    name: 'Unbookmark',
                                                    icon: SolidBookmarkIcon,
                                                    onClick: () =>
                                                        bookmark(
                                                            listing.id,
                                                            false
                                                        ),
                                                    className: 'text-primary',
                                                }}
                                            />
                                        ) : (
                                            <RoundButton
                                                {...{
                                                    name: 'Bookmark',
                                                    icon: BookmarkIcon,
                                                    onClick: () =>
                                                        bookmark(
                                                            listing.id,
                                                            true
                                                        ),
                                                }}
                                            />
                                        )}
                                    </>
                                ) : null}
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-8">
                    {listing?.description && (
                        <div
                            className={`${
                                listing?.instructions || isEditing
                                    ? 'md:col-span-1'
                                    : ''
                            } col-span-2 p-8 bg-blue-200 rounded-xl text-gray-900`}
                        >
                            <EditWrapper
                                onClick={() => setShowBasicsModal(true)}
                                active={isEditing}
                                escapeMargins
                            >
                                <h3 className="text-2xl">Description</h3>
                                <p className="mt-4 text-md text-gray-900 whitespace-pre-wrap">
                                    {listing?.description}
                                </p>
                            </EditWrapper>
                        </div>
                    )}

                    {(isEditing || listing?.instructions) && (
                        <div className="col-span-2 md:col-span-1 p-8 bg-gray-100 rounded-xl text-gray-900">
                            <EditWrapper
                                onClick={() => setShowInstructionsModal(true)}
                                active={isEditing}
                                escapeMargins
                            >
                                <h3 className="text-2xl">
                                    Application instructions
                                </h3>
                                <p className="mt-4 text-md text-gray-900 whitespace-pre-wrap">
                                    {listing?.instructions}
                                </p>
                            </EditWrapper>
                        </div>
                    )}

                    {listing?.details && (
                        <div className="col-span-2 p-8 bg-gray-100 rounded-xl text-gray-900">
                            <h3 className="text-2xl">Details</h3>

                            {listing?.details ? (
                                <>
                                    <EditWrapper
                                        onClick={() =>
                                            setShowDetailsModal(true)
                                        }
                                        active={isEditing}
                                        escapeMargins
                                    >
                                        <div className="mt-4 py-2 flex flex-wrap gap-2">
                                            {Object.entries(
                                                listing?.details
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
                                                                    f.name === k
                                                            ).label,
                                                            v,
                                                        }}
                                                    />
                                                ) : null;
                                            })}
                                        </div>
                                    </EditWrapper>
                                </>
                            ) : null}
                        </div>
                    )}

                    {listing?.requirements && (
                        <div className="col-span-2 p-8 bg-gray-100 rounded-xl text-gray-900">
                            <h3 className="text-2xl">Requirements</h3>

                            {listing?.requirements ? (
                                <>
                                    <EditWrapper
                                        onClick={() =>
                                            setShowRequirementsModal(true)
                                        }
                                        active={isEditing}
                                        escapeMargins
                                    >
                                        <div className="mt-4 py-2 flex flex-wrap gap-2">
                                            {Object.entries(
                                                listing?.requirements
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
                                                        }}
                                                    />
                                                ) : null;
                                            })}
                                        </div>
                                    </EditWrapper>
                                </>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            <FormModal
                {...{
                    show: showApplyModal,
                    setShow: setShowApplyModal,
                    formName: 'listingApplication',
                    submitText: 'Send application',
                    postFunc: async (data) => {
                        try {
                            const applyReq = await apiRequest(
                                'POST',
                                '/talent/applications/',
                                {
                                    applicationMessage:
                                        data?.applicationMessage || undefined,
                                    listingId: listing.id,
                                }
                            );

                            if (applyReq.status === 201) {
                                addNotification({
                                    type: 'success',
                                    title: 'Application sent successfully',
                                    text: 'Refreshing your view...',
                                });

                                setUpdateListing(updateListing + 1);
                                setTimeout(
                                    () => setShowApplyModal(false),
                                    1000
                                );

                                return true;
                            } else return false;
                        } catch {
                            addNotification({
                                type: 'error',
                                title: 'Error sending application',
                                text: 'Please try again later...',
                            });
                            return false;
                        }
                    },
                }}
            />

            <FormModal
                {...{
                    show: showBasicsModal,
                    setShow: setShowBasicsModal,
                    formName: 'listingBasics',
                    submitText: 'Save',
                    getFunc: async () => {
                        return {
                            title: listing.title,
                            description: listing.description,
                        };
                    },
                    postFunc: async (data) => {
                        try {
                            const updateReq = await apiRequest(
                                'PATCH',
                                `/client/listings/${listing.id}`,
                                { basics: data }
                            );

                            if (updateReq.status === 200 && updateReq.data) {
                                addNotification({
                                    type: 'success',
                                    title: 'Listing updated successfully',
                                    text: 'Refreshing your view...',
                                });

                                setUpdateListing(updateListing + 1);

                                setTimeout(
                                    () => setShowBasicsModal(false),
                                    1000
                                );
                                return true;
                            } else return false;
                        } catch {
                            addNotification({
                                type: 'error',
                                title: 'Error updating listing',
                                text: 'Please try again later...',
                            });
                            return false;
                        }
                    },
                }}
            />

            <FormModal
                {...{
                    show: showInstructionsModal,
                    setShow: setShowInstructionsModal,
                    formName: 'listingInstructions',
                    submitText: 'Save',
                    getFunc: async () => {
                        return {
                            instructions: listing.instructions,
                            calendarLink: listing.calendarLink,
                        };
                    },
                    postFunc: async (data) => {
                        try {
                            const updateReq = await apiRequest(
                                'PATCH',
                                `/client/listings/${listing.id}`,
                                { instructions: data }
                            );

                            if (updateReq.status === 200 && updateReq.data) {
                                addNotification({
                                    type: 'success',
                                    title: 'Listing updated successfully',
                                    text: 'Refreshing your view...',
                                });
                                setUpdateListing(updateListing + 1);

                                setTimeout(
                                    () => setShowInstructionsModal(false),
                                    1000
                                );
                                return true;
                            } else return false;
                        } catch {
                            addNotification({
                                type: 'error',
                                title: 'Error updating listing',
                                text: 'Please try again later...',
                            });
                            return false;
                        }
                    },
                }}
            />

            <FormModal
                {...{
                    show: showDetailsModal,
                    setShow: setShowDetailsModal,
                    formName: 'listingDetails',
                    submitText: 'Save',
                    getFunc: async () => {
                        return listing?.details;
                    },
                    postFunc: async (data) => {
                        try {
                            const updateReq = await apiRequest(
                                'PATCH',
                                `/client/listings/${listing.id}`,
                                {
                                    details: Object.fromEntries(
                                        Object.entries(data).map(
                                            ([k, v]: any[]) => {
                                                if (v)
                                                    return (
                                                        formFields.get(
                                                            'listingDetails'
                                                        ) as any[]
                                                    ).find(
                                                        (f: any) => f.name === k
                                                    ).type === 'multiselect'
                                                        ? [k, v.split(', ')]
                                                        : [k, v];
                                                else return [];
                                            }
                                        )
                                    ),
                                }
                            );

                            if (updateReq.status === 200 && updateReq.data) {
                                addNotification({
                                    type: 'success',
                                    title: 'Listing updated successfully',
                                    text: 'Refreshing your view...',
                                });
                                setUpdateListing(updateListing + 1);

                                setTimeout(
                                    () => setShowDetailsModal(false),
                                    1000
                                );
                                return true;
                            } else return false;
                        } catch {
                            addNotification({
                                type: 'error',
                                title: 'Error updating listing',
                                text: 'Please try again later...',
                            });
                            return false;
                        }
                    },
                }}
            />

            <FormModal
                {...{
                    show: showRequirementsModal,
                    setShow: setShowRequirementsModal,
                    formName: 'listingRequirements',
                    submitText: 'Save',
                    getFunc: async () => {
                        return listing?.requirements;
                    },
                    postFunc: async (data) => {
                        try {
                            const updateReq = await apiRequest(
                                'PATCH',
                                `/client/listings/${listing.id}`,
                                {
                                    requirements: Object.fromEntries(
                                        Object.entries(data).map(
                                            ([k, v]: any[]) => {
                                                if (v)
                                                    return (
                                                        formFields.get(
                                                            'listingRequirements'
                                                        ) as any[]
                                                    ).find(
                                                        (f: any) => f.name === k
                                                    ).type === 'multiselect'
                                                        ? [k, v.split(', ')]
                                                        : [k, v];
                                                else return [];
                                            }
                                        )
                                    ),
                                }
                            );

                            if (updateReq.status === 200 && updateReq.data) {
                                addNotification({
                                    type: 'success',
                                    title: 'Listing updated successfully',
                                    text: 'Refreshing your view...',
                                });
                                setUpdateListing(updateListing + 1);

                                setTimeout(
                                    () => setShowRequirementsModal(false),
                                    1000
                                );
                                return true;
                            } else return false;
                        } catch {
                            addNotification({
                                type: 'error',
                                title: 'Error updating listing',
                                text: 'Please try again later...',
                            });
                            return false;
                        }
                    },
                }}
            />
        </>
    );
};

export default DynamicListing;
