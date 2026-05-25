import { BookmarkIcon as SolidBookmarkIcon } from '@heroicons/react/20/solid';
import { MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import { Talent } from 'types';
import CircleProgress from 'components/cirlceProgress';
import _ from 'lodash';
import { getLastSeenInfo } from 'services/utils/getLastSeenInfo';

const TalentListItem = ({
    talent,
    bookmarks,
    preferences,
    hasAccess,
}: {
    talent: Talent;
    bookmarks: string[];
    preferences: any;
    hasAccess: boolean;
}) => {
    return (
        <div className="flex-col justify-center items-center hover:shadow-xl rounded-2xl">
            <div className="px-4 py-4 flex justify-between items-center rounded-2xl">
                <div className="inline-flex text-black dark:text-white">
                    {talent?.talentData?.profile?.photoUrl ? (
                        <img
                            src={talent?.talentData?.profile?.photoUrl}
                            className="hidden md:flex md:h-16 md:w-16 rounded-full"
                        />
                    ) : (
                        <UserIcon className="hidden md:flex md:h-16 md:w-16 rounded-full text-gray-300 bg-gray-100" />
                    )}

                    <div className="ml-4 font-medium flex items-center">
                        <div>
                            <span className="mt- text-md md:text-lg inline-flex">
                                {talent?.contact?.firstName}
                                <span
                                    className={`ml-1 ${hasAccess ? '' : 'blur-sm'}`}
                                >
                                    {talent?.contact?.lastName}
                                </span>

                                
                            </span>
                            <div className="mt-2">
                                <span className="text-sm inline-flex text-black dark:text-midBlue">
                                    <MapPinIcon className="my-auto h-4 w-4" />
                                    <span
                                        className={`ml-1 ${
                                            hasAccess ? '' : 'blur-sm'
                                        }`}
                                    >
                                        {talent?.contact?.addressCity}
                                    </span>
                                    ,
                                    <span
                                        className={`ml-1 ${
                                            hasAccess ? '' : 'blur-sm'
                                        }`}
                                    >
                                        {talent?.contact?.addressState}
                                    </span>
                                    {', '} {talent?.contact?.addressCountry}
                                </span>
                            </div>
                            <div className="text-xs inline-flex text-black dark:text-midBlue">
                                {getLastSeenInfo(
                                    talent?.dateLastOnline || 0
                                ).replace('seen', 'active')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-center items-center">
                    
                    {bookmarks?.includes(talent.id) && (
                                    <div className="h-[32px] w-[32px] bg-background rounded-full mr-2 flex justify-center items-center">
                                        <SolidBookmarkIcon className="my-auto h-6 w-6 text-primary" />
                                    </div>
                                )}
                    
                    {preferences && (
                    <CircleProgress percent={talent?.matchScore || 0} />
                )}
               
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

export default TalentListItem;
