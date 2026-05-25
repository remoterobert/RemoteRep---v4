import { PencilSquareIcon } from '@heroicons/react/20/solid';

export const EditWrapper: React.FC<{
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
    escapeMargins?: boolean;
}> = ({ active, children, onClick, escapeMargins }) => {
    return active ? (
        <div
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`${
                escapeMargins ? '' : '-mt-4 -ml-4 '
            } group border-dashed border-2 border-primary/50 hover:border-primary rounded-md p-1`}
        >
            <PencilSquareIcon className="float-right h-4 w-4 text-primary/50 group-hover:text-primary" />
            <div className="p-3">{children}</div>
        </div>
    ) : (
        <>{children}</>
    );
};
