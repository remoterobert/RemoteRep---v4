import { MapPinIcon } from '@heroicons/react/20/solid';
import {
    XCircleIcon,
    BookmarkIcon,
    BuildingOffice2Icon,
    CheckIcon,
    ClipboardDocumentListIcon,
    EnvelopeIcon,
    PencilIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as SolidBookmarkIcon } from '@heroicons/react/24/solid';
import { RoundButton } from 'components/commons/roundButton';
import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';
import * as localData from 'services/localData';
import { EditWrapper } from './editWrapper';
import { FormModal } from 'components/commons/formModal';
import { PublicCta } from './publicCta';
import Head from 'next/head';
import { useNotification } from 'contexts/NotificationContext';
import DeleteAccountModal from './deleteAccountModal';
import DeleteAccount from './deleteAccount';

const ClientProfile: React.FC<{
    user: any;
    updateUser: number;
    setUpdateUser: Dispatch<SetStateAction<number>>;
}> = ({ user, updateUser, setUpdateUser }) => {
    const [selfUser, setSelfUser] = useState<any>();
    const [bookmarks, setBookmarks] = useState<string[]>([]);
    const [update, setUpdate] = useState(0);
    const [isEditing, setEditing] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isDeleting, setDeleting] = useState(false);

    const [photoUpdate, setPhotoUpdate] = useState(0);

    const { addNotification } = useNotification();

    const handelCloseDeleteModal = () => {
        setDeleting(false);
    };

    useEffect(() => {
        const su = localData.get('user');

        if (su?.id) {
            setSelfUser(su);
            if (su.accountType === 'talent') {
                setBookmarks(su?.talentData?.bookmarkedClients || []);
            }
        }
    }, [update]);

    const bookmark = async (clientId: string, bookmarked: boolean) => {
        const bookmarks =
            (
                await apiRequest('POST', '/talent/bookmarks/clients', {
                    clientId,
                    bookmarked,
                })
            )?.data?.bookmarkedClients || [];

        setBookmarks(bookmarks);
        localData.set('user.talentData.bookmarkedClients', bookmarks);
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
                <title>{`${user?.contact?.companyName} | RemoteRep.com`}</title>
                <meta
                    property="og:title"
                    content={`${user?.contact?.companyName} | RemoteRep.com`}
                />
                <meta
                    property="og:image"
                    content={user?.clientData?.profile?.photoUrl}
                />
                <meta
                    property="og:description"
                    content={`Explore ${user?.contact?.companyName}'s profile and discover similar companies on RemoteRep.com.`}
                />
            </Head>

            {!selfUser?.id ? (
                <PublicCta type="client" name={user?.contact?.companyName} />
            ) : null}

        <div className='h-[93vh] w-full flex justify-center items-start bg-background dark:bg-darkBackground'>
            <div className="w-full mx-auto py-16 px-4 bg-background dark:bg-darkBackground flex flex-col justify-center items-center">
                <div className="w-full grid md:flex md:justify-between px-4 py-4 max-w-7xl">
                    <div className="inline-flex">
                        <EditWrapper
                            onClick={() => setShowProfileModal(true)}
                            active={isEditing}
                        >
                            {user?.clientData?.profile?.photoUrl ? (
                                <img
                                    src={
                                        user?.clientData?.profile?.photoUrl +
                                        `?${photoUpdate}`
                                    }
                                    className="h-16 w-16 md:h-48 md:w-48 rounded-full"
                                />
                            ) : (
                                <BuildingOffice2Icon
                                    className="p-8 h-16 w-16 md:h-48 md:w-48 rounded-full text-gray-300 bg-gray-100"
                                    aria-hidden="true"
                                />
                            )}
                        </EditWrapper>

                        <div className="ml-8 font-medium text-black dark:text-white flex items-center">
                            <div className="my-auto">
                                <EditWrapper
                                    onClick={() =>
                                        router.push('/app/client/settings')
                                    }
                                    active={isEditing}
                                >
                                    <span className="text-2xl md:text-5xl">
                                        {user?.contact?.companyName}
                                    </span>
                                    <div className="mt-4">
                                        <span className="text-md md:text-xl inline-flex text-gray-900 dark:text-white">
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
                                                    ? `/app/talent/chats?target=${user.id}`
                                                    : `/authentication/sign-up/${
                                                          user.accountType ===
                                                          'talent'
                                                              ? 'client'
                                                              : 'talent'
                                                      }`
                                            ),
                                    }}
                                />
                                {selfUser?.accountType === 'talent' ? (
                                    <>
                                        <RoundButton
                                            {...{
                                                name: 'Browse listings',
                                                icon: ClipboardDocumentListIcon,
                                                onClick: () =>
                                                    router.push(
                                                        `/app/talent/browse-listings?client=${user.id}`
                                                    ),
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

                <div className="mt-8 grid grid-cols-2 gap-8 w-full max-w-7xl">
                    <div className="col-span-2 p-8 bg-gray-100 rounded-xl text-gray-900 bg-white dark:bg-darkForeground text-black dark:text-white">
                        <EditWrapper
                            onClick={() => setShowProfileModal(true)}
                            active={isEditing}
                        >
                            <h3 className="text-2xl">
                                {`${
                                    user?.clientData?.profile?.companyAge
                                } year${
                                    user?.clientData?.profile?.companyAge > 1
                                        ? 's'
                                        : ''
                                } in ${
                                    user?.clientData?.profile?.industry
                                } with ${
                                    user?.clientData?.profile?.companyHeadcount
                                } employee${
                                    user?.clientData?.profile
                                        ?.companyHeadcount > 1
                                        ? 's'
                                        : ''
                                }`}
                            </h3>
                        </EditWrapper>
                    </div>
                </div>
            </div>
        </div>

            <FormModal
                {...{
                    show: showProfileModal,
                    setShow: setShowProfileModal,
                    formName: 'clientProfile',
                    submitText: 'Save',
                    getFunc: async () => {
                        return user?.clientData?.profile;
                    },
                    postFunc: async (data) => {
                        try {
                            const updateReq = await apiRequest(
                                'PATCH',
                                '/client/',
                                {
                                    profile: Object.fromEntries(
                                        Object.entries(data).map(([k, v]) => {
                                            if (v) return [k, v];
                                            else return [];
                                        })
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
                                    'user.clientData',
                                    updateReq.data.clientData
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
            <DeleteAccountModal show={isDeleting} onClose={setDeleting}>
                <DeleteAccount
                    handleClose={handelCloseDeleteModal}
                    user={user}
                />
            </DeleteAccountModal>
        </>
    );
};

export default ClientProfile;
