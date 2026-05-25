import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

const TextareaInput: React.FC<{
    name: string;
    defaultValue?: any;
    disabled?: boolean;
    placeholder?: string;
    validation?: { [key: string]: any };
}> = ({ name, defaultValue, disabled, placeholder, validation }) => {
    const { register } = useFormContext();

    return (
        <textarea
            {...{
                ...register(name, validation),
                defaultValue,
                className:
                    'block w-full rounded-md border-0 py-1.5 bg-white dark:bg-lightForeground text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500',
                disabled,
                placeholder,
            }}
        />
    );
};

export { TextareaInput };
