import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import React from 'react';
import { useFormContext } from 'react-hook-form';

const ComboboxInput: React.FC<{
    name: string;
    defaultValue?: any;
    options: { display: string; value: string }[];
    disabled?: boolean;
    validation?: { [key: string]: any };
    placeholder?: string;
}> = ({ name, defaultValue, options, disabled, validation, placeholder }) => {
    const { register, setValue } = useFormContext();

    const [selectedOption, setSelectedOption] = React.useState<any>(
        options.find((o) => (placeholder || defaultValue) === o.value)
    );
    const [selectQuery, setSelectQuery] = React.useState('');

    const filteredOptions = !selectQuery
        ? options
        : options.filter((o) =>
              o.display
                  .toLowerCase()
                  .replace(/\s+/g, '')
                  .includes(selectQuery.toLowerCase().replace(/\s+/g, ''))
          );

    React.useEffect(() => {
        if (selectedOption?.value) setValue(name, selectedOption.value);
    }, [selectedOption]);

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
                        defaultValue: options.find(
                            (o) => (placeholder || defaultValue) === o.value
                        )?.display,
                        className:
                            'block w-full rounded-md border-0 py-1.5 bg-white dark:bg-lightForeground text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500',
                        disabled: true,
                    }}
                />
            ) : (
                <Combobox value={selectedOption} onChange={setSelectedOption}>
                    <div className="relative">
                        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-lightForeground text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                            <Combobox.Input
                                className="block w-full rounded-md border-0 py-1.5 bg-white dark:bg-lightForeground text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                displayValue={(o: any) => o.display}
                                onChange={(event) =>
                                    setSelectQuery(event.target.value)
                                }
                                autoComplete="off"
                            />
                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon
                                    className="h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                />
                            </Combobox.Button>
                        </div>
                        <Transition
                            as={React.Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                            afterLeave={() => setSelectQuery('')}
                        >
                            <Combobox.Options className="z-10 absolute mt-1 max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-darkBackground py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {!filteredOptions.length &&
                                selectQuery !== '' ? (
                                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-white">
                                        Nothing found.
                                    </div>
                                ) : (
                                    filteredOptions.map((o) => (
                                        <Combobox.Option
                                            key={o.value}
                                            className={({ active }) =>
                                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                    active
                                                        ? 'bg-primaryBlue text-white'
                                                        : 'text-gray-900 dark:text-white'
                                                }`
                                            }
                                            value={o}
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
                                                        {o.display}
                                                    </span>
                                                    {selected ? (
                                                        <span
                                                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                active
                                                                    ? 'text-white'
                                                                    : 'text-primaryBlue'
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
                                        </Combobox.Option>
                                    ))
                                )}
                            </Combobox.Options>
                        </Transition>
                    </div>
                </Combobox>
            )}
        </>
    );
};

export { ComboboxInput };
