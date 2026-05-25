const DashboardGrid: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    return <div className="px-16 grid md:grid-cols-6 gap-24">{children}</div>;
};

export default DashboardGrid;
