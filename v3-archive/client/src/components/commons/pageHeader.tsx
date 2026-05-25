export const PageHeader: React.FC<{
    title: string;
    icon: React.ForwardRefExoticComponent<
        Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
            title?: string | undefined;
            titleId?: string | undefined;
        } & React.RefAttributes<SVGSVGElement>
    >;
}> = (props) => {
    return (
        <div className="mb-6 flex">
            <props.icon
                className="h-8 w-8 text-gray-900 dark:text-white sm:h-10 sm:w-10"
                aria-hidden="true"
            />
            <h1 className="ml-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {props.title}
            </h1>
        </div>
    );
};
