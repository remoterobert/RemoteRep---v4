import { MapPinIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as SolidBookmarkIcon } from '@heroicons/react/24/solid';
import CircleProgress from 'components/cirlceProgress';
import { getLastSeenInfo } from 'services/utils/getLastSeenInfo';
import { Client } from 'types';

const ClientListItem = ({
    client,
    bookmarks,
}: {
    client: Client;
    bookmarks: string[];
}) => {
    return (
        <div className="flex-col justify-center items-center hover:shadow-xl rounded-2xl">
            <div className="px-4 py-4 flex items-center justify-between rounded-2xl">
                <div className="inline-flex">
                    <img
                        src={client.clientData.profile.photoUrl}
                        className="h-16 w-16 rounded-full shrink-0"
                    />

                    <div className="ml-4 font-medium text-black dark:text-white flex items-center">
                        <div>
                            <span className="text-[16px] inline-flex font-bold">
                                {client.contact.companyName}
                            </span>
                            <div className="text-sm font-normal text-lightGrey dark:text-midBlue">
                                    <p>{getLastSeenInfo(
                                    client?.dateLastOnline || 0
                                ).replace('seen', 'active')}</p>
                            </div>
                                
                        </div>
                    </div>
                </div>
                <div className="flex justify-center items-center">
                            {bookmarks.includes(client.id) && (
                                <div className="h-[32px] w-[32px] bg-background dark:bg-lightForeground rounded-full mr-2 flex justify-center items-center">
                                <SolidBookmarkIcon className="my-auto h-6 w-6 text-primary" />
                                </div>
                            )}
                    <CircleProgress percent={client?.matchScore || 0} />
                </div>
            </div>
            <div className="flex justify-between items-center pl-4 pr-4 pb-4 text-black dark:text-white">
                <span className="text-sm inline-flex">
                    <MapPinIcon className="my-auto h-4 w-4 mr-1" />
                        {[
                            client.contact.addressCity,
                            client.contact.addressState,
                            client.contact.addressCountry,
                        ].join(', ')}
                </span>
            </div>
        </div>
    );
};

export default ClientListItem;
