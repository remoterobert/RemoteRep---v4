import { useEffect } from 'react';
import { hotjar } from 'react-hotjar';

export default function HotjarContainer({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        hotjar.initialize(2642640, 6);
    }, []);

    return <>{children}</>;
}
