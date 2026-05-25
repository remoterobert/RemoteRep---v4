export const RoundButton: React.FC<{
    name: string;
    icon: React.ForwardRefExoticComponent<
        Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
            title?: string | undefined;
            titleId?: string | undefined;
        } & React.RefAttributes<SVGSVGElement>
    >;
    onClick: () => void;
    className?: string;
}> = (props) => {
    return (
        <div className="group" onClick={props.onClick}>
            <div className="flex items-center justify-center">
                <div className="rounded-full border-2 border-solid border-gray-200 p-2 shadow-sm hover:shadow-md">
                    <props.icon
                        className={`${
                            props.className || ''
                        } mx-auto my-auto h-6 w-6 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-white`}
                        aria-hidden="true"
                    />
                </div>
            </div>
            <span className="text-sm text-gray-500 group-hover:text-gray-700 dark:group-hover:text-white">
                {props.name}
            </span>
        </div>
    );
};
