import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';

const RatingIcon: React.FC<{ applicationRating: number }> = ({
    applicationRating,
}) => {
    const [Icon, setIcon] = useState<
        React.ForwardRefExoticComponent<
            Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
                title?: string | undefined;
                titleId?: string | undefined;
            } & React.RefAttributes<SVGSVGElement>
        >
    >();

    useEffect(() => {
        if (applicationRating !== 0)
            setIcon(
                applicationRating === 1 ? HandThumbUpIcon : HandThumbDownIcon
            );
    }, [applicationRating]);

    return Icon ? (
        <Icon className="mx-auto my-auto h-6 w-6 text-primary" />
    ) : null;
};

export default RatingIcon;
