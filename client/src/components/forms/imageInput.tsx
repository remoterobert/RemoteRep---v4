import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

const ImageInput: React.FC<{
    name: string;
    defaultValue?: any;
    disabled?: boolean;
    validation?: { [key: string]: any };
    accept?: string[];
    uploadFunc?: (files: any, callback: any) => void;
}> = ({ name, defaultValue, disabled, validation, accept, uploadFunc }) => {
    const { register, setValue } = useFormContext();

    const [filePath, setFilePath] = useState(defaultValue);
    const [uploaded, setUploaded] = useState<any>('');
    const [update, setUpdate] = useState(0);

    return (
        <div>
            <input
                {...{
                    type: 'text',
                    ...register(name, validation),
                    defaultValue,
                    className: 'hidden',
                }}
            />

            <div className="flex">
                <div className="mt-4 inline-block h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                    {filePath ? (
                        <img
                            src={`${filePath}?${update}`}
                            className="pointer-events-none h-full w-full"
                        />
                    ) : (
                        <svg
                            className="h-full w-full text-gray-300"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    )}
                </div>

                {!disabled && (
                    <div className="ml-4 mt-7">
                        <label
                            htmlFor={`${name}-upload`}
                            className="relative w-5 cursor-pointer rounded-md bg-white font-medium text-primary"
                        >
                            <span className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                                {filePath ? 'Change' : 'Upload'}
                            </span>
                            <input
                                id={`${name}-upload`}
                                name={`${name}-upload`}
                                type="file"
                                className="sr-only"
                                accept={accept ? accept.join(', ') : undefined}
                                onChange={(e) => {
                                    if (uploadFunc)
                                        uploadFunc(
                                            e.target.files,
                                            (path: string) => {
                                                setValue(name, path);
                                                setFilePath(path);
                                                setUpdate(update + 1);
                                            }
                                        );
                                }}
                            />
                        </label>
                    </div>
                )}
            </div>
            {uploaded && (
                <div className="mt-2">
                    <span className="mt-8 text-sm font-medium text-primary">
                        Uploaded!
                    </span>
                </div>
            )}
        </div>
    );
};

export { ImageInput };
