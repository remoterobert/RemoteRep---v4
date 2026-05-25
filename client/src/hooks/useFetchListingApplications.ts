import { useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';
import { TalentApplication } from 'types';

const useFetchListingApplications = (
    listingId: string | undefined,
    update: number
) => {
    const [applications, setApplications] = useState<TalentApplication[]>([]);
    const [error, setError] = useState<any>();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const res = await apiRequest(
                'GET',
                `/client/listings/${listingId}/applications`
            );
            if (res.error) {
                setError(res.error);
            }
            if (res.data) {
                setApplications(res.data?.applications || []);
            }
            setLoading(false);
        };

        if (listingId) {
            fetchData();
        }
    }, [listingId, update]);

    return { applications, error, loading };
};

export default useFetchListingApplications;
