import { Dialog, Transition } from '@headlessui/react';
import { Dispatch, Fragment, SetStateAction } from 'react';

export const ResumeModal: React.FC<{
    show: boolean;
    setShow: Dispatch<SetStateAction<boolean>>;
    fileUrl: string;
}> = ({ show, setShow, fileUrl }) => {
    return (
        <Transition.Root show={show} as={Fragment}>
            <Dialog as="div" className="relative z-40" onClose={setShow}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 dark:bg-darkForeground bg-opacity-75 transition-opacity" />
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
                            <Dialog.Panel className="relative transform overflow-visible rounded-lg bg-white dark:bg-lightForeground px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[70vw] h-[80vh] sm:p-6">
                                <embed
                                    src={fileUrl}
                                    width="100%"
                                    height="100%"
                                    type="application/pdf"
                                />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};
