import type { NextPage } from 'next';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import { MapPinIcon } from '@heroicons/react/20/solid';
import * as localData from 'services/localData';
import * as formFields from 'services/formFields';
import { useForm } from 'react-hook-form';
import { Dialog, Transition } from '@headlessui/react';
import FormBuilder from 'components/forms/formBuilder';
import apiRequest from 'services/apiRequest';
import { PageHeader } from 'components/commons/pageHeader';
import { useNotification } from 'contexts/NotificationContext';

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

const EditListing: NextPage = () => {
    const [user, setUser] = useState<any>({});
    const [listing, setListing] = useState<any>({});

    const basicsForm = useForm();
    const [showBasicsForm, setShowBasicsForm] = useState(false);
    const instructionsForm = useForm();
    const [showInstructionsForm, setShowInstructionsForm] = useState(false);
    const detailsForm = useForm();
    const [showDetailsForm, setShowDetailsForm] = useState(false);
    const requirementsForm = useForm();
    const [showRequirementsForm, setShowRequirementsForm] = useState(false);

    const router = useRouter();

    const { addNotification } = useNotification();

    useEffect(() => {
        if (!router.isReady) return;

        (async () => {
            setUser(localData.get('user'));

            const listingReq = await apiRequest(
                'GET',
                `/client/listings/${router.query.id}`
            );

            if (listingReq?.data) setListing(listingReq.data);
        })();
    }, [router]);

    return (
        <>
            {/* Common header */}
            <PageHeader
                {...{ title: 'Edit listing', icon: PencilSquareIcon }}
            />

            {/* Page-specific content */}

            <div className="flex items-center justify-center h-[80vh]">
                <div className="bg-white shadow-xl rounded-xl w-[80vw] md:w-[40vw]">
                    <div className="border-b border-gray-200 bg-white py-4 rounded-t-xl">
                        <h3 className="text-center text-sm font-semibold text-gray-900">
                            This is how applicants will see your listing.
                        </h3>
                    </div>

                    <div className="w-full flex justify-between px-4 py-4">
                        <div className="inline-flex">
                            <img
                                src={user?.clientData?.profile?.photoUrl}
                                className="h-32 w-32 rounded-full"
                            />

                            <div className="ml-4 font-medium text-gray-900 flex items-center">
                                <div>
                                    <div>
                                        <EditWrapper
                                            onClick={() =>
                                                setShowBasicsForm(true)
                                            }
                                        >
                                            <span className="text-2xl">
                                                {listing?.title}
                                            </span>
                                        </EditWrapper>
                                    </div>
                                    <div className="mt-2">
                                        <span className="mt- text-lg whitespace-nowrap">
                                            {user?.contact?.companyName}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-sm inline-flex text-gray-700">
                                            <MapPinIcon className="my-auto h-4 w-4 text-gray-700" />
                                            {[
                                                user?.contact?.addressCity,
                                                user?.contact?.addressState,
                                                user?.contact?.addressCountry,
                                            ].join(', ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {listing?.description && (
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
                                        Description
                                    </span>
                                </div>
                            </div>
                            <div className="px-8 py-2">
                                <EditWrapper
                                    onClick={() => setShowBasicsForm(true)}
                                >
                                    <p className="mt-2 break-words whitespace-pre-wrap">
                                        {listing?.description}
                                    </p>
                                </EditWrapper>
                            </div>
                        </>
                    )}

                    {listing?.id && (
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
                                        Application instructions
                                    </span>
                                </div>
                            </div>
                            <div className="px-8 py-2">
                                <EditWrapper
                                    onClick={() =>
                                        setShowInstructionsForm(true)
                                    }
                                >
                                    <p className="mt-2 break-words whitespace-pre-wrap">
                                        {listing?.instructions}
                                    </p>
                                </EditWrapper>
                            </div>
                        </>
                    )}

                    {listing?.details &&
                        Object.values(listing?.details).some((v: any) => v) && (
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
                                            Details
                                        </span>
                                    </div>
                                </div>
                                <div className="px-8 py-2">
                                    <EditWrapper
                                        onClick={() => setShowDetailsForm(true)}
                                    >
                                        {listing?.details ? (
                                            <>
                                                <div className="py-2 flex flex-wrap gap-2">
                                                    {Object.entries(
                                                        listing?.details
                                                    ).map(([k, v]: any) => {
                                                        return v ? (
                                                            <SkillCard
                                                                {...{
                                                                    k: (
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
                                                                }}
                                                            />
                                                        ) : null;
                                                    })}
                                                </div>
                                            </>
                                        ) : null}
                                    </EditWrapper>
                                </div>
                            </>
                        )}

                    {listing?.requirements &&
                        Object.values(listing?.requirements).some(
                            (v: any) => v
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
                                            Requirements
                                        </span>
                                    </div>
                                </div>
                                <div className="px-8 py-2">
                                    <EditWrapper
                                        onClick={() =>
                                            setShowRequirementsForm(true)
                                        }
                                    >
                                        {listing?.requirements ? (
                                            <>
                                                <div className="py-2 flex flex-wrap gap-2">
                                                    {Object.entries(
                                                        listing?.requirements
                                                    ).map(([k, v]: any) => {
                                                        return v ? (
                                                            <SkillCard
                                                                {...{
                                                                    k: (
                                                                        formFields.get(
                                                                            'listingRequirements'
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
                                    </EditWrapper>
                                </div>
                            </>
                        )}
                </div>
            </div>

            <Transition.Root show={showBasicsForm} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={setShowBasicsForm}
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
                                            formHook: basicsForm,
                                            formName: 'listingBasics',
                                            submitText: 'Save',
                                            getFunc: async () => {
                                                return {
                                                    title: listing.title,
                                                    description:
                                                        listing.description,
                                                };
                                            },
                                            postFunc: async (data) => {
                                                try {
                                                    const updateReq =
                                                        await apiRequest(
                                                            'PATCH',
                                                            `/client/listings/${listing.id}`,
                                                            { basics: data }
                                                        );

                                                    if (
                                                        updateReq.status ===
                                                            200 &&
                                                        updateReq.data
                                                    ) {
                                                        addNotification({
                                                            type: 'success',
                                                            title: 'Listing updated successfully',
                                                            text: 'Refreshing your view...',
                                                        });

                                                        setListing(
                                                            updateReq.data
                                                        );

                                                        setTimeout(
                                                            () =>
                                                                setShowBasicsForm(
                                                                    false
                                                                ),
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
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            <Transition.Root show={showInstructionsForm} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={setShowInstructionsForm}
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
                                            formHook: instructionsForm,
                                            formName: 'listingInstructions',
                                            submitText: 'Save',
                                            getFunc: async () => {
                                                return {
                                                    instructions:
                                                        listing.instructions,
                                                    calendarLink:
                                                        listing.calendarLink,
                                                };
                                            },
                                            postFunc: async (data) => {
                                                try {
                                                    const updateReq =
                                                        await apiRequest(
                                                            'PATCH',
                                                            `/client/listings/${listing.id}`,
                                                            {
                                                                instructions:
                                                                    data,
                                                            }
                                                        );

                                                    if (
                                                        updateReq.status ===
                                                            200 &&
                                                        updateReq.data
                                                    ) {
                                                        addNotification({
                                                            type: 'success',
                                                            title: 'Listing updated successfully',
                                                            text: 'Refreshing your view...',
                                                        });

                                                        setListing(
                                                            updateReq.data
                                                        );

                                                        setTimeout(
                                                            () =>
                                                                setShowInstructionsForm(
                                                                    false
                                                                ),
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
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            <Transition.Root show={showDetailsForm} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={setShowDetailsForm}
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
                                            formHook: detailsForm,
                                            formName: 'listingDetails',
                                            submitText: 'Save',
                                            getFunc: async () => {
                                                return listing?.details;
                                            },
                                            postFunc: async (data) => {
                                                try {
                                                    const updateReq =
                                                        await apiRequest(
                                                            'PATCH',
                                                            `/client/listings/${listing.id}`,
                                                            {
                                                                details:
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
                                                                                            'listingDetails'
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
                                                        addNotification({
                                                            type: 'success',
                                                            title: 'Listing updated successfully',
                                                            text: 'Refreshing your view...',
                                                        });
                                                        setListing(
                                                            updateReq.data
                                                        );

                                                        setTimeout(
                                                            () =>
                                                                setShowDetailsForm(
                                                                    false
                                                                ),
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
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            <Transition.Root show={showRequirementsForm} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-10"
                    onClose={setShowRequirementsForm}
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
                                            formHook: requirementsForm,
                                            formName: 'listingRequirements',
                                            submitText: 'Save',
                                            getFunc: async () => {
                                                return listing?.requirements;
                                            },
                                            postFunc: async (data) => {
                                                try {
                                                    const updateReq =
                                                        await apiRequest(
                                                            'PATCH',
                                                            `/client/listings/${listing.id}`,
                                                            {
                                                                requirements:
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
                                                                                            'listingRequirements'
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
                                                        addNotification({
                                                            type: 'success',
                                                            title: 'Listing updated successfully',
                                                            text: 'Refreshing your view...',
                                                        });
                                                        setListing(
                                                            updateReq.data
                                                        );

                                                        setTimeout(
                                                            () =>
                                                                setShowRequirementsForm(
                                                                    false
                                                                ),
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
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    );
};

export default EditListing;
