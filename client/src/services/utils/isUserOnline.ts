const ONLINE_MINUTES = 5;

export const isUserOnline = (time: number) => {
    return Math.floor((Date.now() - time) / 1000 / 60) <= ONLINE_MINUTES;
};
