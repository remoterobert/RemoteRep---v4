import { useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';
import { TalentApplication } from 'types';

const useFetchTalentApplications = (update: number) => {
    const [applications, setApplications] = useState<TalentApplication[]>([]);
    const [error, setError] = useState<any>();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            const res = await apiRequest('GET', '/talent/applications');
            if (res.error) {
                setError(res.error);
            }
            if (res.data) {
                setApplications(res.data?.applications || []);
            }
            setLoading(false);
        };

        fetchData();
    }, [update]);

    return { applications, error, loading };
};

export default useFetchTalentApplications;
