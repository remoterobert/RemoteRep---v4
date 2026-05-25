import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import React, { Fragment } from 'react';
import { useFormContext } from 'react-hook-form';

const MultiselectInput: React.FC<{
    name: string;
    defaultValue?: string[];
    options: { display: string; value: string }[];
    disabled?: boolean;
    validation?: { [key: string]: any };
    placeholder?: string[];
}> = ({ name, defaultValue, options, disabled, validation, placeholder }) => {
    const { register, setValue } = useFormContext();

    const [selectedOptions, setSelectedOptions] = React.useState<any>(
        options.some((o) => (placeholder || defaultValue)?.includes(o.value))
            ? [
                  ...options.filter((o) =>
                      (placeholder || defaultValue)?.includes(o.value)
                  ),
              ]
            : []
    );

    React.useEffect(() => {
        if (selectedOptions.length)
            setValue(name, selectedOptions.map((o: any) => o.value).join(', '));
    }, [selectedOptions]);

    return (
        <>
            <input
                {...{
                    type: 'text',
                    ...register(name, validation),
                    defaultValue,
                    className: 'hidden',
                }}
            />

            {disabled ? (
                <input
                    {...{
                        type: 'text',
                        defaultValue: (placeholder || defaultValue)
                            ?.map(
                                (o: any) =>
                                    options.find(
                                        (oo: any) => oo.value === o.value
                                    )?.display
                            )
                            .join(', '),
                        className:
                            'block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500',
                        disabled: true,
                    }}
                />
            ) : (
                <Listbox
                    value={selectedOptions}
                    onChange={setSelectedOptions}
                    multiple={true}
                >
                    <div className="relative">
                        <Listbox.Button className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-lightForeground text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                            <span className="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                {selectedOptions.length
                                    ? selectedOptions
                                          .map((o: any) => o.display)
                                          .join(', ')
                                    : `Select one or more from ${options.length} options...`}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon
                                    className="h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                />
                            </span>
                        </Listbox.Button>
                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Listbox.Options className="z-10 absolute mt-1 max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-lightForeground py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {options.map((option, i) => (
                                    <Listbox.Option
                                        key={option.value}
                                        value={option}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                active
                                                    ? 'bg-primaryBlue text-white'
                                                    : 'text-gray-900 dark:text-white'
                                            }`
                                        }
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span
                                                    className={`block truncate ${
                                                        selected
                                                            ? 'font-medium'
                                                            : 'font-normal'
                                                    }`}
                                                >
                                                    {option.display}
                                                </span>
                                                {selected ? (
                                                    <span
                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                            active
                                                                ? 'text-white'
                                                                : 'text-primary'
                                                        }`}
                                                    >
                                                        <CheckIcon
                                                            className="h-5 w-5"
                                                            aria-hidden="true"
                                                        />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Listbox.Option>
                                ))}
                            </Listbox.Options>
                        </Transition>
                    </div>
                </Listbox>
            )}
        </>
    );
};

export { MultiselectInput };
