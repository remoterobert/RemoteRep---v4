import {
    ArrowTopRightOnSquareIcon,
    MapPinIcon,
} from '@heroicons/react/20/solid';
import {
    BookmarkIcon,
    CheckIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    PencilIcon,
    UserIcon,
    UserPlusIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as SolidBookmarkIcon } from '@heroicons/react/24/solid';
import { FormModal } from 'components/commons/formModal';
import { RoundButton } from 'components/commons/roundButton';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';
import * as formFields from 'services/formFields';
import * as localData from 'services/localData';
import { EditWrapper } from './editWrapper';
import { PublicCta } from './publicCta';
import { useNotification } from 'contexts/NotificationContext';
import DeleteAccountModal from './deleteAccountModal';
import DeleteAccount from './deleteAccount';
import { ResumeModal } from 'components/commons/resumeModal';

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

const TalentProfile: React.FC<{
    user: any;
    updateUser: number;
    setUpdateUser: Dispatch<SetStateAction<number>>;
}> = ({ user, updateUser, setUpdateUser }) => {
    const [selfUser, setSelfUser] = useState<any>();
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [update, setUpdate] = useState(0);
    const [showInvite, setShowInvite] = useState(false);
    const [listings, setListings] = useState<any[]>([]);
    const [isEditing, setEditing] = useState(false);
    const [isDeleting, setDeleting] = useState(false);

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showExperienceModal, setShowExperienceModal] = useState(false);
    const [showGoalsModal, setShowGoalsModal] = useState(false);
    const [resumeModalShown, setResumeModalShown] = useState(false);

    const [photoUpdate, setPhotoUpdate] = useState(0);

    const { addNotification } = useNotification();

    const handelCloseDeleteModal = () => {
        setDeleting(false);
    };

    useEffect(() => {
        const su = localData.get('user');

        if (su?.id) {
            setSelfUser(su);
            if (su.accountType === 'client') {
                setBookmarks(su?.clientData?.bookmarkedTalent || []);

                apiRequest('GET', '/client/listings').then((apiRes) =>
                    setListings(apiRes?.data?.listings || [])
                );
            }
        }
    }, [update]);

    const bookmark = async (talentId: string, bookmarked: boolean) => {
        const bookmarks =
            (
                await apiRequest('POST', '/client/bookmarks/talent', {
                    talentId,
                    bookmarked,
                })
            )?.data?.bookmarkedTalent || [];

        setBookmarks(bookmarks);
        localData.set('user.clientData.bookmarkedTalent', bookmarks);
        setUpdate(update + 1);

        addNotification({
            type: 'success',
            title: 'Bookmarks updated successfully',
            text: 'Refreshing your view...',
        });
    };

    const router = useRouter();

    return (
        <>
            <Head>
                <title>{`${user?.contact?.firstName} ${user?.contact?.lastName} | RemoteRep.com`}</title>
                <meta
                    property="og:title"
                    content={`${user?.contact?.firstName} ${user?.contact?.lastName} | RemoteRep.com`}
                />
                <meta
                    property="og:image"
                    content={user?.talentData?.profile?.photoUrl}
                />
                <meta
                    property="og:description"
                    content={`${user?.talentData?.experience?.salesTypes?.join(
                        '/'
                    )} ${user?.talentData?.experience?.salesRoles?.join(
                        '/'
                    )} with ${
                        user?.talentData?.experience?.yearsOfExperience
                    } years of experience and ${user?.talentData?.experience?.salesVolumes?.join(
                        ' - '
                    )} in annual sales | Explore ${
                        user?.contact?.firstName
                    }'s profile and discover similar talent on RemoteRep.com.`}
                />
            </Head>

            {!selfUser?.id ? (
                <PublicCta type="talent" name={user?.contact?.firstName} />
            ) : null}

            <div className="h-full max-w-7xl mx-auto py-16 px-4">
                <div className="w-full grid md:flex md:justify-between px-4 py-4">
                    <div className="inline-flex">
                        <EditWrapper
                            onClick={() => setShowProfileModal(true)}
                            active={isEditing}
                        >
                            {user?.talentData?.profile?.photoUrl ? (
                                <img
                                    src={
                                        user?.talentData?.profile?.photoUrl +
                                        `?${photoUpdate}`
                                    }
                                    className="h-16 w-16 md:h-48 md:w-48 rounded-full"
                                />
                            ) : (
                                <UserIcon
                                    className="p-8 h-16 w-16 md:h-48 md:w-48 rounded-full text-gray-300 bg-gray-100"
                                    aria-hidden="true"
                                />
                            )}
                        </EditWrapper>

                        <div className="ml-8 font-medium text-black dark:text-white flex items-center">
                            <div className="my-auto">
                                <EditWrapper
                                    onClick={() =>
                                        router.push('/app/talent/settings')
                                    }
                                    active={isEditing}
                                >
                                    <span className="text-2xl md:text-5xl">
                                        {`${user?.contact?.firstName} ${user?.contact?.lastName}`}
                                    </span>
                                    <div className="mt-4">
                                        <span className="text-md md:text-xl inline-flex">
                                            <MapPinIcon className="my-auto h-4 w-4 md:h-6 md:w-6" />
                                            <span className="ml-2">
                                                {[
                                                    user?.contact?.addressCity,
                                                    user?.contact?.addressState,
                                                    user?.contact
                                                        ?.addressCountry,
                                                ].join(', ')}
                                            </span>
                                        </span>
                                    </div>
                                </EditWrapper>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-full flex justify-center items-center gap-6 px-4 py-4">
                        {selfUser?.id === user.id ? (
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
                                    <>
                                        {user?.talentData?.files?.resume && (
                                            <RoundButton
                                                {...{
                                                    icon: DocumentTextIcon,
                                                    name: 'View résumé',
                                                    onClick: () =>
                                                        setResumeModalShown(
                                                            true
                                                        ),
                                                }}
                                            />
                                        )}
                                        <RoundButton
                                            {...{
                                                name: 'Edit profile',
                                                icon: PencilIcon,
                                                onClick: () => setEditing(true),
                                            }}
                                        />
                                        <RoundButton
                                            {...{
                                                name: 'Delete profile',
                                                icon: XCircleIcon,
                                                onClick: () =>
                                                    setDeleting(true),
                                            }}
                                        />
                                    </>
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
                                                    ? `/app/client/chats?target=${user.id}`
                                                    : `/authentication/sign-up/${
                                                          user.accountType ===
                                                          'talent'
                                                              ? 'client'
                                                              : 'talent'
                                                      }`
                                            ),
                                    }}
                                />
                                {selfUser?.accountType === 'client' ? (
                                    <>
                                        <RoundButton
                                            {...{
                                                name: 'Invite to apply',
                                                icon: UserPlusIcon,
                                                onClick: () =>
                                                    setShowInvite(true),
                                            }}
                                        />
                                        {bookmarks.includes(user.id) ? (
                                            <RoundButton
                                                {...{
                                                    name: 'Unbookmark',
                                                    icon: SolidBookmarkIcon,
                                                    onClick: () =>
                                                        bookmark(
                                                            user.id,
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
                                                        bookmark(user.id, true),
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
                    {(user?.talentData?.profile?.about || isEditing) && (
                        <div className="col-span-2 md:col-span-1 p-8 bg-white dark:bg-darkForeground rounded-xl text-gray-900 dark:text-white">
                            <EditWrapper
                                onClick={() => setShowProfileModal(true)}
                                active={isEditing}
                                escapeMargins
                            >
                                <h3 className="text-2xl">
                                    {user?.talentData?.profile?.headline}{' '}
                                    {user?.talentData?.profile?.videoUrl ? (
                                        <span className="ml-2">
                                            |{' '}
                                            <span
                                                className="text-primary hover:underline inline-flex items-center"
                                                onClick={() =>
                                                    window.open(
                                                        user?.talentData
                                                            ?.profile?.videoUrl,
                                                        '_blank'
                                                    )
                                                }
                                            >
                                                Introduction video{' '}
                                                <ArrowTopRightOnSquareIcon className="my-auto ml-1 h-4 w-4 text-primary" />
                                            </span>
                                        </span>
                                    ) : null}
                                </h3>

                                <p className="mt-4 text-md text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                                    {user?.talentData?.profile?.about}
                                </p>
                            </EditWrapper>
                        </div>
                    )}

                    {(user?.talentData?.experience?.yearsOfExperience ||
                        isEditing) && (
                        <div className="col-span-2 md:col-span-1 p-8 bg-gray-200 dark:bg-darkForeground rounded-xl text-gray-900 dark:text-white">
                            <h3 className="text-2xl">
                                {`${
                                    user?.talentData?.experience
                                        ?.yearsOfExperience || 0
                                } year${
                                    user?.talentData?.experience
                                        ?.yearsOfExperience !== 1
                                        ? 's'
                                        : ''
                                } in Sales`}
                            </h3>
                        </div>
                    )}

                    {((user?.talentData?.experience &&
                        Object.values(user?.talentData?.experience).some(
                            (v: any) => v
                        )) ||
                        isEditing) && (
                        <div className="col-span-2 p-8 bg-white dark:bg-darkForeground rounded-xl text-black dark:text-white">
                            <h3 className="text-2xl">Experience</h3>

                            {user?.talentData?.experience ? (
                                <>
                                    <EditWrapper
                                        onClick={() =>
                                            setShowExperienceModal(true)
                                        }
                                        active={isEditing}
                                        escapeMargins
                                    >
                                        <div className="mt-4 py-2 flex flex-wrap gap-2">
                                            {Object.entries(
                                                user?.talentData?.experience
                                            ).map(([k, v]: any) => {
                                                return k !==
                                                    'yearsOfExperience' && v ? (
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

                    {((user?.talentData?.goals &&
                        Object.values(user?.talentData?.goals).some(
                            (v: any) => v
                        )) ||
                        isEditing) && (
                        <div className="col-span-2 p-8 bg-white dark:bg-darkForeground rounded-xl text-black dark:text-white">
                            <h3 className="text-2xl">Goals</h3>

                            {user?.talentData?.goals ? (
                                <>
                                    <EditWrapper
                                        onClick={() => setShowGoalsModal(true)}
                                        active={isEditing}
                                        escapeMargins
                                    >
                                        <div className="mt-4 py-2 flex flex-wrap gap-2">
                                            {Object.entries(
                                                user?.talentData?.goals
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
                    show: showInvite,
                    setShow: setShowInvite,
                    formFieldsOverride: [
                        {
                            className: 'col-span-6',
                            name: 'listingId',
                            type: 'select',
                            label: 'Listing',
                            options: listings.map((l: any) => {
                                return { value: l.id, display: l.title };
                            }),
                            validation: { required: true },
                        },
                    ],
                    submitText: 'Invite to apply',
                    postFunc: async (data) => {
                        const apiReq = await apiRequest(
                            'POST',
                            `/client/listings/${data.listingId}/applications`,
                            {
                                talentId: user.id,
                            }
                        );

                        if (apiReq.status === 200) {
                            addNotification({
                                type: 'success',
                                title: 'Invited to apply successfully',
                                text: 'Refreshing your view...',
                            });
                            return true;
                        } else {
                            addNotification({
                                type: 'error',
                                title: 'Error inviting talent',
                                text: 'Please try again later...',
                            });
                            return false;
                        }
                    },
                }}
            />

            <FormModal
                {...{
                    show: showProfileModal,
                    setShow: setShowProfileModal,
                    formName: 'talentProfile',
                    submitText: 'Save',
                    getFunc: async () => {
                        return user?.talentData?.profile;
                    },
                    postFunc: async (data) => {
                        try {
                            const updateReq = await apiRequest(
                                'PATCH',
                                '/talent/',
                                {
                                    profile: Object.fromEntries(
                                        Object.entries(data).map(
                                            ([k, v]: any[]) => {
                                                if (v)
                                                    return (
                                                        formFields.get(
                                                            'talentProfile'
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
                                    title: 'Profile updated successfully',
                                    text: 'Refreshing your view...',
                                });
                                localData.set(
                                    'user.talentData',
                                    updateReq.data.talentData
                                );

                                setUpdateUser(updateUser + 1);

                                setPhotoUpdate(photoUpdate + 1);

                                setTimeout(
                                    () => setShowProfileModal(false),
                                    1000
                                );
                                return true;
                            } else return false;
                        } catch {
                            addNotification({
                                type: 'error',
                                title: 'Error updating profile',
                                text: 'Please try again later...',
                            });
                            return false;
                        }
                    },
                }}
            />

            <FormModal
                {...{
                    show: showExperienceModal,
                    setShow: setShowExperienceModal,
                    formName: 'talentExperience',
                    submitText: 'Save',
                    getFunc: async () => {
                        return user?.talentData?.experience;
                    },
                    postFunc: async (data) => {
                        try {
                            const updateReq = await apiRequest(
                                'PATCH',
                                '/talent/',
                                {
                                    experience: Object.fromEntries(
                                        Object.entries(data).map(
                                            ([k, v]: any[]) => {
                                                if (v)
                                                    return (
                                                        formFields.get(
                                                            'talentExperience'
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
                                    title: 'Profile updated successfully',
                                    text: 'Refreshing your view...',
                                });
                                localData.set(
                                    'user.talentData',
                                    updateReq.data.talentData
                                );

                                setUpdateUser(updateUser + 1);

                                setTimeout(
                                    () => setShowExperienceModal(false),
                                    1000
                                );
                                return true;
                            } else return false;
                        } catch {
                            addNotification({
                                type: 'error',
                                title: 'Error updating profile',
                                text: 'Please try again later...',
                            });
                            return false;
                        }
                    },
                }}
            />

            <FormModal
                {...{
                    show: showGoalsModal,
                    setShow: setShowGoalsModal,
                    formName: 'talentGoals',
                    submitText: 'Save',
                    getFunc: async () => {
                        return user?.talentData?.goals;
                    },
                    postFunc: async (data) => {
                        try {
                            const updateReq = await apiRequest(
                                'PATCH',
                                '/talent/',
                                {
                                    goals: Object.fromEntries(
                                        Object.entries(data).map(
                                            ([k, v]: any[]) => {
                                                if (v)
                                                    return (
                                                        formFields.get(
                                                            'talentGoals'
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
                                    title: 'Profile updated successfully',
                                    text: 'Refreshing your view...',
                                });
                                localData.set(
                                    'user.talentData',
                                    updateReq.data.talentData
                                );

                                setUpdateUser(updateUser + 1);

                                setTimeout(
                                    () => setShowGoalsModal(false),
                                    1000
                                );
                                return true;
                            } else return false;
                        } catch {
                            addNotification({
                                type: 'error',
                                title: 'Error updating profile',
                                text: 'Please try again later...',
                            });
                            return false;
                        }
                    },
                }}
            />
            <DeleteAccountModal show={isDeleting} onClose={setDeleting}>
                <DeleteAccount
                    handleClose={handelCloseDeleteModal}
                    user={user}
                />
            </DeleteAccountModal>
            <ResumeModal
                show={resumeModalShown}
                setShow={setResumeModalShown}
                fileUrl={user?.talentData?.files?.resume}
            />
        </>
    );
};

export default TalentProfile;
