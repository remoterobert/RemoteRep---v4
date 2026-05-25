const TableRows: React.FC<{
    items: any[];
    dataComponents: React.FC<{ item: any }>[];
}> = ({ items, dataComponents }) => {
    return (
        <tbody className="">
            {items.map((item, i) => (
                <tr key={i}>
                    {dataComponents.map((DataComponent, ii) => (
                        <td
                            key={ii}
                            className={`whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-white ${i % 2 === 0 ? "bg-background dark:bg-lightForeground" : "bg-white dark:bg-sideMenu"}`}
                        >
                            <DataComponent {...{ item }} />
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    );
};

export default TableRows;
