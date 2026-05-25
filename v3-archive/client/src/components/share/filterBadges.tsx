import { XMarkIcon } from '@heroicons/react/24/solid';
import * as formFields from '../../services/formFields';
import countries from 'services/countries';

const FilterBadges = ({
    filters,
    removeFilter,
    formName,
}: {
    filters: Record<string, any>;
    removeFilter: (key: string) => void;
    formName: keyof typeof formFields.forms;
}) => {
    return (
        <>
            {Object.entries(filters).map(([k, v]) => {
                if (v)
                    return (
                        <div
                            onClick={() => removeFilter(k)}
                            className="relative group text-xs border-2 rounded-full shadow-sm py-1 px-2 bg-white inline-flex hover:bg-red-50 hover:border-red-400"
                        >
                            <span className="ml-1 text-gray-700 whitespace-nowrap">{`${
                                (formFields.get(formName) as any[]).find(
                                    (f: any) => f.name === k
                                )?.label
                            }:`}</span>
                            <span className="ml-1 text-gray-700">
                                {(() => {
                                    const val =
                                        k === 'country'
                                            ? v
                                                  .split(', ')
                                                  .map(
                                                      (vv: string) =>
                                                          countries.find(
                                                              ({ code }) =>
                                                                  code === vv
                                                          )?.name
                                                  )
                                                  .join(', ')
                                            : Array.isArray(v as any)
                                            ? (v as any).join(', ')
                                            : v;

                                    return val.length > 20
                                        ? val.slice(0, 17) + '...'
                                        : val;
                                })()}
                            </span>
                            <XMarkIcon className="my-auto h-4 w-4 text-gray-400 group-hover:text-red-400" />
                        </div>
                    );
            })}
        </>
    );
};

export default FilterBadges;
