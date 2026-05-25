import * as localData from './localData';
import apiRequest from './apiRequest';

const signOut = () => {
    localData.set('user', {});
};

const getUser = async (token?: string): Promise<void> => {
    if (token) localData.set('user', { token });
    const userRequest = await apiRequest('GET', '/auth/verify');
    if (userRequest.data) {
        localData.set('user', {
            token: localData.get('user.token'),
            ...userRequest.data.user,
        });
    } else signOut();
};

export { signOut, getUser };
