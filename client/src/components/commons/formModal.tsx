import { Dialog, Transition } from '@headlessui/react';
import FormBuilder from 'components/forms/formBuilder';
import { Dispatch, Fragment, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { forms } from 'services/formFields';

export const FormModal: React.FC<{
    show: boolean;
    setShow: Dispatch<SetStateAction<boolean>>;
    formName?: keyof typeof forms;
    formFieldsOverride?: any;
    getFunc?: () => Promise<any>;
    postFunc: (data: any) => Promise<boolean>;
    submitText?: string;
}> = (props) => {
    const formHook = useForm();

    return (
        <Transition.Root show={props.show} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={props.setShow}>
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
                            <Dialog.Panel className="relative transform overflow-visible rounded-lg bg-white dark:bg-darkForeground px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[40vw] sm:p-6">
                                <FormBuilder
                                    {...{
                                        formHook: formHook,
                                        formName: props?.formName || undefined,
                                        formFieldsOverride:
                                            props?.formFieldsOverride ||
                                            undefined,
                                        submitText: props?.submitText || 'Save',
                                        getFunc: props?.getFunc || undefined,
                                        postFunc: async (data) => {
                                            const post = await props.postFunc(
                                                data
                                            );

                                            if (!post) return false;

                                            setTimeout(
                                                () =>
                                                    props.setShow(!props.show),
                                                1000
                                            );
                                            return true;
                                        },
                                    }}
                                />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};
