import TableHeaders from './headers';
import TableRows from './rows';
import TablePagination from './pagination';
import { useEffect, useState } from 'react';

const Table: React.FC<{
    items: any[];
    tableData: {
        headers: string[];
        headerClassNames?: (string | null)[];
        dataComponents: React.FC<{ item: any }>[];
        // dataBindings: string[];
        pageLength: number;
    };
}> = ({ items, tableData /* dataBindings */ }) => {
    const [page, setPage] = useState(1);
    const [displayItems, setDisplayItems] = useState<any[]>([]);

    useEffect(() => {
        setDisplayItems(
            items.slice(
                (page - 1) * tableData.pageLength,
                page * tableData.pageLength
            )
        );
    }, [items, page]);

    return (
        <>
            <div className="inline-block max-w-full py-2 align-middle sm:px-6 lg:px-8 h-[100vh]">
                <div className="shadow ring-1 max-w-full ring-black ring-opacity-5 sm:rounded-2xl">
                    <table className="max-w-full h-full">
                        <TableHeaders
                            headers={tableData.headers}
                            headerClassNames={tableData.headerClassNames}
                        />
                        <TableRows
                            items={displayItems}
                            dataComponents={tableData.dataComponents}
                        />
                    </table>
                    <TablePagination
                        {...{
                            items,
                            displayItems,
                            page,
                            setPage,
                            pageLength: tableData.pageLength,
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default Table;
