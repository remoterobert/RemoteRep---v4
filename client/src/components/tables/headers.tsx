const TableHeaders: React.FC<{
    headers: string[];
    headerClassNames?: (string | null)[];
}> = ({ headers, headerClassNames }) => {
    return (
        <thead className="bg-white dark:bg-darkForeground">
            <tr>
                {headers.map((h, i) => (
                    <th
                        key={i}
                        scope="col"
                        className={`${
                            (headerClassNames && headerClassNames[i]) || ''
                        } py-3.5 text-center text-sm font-semibold text-gray-900 dark:text-midBlue`}
                    >
                        {h}
                    </th>
                ))}
            </tr>
        </thead>
    );
};

export default TableHeaders;
