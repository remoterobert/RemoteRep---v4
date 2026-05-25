// import { Fragment } from 'react';
// import { Popover, Transition } from '@headlessui/react';
// import { ChevronDownIcon } from '@heroicons/react/20/solid';

// const FilterContainer = ({
//     children,
//     snippets,
// }: {
//     children?: React.ReactNode;
//     snippets?: React.ReactNode;
// }) => {
//     return (
//         <Popover className="relative isolate z-50 shadow">
//             <div className="bg-white py-5">
//                 <div className="mx-auto px-6 lg:px-8">
//                     <Popover.Button className="inline-flex rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
//                         Filter
//                         <ChevronDownIcon
//                             className="h-5 w-5"
//                             aria-hidden="true"
//                         />
//                     </Popover.Button>
//                     <div className="hidden md:block">{snippets}</div>
//                 </div>
//             </div>

//             <Transition
//                 as={Fragment}
//                 enter="transition ease-out duration-200"
//                 enterFrom="opacity-0 -translate-y-1"
//                 enterTo="opacity-100 translate-y-0"
//                 leave="transition ease-in duration-150"
//                 leaveFrom="opacity-100 translate-y-0"
//                 leaveTo="opacity-0 -translate-y-1"
//             >
//                 <Popover.Panel className="absolute inset-x-0 top-0 -z-10 px-4 lg:px-8 xl:gap-8 bg-white pt-16 pb-12 shadow-lg ring-1 ring-gray-900/5">
//                     {children}
//                 </Popover.Panel>
//             </Transition>
//         </Popover>
//     );
// };

// export default FilterContainer;

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

export default function FilterContainer({
    children,
    customTitle,
    doubled = false,
}: {
    customTitle?: string;
    children?: React.ReactNode;
    doubled?: boolean;
}) {
    return (
        <nav
            className={
                !doubled ? 'py-4 px-8 sticky top-16 md:top-0 bg-white dark:bg-darkBackground' : ''
            }
        >
            <Menu
                as="div"
                className={`${
                    !doubled ? 'relative' : null
                } inline-block text-left w-[108px] md:w-[150px]`}
            >
                <div>
                    <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white dark:bg-darkBackground px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white dark:bg-darkForeground shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        {customTitle || 'Filters'}
                        <ChevronDownIcon
                            className="-mr-1 h-5 w-5 text-gray-400"
                            aria-hidden="true"
                        />
                    </Menu.Button>
                </div>

                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute z-10 mt-2 w-80 origin-top-right rounded-md bg-white dark:bg-darkBackground shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-4 px-4 min-h-[300px] max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-thin">
                            {children}
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>
        </nav>
    );
}
