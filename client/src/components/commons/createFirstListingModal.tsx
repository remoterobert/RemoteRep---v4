import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { Dispatch, Fragment, SetStateAction } from 'react';

export const CreateFirstListingModal: React.FC<{
    show: boolean;
    setShow: Dispatch<SetStateAction<boolean>>;
}> = ({ show, setShow }) => {
    const router = useRouter();

    return (
        <Transition.Root show={show} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={setShow}>
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
                            <Dialog.Panel className="relative transform overflow-visible rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[25vw] sm:p-6">
                                <div>
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                                        <ExclamationTriangleIcon
                                            className="h-6 w-6 text-yellow-600"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-5">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-base leading-6 font-semibold text-gray-900 text-lg"
                                        >
                                            You've discovered a paid feature.
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <p className="text-gray-900">
                                                We wanted to make sure you had a
                                                chance to explore the platform
                                                before making a payment. If
                                                you're ready to begin using the
                                                full capabilities of our
                                                platform, it's time to upgrade.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-6">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                        onClick={() =>
                                            router.push(
                                                '/app/client/create-listing'
                                            )
                                        }
                                    >
                                        Choose your plan
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};
