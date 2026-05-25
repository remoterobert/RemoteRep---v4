import { useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';
import { Listing } from 'types';

const useFetchListings = (mode: 'talent' | 'client' = 'talent') => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [error, setError] = useState<any>();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const listingsReq = await apiRequest('GET', `/${mode}/listings`);
            if (listingsReq.error) {
                setError(listingsReq.error);
            }
            if (listingsReq.data) {
                setListings(listingsReq.data.listings || []);
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    return { listings, error, loading };
};

export default useFetchListings;
