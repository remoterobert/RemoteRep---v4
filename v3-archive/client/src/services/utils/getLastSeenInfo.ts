export const getLastSeenInfo = (lastSeenTimestamp: number) => {
    const currentTime = Date.now();
    const timeDifference = Math.floor((currentTime - lastSeenTimestamp) / 1000);

    if (timeDifference >= 60 * 60 * 24 * 7 * 4) {
        return 'Last seen over a month ago';
    } else if (timeDifference >= 60 * 60 * 24 * 7) {
        const weeks = Math.floor(timeDifference / (60 * 60 * 24 * 7));
        return `Last seen ${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (timeDifference >= 60 * 60 * 24) {
        const days = Math.floor(timeDifference / (60 * 60 * 24));
        return `Last seen ${days} day${days > 1 ? 's' : ''} ago`;
    } else if (timeDifference >= 60 * 60) {
        const hours = Math.floor(timeDifference / (60 * 60));
        return `Last seen ${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        const minutes = Math.floor(timeDifference / 60);
        return minutes
            ? `Last seen ${minutes} minute${minutes > 1 ? 's' : ''} ago`
            : 'Active now';
    }
};
