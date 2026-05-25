import { Listing } from 'types';
import { BookmarkIcon as SolidBookmarkIcon } from '@heroicons/react/24/solid';
import { MapPinIcon } from '@heroicons/react/24/outline';
import CircleProgress from 'components/cirlceProgress';
import { getLastSeenInfo } from 'services/utils/getLastSeenInfo';

const ListingListItem = ({
    listing,
    bookmarks,
}: {
    listing: Listing;
    bookmarks: string[];
}) => {
    return (
        <div className="flex-col justify-center items-center hover:shadow-xl rounded-2xl">
            <div className="px-4 py-4 flex justify-between items-center rounded-2xl">
                <div className="inline-flex">
                    <img
                        src={listing.client?.clientData?.profile?.photoUrl}
                        className="h-12 w-12 rounded-full shrink-0"
                    />

                    <div className="ml-4 font-medium text-black dark:text-white flex items-center">
                        <div>
                            <div>
                                <span className="text-[16px] inline-flex font-bold">
                                    {listing.title}
                                </span>
                            </div>
                            {/* <div className="mt-2">
                                <span className="text-lg">
                                    {listing.client?.contact?.companyName || null}
                                </span>
                            </div> */}
                            <div className="mt-2">
                                <span className="text-sm inline-flex">
                                    <MapPinIcon className="my-auto h-4 w-4" />
                                    {[
                                        listing?.client?.contact?.addressCity,
                                        listing?.client?.contact?.addressState,
                                        listing?.client?.contact?.addressCountry,
                                    ].join(', ')}
                                </span>
                            </div>
                            <div className="text-xs inline-flex">
                                {getLastSeenInfo(
                                    listing?.client?.dateLastOnline || 0
                                )
                                    .replace('seen', 'active')
                                    .replace('L', 'Client l')}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center items-center">
                    {bookmarks.includes(listing.id) && (
                        <div className="h-[32px] w-[32px] bg-background dark:bg-lightForeground rounded-full mr-2 flex justify-center items-center">
                            <SolidBookmarkIcon className="my-auto h-6 w-6 text-primary shrink-0" />
                        </div>
                    )}
                    <CircleProgress percent={listing?.matchScore || 0} />
                </div>
            </div>
            <div className="flex justify-between items-center pl-4 pr-4 pb-4 text-black dark:text-white">
                <p className="bg-background dark:bg-lightForeground p-2 rounded-lg font-semibold text-xs">2 Yrs</p>
                <p className="bg-background dark:bg-lightForeground p-2 rounded-lg font-semibold text-xs">B2B</p>
                <p className="bg-background dark:bg-lightForeground p-2 rounded-lg font-semibold text-xs">+$250k/yr</p>
                <p className="bg-background dark:bg-lightForeground p-2 rounded-lg font-semibold text-xs">Fulltime</p>
            </div>
        </div>
    );
};

export default ListingListItem;
