import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Dispatch, SetStateAction } from 'react';

const TablePagination: React.FC<{
    items: any[];
    displayItems: any[];
    page: number;
    setPage: Dispatch<SetStateAction<number>>;
    pageLength: number;
}> = ({ items, displayItems, page, setPage, pageLength }) => {
    return (
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 rounded-b-2xl bg-white dark:bg-sideMenu">
            <div className="flex flex-1 justify-between sm:hidden">
                <a
                    href="#"
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-100"
                >
                    Previous
                </a>
                <a
                    href="#"
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-100"
                >
                    Next
                </a>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700 dark:text-white">
                        Showing{' '}
                        <span className="font-medium">
                            {(page - 1) * pageLength + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                            {(page - 1) * pageLength + displayItems.length}
                        </span>{' '}
                        of <span className="font-medium">{items.length}</span>{' '}
                        results
                    </p>
                </div>
                <div>
                    <nav
                        className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                        aria-label="Pagination"
                    >
                        <a
                            onClick={() => {
                                if (page - 1 > 0) setPage(page - 1);
                            }}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-100 focus:z-20 focus:outline-offset-0"
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeftIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        </a>
                        {/* Current: "z-10 bg-primary text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", Default: "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-100 focus:outline-offset-0" */}

                        {Array.from({
                            length: Math.ceil(items.length / pageLength),
                        }).map((_, i) => {
                            return i + 1 - page < 3 && page - i - 1 < 3 ? (
                                <a
                                    onClick={() => setPage(i + 1)}
                                    aria-current={
                                        page === i + 1 ? 'page' : undefined
                                    }
                                    className={
                                        page === i + 1
                                            ? 'relative z-10 inline-flex items-center bg-primaryBlue px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                                            : 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 hover:bg-gray-100 focus:z-20 focus:outline-offset-0'
                                    }
                                >
                                    {i + 1}
                                </a>
                            ) : null;
                        })}

                        <a
                            onClick={() => {
                                if (
                                    page + 1 <=
                                    Math.ceil(items.length / pageLength)
                                )
                                    setPage(page + 1);
                            }}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-100 focus:z-20 focus:outline-offset-0"
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRightIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        </a>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default TablePagination;
