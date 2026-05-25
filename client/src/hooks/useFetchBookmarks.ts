import { useEffect, useState } from 'react';
import * as localData from 'services/localData';

const useFetchBookmarks = (update: number, mode: 'talent' | 'client') => {
    const [bookmarks, setBookmarks] = useState<string[]>([]);

    useEffect(() => {
        if (
            mode === 'client' &&
            localData.get('user.clientData.bookmarkedTalent')
        )
            setBookmarks(
                localData.get('user.clientData.bookmarkedTalent') || []
            );
        if (
            mode === 'talent' &&
            localData.get('user.talentData.bookmarkedListings')
        )
            setBookmarks(
                localData.get('user.talentData.bookmarkedListings') || []
            );
    }, [update, mode]);

    return { bookmarks, setBookmarks };
};

export default useFetchBookmarks;
