const BrowseSkillCard: React.FC<{
    k: string;
    v: string | string[];
    match?: boolean;
}> = ({ k, v, match }) => {
    return (
        <div
            className={`text-xs rounded-full shadow-sm p-2 bg-background dark:bg-lightForeground inline-flex`}
        >
            <span
                className={`font-medium ${
                    match ? 'text-green-700' : 'text-subscribed'
                }`}
            >{`${k}:`}</span>
            <span
                className={`ml-1 font-bold ${match ? 'text-green-700' : 'text-subscribed'}`}
            >
                {Array.isArray(v) ? v.join(', ') : v}
            </span>
        </div>
    );
};

export default BrowseSkillCard;
