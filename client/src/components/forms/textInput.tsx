import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

const TextInput: React.FC<{
    name: string;
    defaultValue?: any;
    disabled?: boolean;
    placeholder?: string;
    validation?: { [key: string]: any };
    type?: string;
    prefix?:
        | { type: 'static'; display: string }
        | {
              type: 'dynamic';
              displays: { [key: string]: string };
              controlling: string;
          };
}> = ({
    name,
    defaultValue,
    disabled,
    placeholder,
    validation,
    type,
    prefix,
}) => {
    const { register, control } = useFormContext();

    const prefixControllingValue =
        prefix?.type === 'dynamic' && prefix?.controlling
            ? useWatch({
                  control,
                  name: prefix.controlling,
              })
            : null;

    return (
        <>
            {prefix ? (
                <>
                    <div className="flex rounded-full shadow-sm bg-white dark:bg-lightForeground">
                        <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-gray-500 dark:text-white sm:text-sm">
                            {prefix?.type === 'static'
                                ? prefix.display
                                : prefix.displays[prefixControllingValue]}
                        </span>
                        <input
                            {...{
                                type: type || 'text',
                                ...register(name, validation),
                                defaultValue,
                                className:
                                    'block w-full rounded-r-md border-0 py-1.5 bg-white dark:bg-lightForeground text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500',
                                disabled,
                                placeholder,
                            }}
                        />
                    </div>
                </>
            ) : (
                <>
                    <input
                        {...{
                            type: type || 'text',
                            ...register(name, validation),
                            defaultValue,
                            className:
                                'block w-full rounded-full border-0 py-1.5 text-gray-900 dark:text-white bg-white dark:bg-lightForeground shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500',
                            disabled,
                            placeholder,
                        }}
                    />
                </>
            )}
        </>
    );
};

export { TextInput };
