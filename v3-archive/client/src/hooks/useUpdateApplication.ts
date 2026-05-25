import apiRequest from 'services/apiRequest';

const useUpdateApplication = () => {
    const updateApplication = async (
        listingId: string,
        updates: any,
        callback?: Function
    ) => {
        const updateResponse = await apiRequest(
            'PATCH',
            `/client/listings/${listingId}/applications`,
            updates
        );
        if (callback) {
            callback(updateResponse);
        }
    };

    return { updateApplication };
};

export default useUpdateApplication;
