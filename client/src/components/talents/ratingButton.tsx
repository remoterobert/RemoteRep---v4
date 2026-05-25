import { useEffect, useState } from 'react';

const RatingButton: React.FC<{
    IconComp: React.ForwardRefExoticComponent<
        Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
            title?: string | undefined;
            titleId?: string | undefined;
        } & React.RefAttributes<SVGSVGElement>
    >;
    AltIconComp: React.ForwardRefExoticComponent<
        Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
            title?: string | undefined;
            titleId?: string | undefined;
        } & React.RefAttributes<SVGSVGElement>
    >;
    showAlt: boolean;
}> = ({ IconComp, AltIconComp, showAlt }) => {
    const [Icon, setIcon] = useState<typeof IconComp>();

    const [AltIcon, setAltIcon] = useState<
        React.ForwardRefExoticComponent<
            Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
                title?: string | undefined;
                titleId?: string | undefined;
            } & React.RefAttributes<SVGSVGElement>
        >
    >();

    useEffect(() => {
        setIcon(!showAlt ? IconComp : AltIconComp);
        setAltIcon(!showAlt ? AltIconComp : IconComp);
    }, [showAlt]);

    return Icon && AltIcon ? (
        <>
            <Icon className="absolute group-hover:hidden mx-auto my-auto h-6 w-6 text-primary" />
            <AltIcon className="absolute hidden group-hover:block mx-auto my-auto h-6 w-6 text-primary" />
        </>
    ) : null;
};

export default RatingButton;
