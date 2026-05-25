import {
    DocumentArrowUpIcon,
    DocumentCheckIcon,
    DocumentIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

const FileInput: React.FC<{
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

            <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                    {disabled ? (
                        <div
                            onClick={() => window.open(defaultValue, '_blank')}
                        >
                            <DocumentIcon
                                className="mx-auto h-12 w-12 text-gray-300"
                                aria-hidden="true"
                            />
                            <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                <label
                                    htmlFor={`${name}-upload`}
                                    className="relative cursor-pointer rounded-md bg-white dark:bg-darkForeground font-semibold text-primaryBlue focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary"
                                >
                                    <span>View file</span>
                                </label>
                            </div>
                        </div>
                    ) : (
                        <>
                            {filePath ? (
                                <DocumentCheckIcon
                                    className="mx-auto h-12 w-12 text-gray-300"
                                    aria-hidden="true"
                                />
                            ) : (
                                <DocumentArrowUpIcon
                                    className="mx-auto h-12 w-12 text-gray-300"
                                    aria-hidden="true"
                                />
                            )}
                            <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                <label
                                    htmlFor={`${name}-upload`}
                                    className="relative cursor-pointer rounded-md bg-white dark:bg-darkForeground font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary"
                                >
                                    <span>
                                        {filePath
                                            ? 'Upload new file'
                                            : 'Upload a file'}
                                    </span>
                                    <input
                                        id={`${name}-upload`}
                                        name={`${name}-upload`}
                                        type="file"
                                        className="sr-only"
                                        accept={
                                            accept
                                                ? accept.join(', ')
                                                : undefined
                                        }
                                        onChange={(e) => {
                                            if (uploadFunc)
                                                uploadFunc(
                                                    e.target.files,
                                                    (path: string) => {
                                                        setValue(name, path);
                                                        setFilePath(path);
                                                    }
                                                );
                                        }}
                                    />
                                </label>
                            </div>
                            <p className="text-xs leading-5 text-gray-600">
                                {accept
                                    ?.map((a: string) => a.toUpperCase())
                                    .join(', ')}{' '}
                                up to 4MB
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export { FileInput };
