import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

const ComboboxInputWithAddNewItem: React.FC<{
    name: string;
    defaultValue?: any;
    options: { display: string; value: string }[];
    selectedOptions: { display: string; value: string }[];
    disabled?: boolean;
    validation?: { [key: string]: any };
    placeholder?: string;
    newItemAddFunc?: (agr1: string) => void;
}> = ({
    name,
    defaultValue,
    options,
    disabled,
    validation,
    placeholder,
    newItemAddFunc,
    selectedOptions,
}) => {
    const { register, setValue } = useFormContext();

    const [selected, setSelected] =
        useState<{ display: string; value: string }[]>(selectedOptions);
    const [selectQuery, setSelectQuery] = useState('');

    const handleChange = (option: { display: string; value: string }[]) => {
        setSelected(option);
    };

    const filteredOptions = !selectQuery
        ? options
        : options.filter((o) =>
              o.display
                  .toLowerCase()
                  .replace(/\s+/g, '')
                  .includes(selectQuery.toLowerCase().replace(/\s+/g, ''))
          );

    React.useEffect(() => {
        setValue(name, selected);
    }, [selected]);

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
                        defaultValue: selected
                            .map(({ display }) => display)
                            .join(', '),
                        className:
                            'block w-full rounded-md border-0 py-1.5 bg-white dark:bg-lightForeground text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500',
                        disabled: true,
                    }}
                />
            ) : (
                <Combobox
                    multiple
                    value={selected}
                    onChange={(value) => handleChange(value)}
                >
                    <div className="relative">
                        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-lightForeground text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                            <Combobox.Input
                                className="block w-full rounded-md border-0 py-1.5 bg-white dark:bg-lightForeground text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                displayValue={(value: any) =>
                                    Array.isArray(value)
                                        ? value
                                              .map(({ value }) => value)
                                              .join(', ')
                                        : value.display
                                }
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
                            <Combobox.Options className="z-10 absolute mt-1 max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-lightForeground py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {!filteredOptions.length &&
                                selectQuery !== '' ? (
                                    <button
                                        className="w-full text-left relative cursor-default select-none py-2 px-4 text-gray-700 cursor-pointer"
                                        onClick={() =>
                                            newItemAddFunc &&
                                            newItemAddFunc(selectQuery)
                                        }
                                    >
                                        Add new tag
                                    </button>
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
                                            {({ active, selected }) => {
                                                // const isSelected =
                                                //     selected.find(
                                                //         ({ value }) =>
                                                //             o.value === value
                                                //     );
                                                return (
                                                    <>
                                                        <span
                                                            className={`block truncate ${
                                                                selected
                                                                    ? 'font-medium'
                                                                    : 'font-normal'
                                                            }`}
                                                        >
                                                            {o.value}
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
                                                );
                                            }}
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

export { ComboboxInputWithAddNewItem };
