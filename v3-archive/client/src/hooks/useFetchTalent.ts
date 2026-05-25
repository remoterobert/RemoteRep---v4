import { useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';
import { Talent } from 'types';

const useFetchTalent = () => {
    const [talent, setTalent] = useState<Talent[]>([]);
    const [error, setError] = useState<any>();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const talentReq = await apiRequest('GET', `/client/talent`);
            if (talentReq.error) {
                setError(talentReq.error);
            }
            if (talentReq.data) {
                setTalent(talentReq.data?.talent || []);
            }
            setLoading(false);
        })();
    }, []);

    return { talent, error, loading };
};

export default useFetchTalent;
