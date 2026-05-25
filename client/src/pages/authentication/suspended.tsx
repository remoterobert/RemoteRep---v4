import type { NextPage } from 'next';
import { NoSymbolIcon } from '@heroicons/react/24/outline';

const Suspended: NextPage = () => {
    return (
        <>
            <div className="shadow-lg w-full h-16 py-4 px-8">
                <img
                    className="absolute w-auto h-8"
                    src="/white-logo-with-text.svg"
                />
            </div>

            <img
                className="absolute inset-0 h-full w-full object-cover filter blur-xs -z-10"
                src="/sign-up-background.jpg"
            />

            <div className="flex items-center justify-center h-full max-h-[90vh] w-full md:w-[50vw] overflow-clip">
                <div className="absolute bg-white shadow-xl rounded-xl w-[80vw] md:w-[20vw]">
                    <div className="px-4 py-5 sm:px-6">
                        <span className="text-xl font-medium text-gray-900">
                            Account suspended.
                        </span>

                        <div className="mt-8 text-center">
                            <NoSymbolIcon
                                className="mx-auto h-12 w-12 text-primary"
                                aria-hidden="true"
                            />
                            <p className="mt-4 text-center text-md font-medium text-gray-900">
                                Please send an email to support@remoterep.com if
                                you think this was a mistake.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Suspended;
