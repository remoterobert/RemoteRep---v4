import type { NextPage } from 'next';
import {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import * as localData from 'services/localData';
import apiRequest from 'services/apiRequest';
import {
    ClockIcon,
    LinkIcon,
    PencilSquareIcon,
    PlusIcon,
    UserCircleIcon,
    PencilIcon,
    ExclamationTriangleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import { RoundButton } from 'components/commons/roundButton';
import { useRouter } from 'next/router';
import {
    CheckIcon,
    ChevronUpDownIcon,
    MapPinIcon,
} from '@heroicons/react/20/solid';
import { Listbox, Transition } from '@headlessui/react';
import { ApplicationStatus, Listing, Talent, TalentApplication } from 'types';
import useFetchListings from 'hooks/useFetchListings';
import useFetchBookmarks from 'hooks/useFetchBookmarks';
import useFetchTalent from 'hooks/useFetchTalent';
import useFetchListingApplications from 'hooks/useFetchListingApplications';
import useUpdateApplication from 'hooks/useUpdateApplication';
import { APPLICATION_STATUS } from 'services/constants';
import { capitalizeFirstLetter } from 'services/utils/strings';
import { useNotification } from 'contexts/NotificationContext';
import { getMatchScore } from 'services/utils/getMatchScore';
import _ from 'lodash';
import { FreePlanBanner } from 'components/commons/freePlanBanner';

const ClientIndex: NextPage = () => {
    const [showManage, setShowManage] = useState<boolean>(false);
    const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>();
    const [selectedListing, setSelectedListing] = useState<Listing>();
    const [update, setUpdate] = useState(0);
    const [user, setUser] = useState<any>();
    const [clientAccess, setClientAccess] = useState(false);
    const [hasAccess, setHasAccess] = useState(true);
    const [profileExpanded,setProfileExpanded] = useState(false);
    const [activityExpanded,setActivityExpanded] = useState(false);

    const router = useRouter();

    const { addNotification } = useNotification();

    const onClickProfileExpande = () => {
        setProfileExpanded(!profileExpanded);
    }

    const onClickActivityExpande = () => {
        setActivityExpanded(!activityExpanded);
    }

    const {
        listings: unfilteredListings,
        loading: listingLoading,
        error: listingError,
    } = useFetchListings('client');

    const listings = useMemo(
        () => unfilteredListings,
        // .filter(
        //     (l) =>
        //         clientAccess || !l?.hasOwnProperty('paidFor') || l?.paidFor
        // )
        [unfilteredListings, clientAccess]
    );

    const {
        talent,
        loading: talentLoading,
        error: talentError,
    } = useFetchTalent();

    const talentsWithMatchScore = useMemo(() => {
        const talentsWithMatchScore = talent
            .map((talent) => {
                const matchScore =
                    talent?.deleted || talent?.suspended
                        ? 0
                        : getMatchScore({
                              client: {
                                  details: {
                                      ...selectedListing?.details,
                                      ...user.clientData.profile,
                                  },
                                  requirements: selectedListing?.requirements,
                              },
                              talent: talent.talentData,
                          });

                return {
                    ...talent,
                    matchScore,
                };
            })
            .sort(
                (prev, next) =>
                    (next?.matchScore || 0) - (prev?.matchScore || 0)
            );

        return talentsWithMatchScore;
    }, [selectedListing?.id, talent]);

    const {
        applications,
        loading: appLoading,
        error: appError,
    } = useFetchListingApplications(selectedListing?.id, update);
    const { bookmarks, setBookmarks } = useFetchBookmarks(update, 'client');

    const applicationsWithMatchScore = useMemo(() => {
        if (applications.length > 0) {
            return applications.map((application) => {
                let matchScore = 0;

                try {
                    matchScore =
                        application.talent?.deleted ||
                        application.talent?.suspended
                            ? 0
                            : getMatchScore({
                                  client: {
                                      requirements:
                                          selectedListing?.requirements,
                                      details: {
                                          ...selectedListing?.details,
                                          ...user.clientData.profile,
                                      },
                                  },
                                  talent: application?.talent?.talentData, // TODO: WHAT THE PROBLEM HERE?
                              });
                } catch {
                    console.error(
                        `Error calculating match score for application\n${JSON.stringify(
                            application
                        )}`
                    );
                }

                return {
                    ...application,
                    matchScore,
                };
            });
        } else {
            return [];
        }
    }, [applications, selectedListing?.id]);

    const loading = listingLoading || talentLoading || appLoading;

    const filteredApplications = useCallback(
        (status: ApplicationStatus | undefined) => {
            if (status) {
                if (status !== 'bookmarked') {
                    return applicationsWithMatchScore
                        .map((t) => {
                            return hasAccess
                                ? t
                                : {
                                      ...t,
                                      talent: {
                                          ...t.talent,
                                          contact: {
                                              ...t.talent.contact,
                                              lastName: _.capitalize(
                                                  Math.random()
                                                      .toString(36)
                                                      .slice(
                                                          Math.floor(
                                                              Math.random() * 6
                                                          ) + 4
                                                      )
                                              ),
                                              addressState: Math.random()
                                                  .toString(36)
                                                  .slice(10)
                                                  .toUpperCase(),
                                              addressZip: '',
                                              addressCity: _.capitalize(
                                                  Math.random()
                                                      .toString(36)
                                                      .slice(
                                                          Math.floor(
                                                              Math.random() * 6
                                                          ) + 4
                                                      )
                                              ),
                                          },
                                      },
                                  };
                        })
                        .filter(
                            ({ applicationStatus }) =>
                                applicationStatus === status
                        )
                        .sort(
                            (prev, next) =>
                                (next?.matchScore || 0) -
                                (prev?.matchScore || 0)
                        );
                }

                return talentsWithMatchScore
                    .map((t) => {
                        return hasAccess
                            ? t
                            : {
                                  ...t,
                                  contact: {
                                      ...t.contact,
                                      lastName: _.capitalize(
                                          Math.random()
                                              .toString(36)
                                              .slice(
                                                  Math.floor(
                                                      Math.random() * 6
                                                  ) + 4
                                              )
                                      ),
                                      addressState: Math.random()
                                          .toString(36)
                                          .slice(10)
                                          .toUpperCase(),
                                      addressZip: '',
                                      addressCity: _.capitalize(
                                          Math.random()
                                              .toString(36)
                                              .slice(
                                                  Math.floor(
                                                      Math.random() * 6
                                                  ) + 4
                                              )
                                      ),
                                  },
                              };
                    })
                    .filter(
                        (t) =>
                            bookmarks.includes(t.id) &&
                            !applications.some((a) => a.talent?.id === t.id)
                    )
                    .sort(
                        (prev, next) =>
                            (next?.matchScore || 0) - (prev?.matchScore || 0)
                    );
            }
            return [];
        },
        [
            applicationsWithMatchScore,
            bookmarks,
            talentsWithMatchScore,
            hasAccess,
        ]
    );

    const handleStatusTabClick = (status: ApplicationStatus) => {
        if (selectedStatus === status) {
            setSelectedStatus(undefined);
            setShowManage(false);
        } else {
            setSelectedStatus(status);
            if (!showManage) setShowManage(true);
        }
    };

    useEffect(() => {
        if (!router.isReady) return;

        if (listings && !selectedListing) {
            {
                setSelectedListing(
                    listings.find((l) => l.id === router?.query?.listingId) ||
                        listings[0]
                );
            }
        }
    }, [listings, router.isReady, router.query]);

    useEffect(() => {
        const user = localData.get('user');
        setUser(user);

        apiRequest('GET', '/client/access').then((res) => {
            setHasAccess(res.data?.access);
            setClientAccess(
                res?.data?.type && ['all', 'privileged'].includes(res.data.type)
            );
        });
    }, []);

    return (
        <>
            {loading && (
                <div className="flex justify-center h-[100vh] dark:bg-darkBackground pt-8">
                    <ClockIcon className="h-8 w-8 text-gray-900 dark:text-white" />
                </div>
            )}

            {!loading && (
                <>
                    {!hasAccess && <FreePlanBanner />}
                    <div className="bg-background dark:bg-darkBackground">
                        {selectedListing ? (
                            <div
                                key={selectedListing.id}
                                className={`w-full bg-background dark:bg-darkBackground h-[100vh]`}
                            >
                                <div className='bg-background dark:bg-darkBackground pl-8 pr-8 pt-8'>
                                    <div className="w-full grid md:flex md:items-center md:justify-between bg-white dark:bg-darkForeground rounded-2xl">
                                        <div className="my-auto ml-4">
                                            <Listbox
                                                value={selectedListing}
                                                onChange={(data) => {
                                                    if (data.id === 'create')
                                                        router.push(
                                                            '/app/client/create-listing'
                                                        );
                                                    else setSelectedListing(data);
                                                }}
                                            >
                                                <div className="relative">
                                                    <Listbox.Button className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-darkForeground text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:text-sm">
                                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pr-2">
                                                            <ChevronUpDownIcon
                                                                className="h-5 w-5 text-gray-400"
                                                                aria-hidden="true"
                                                            />
                                                        </span>
                                                        <span className="ml-8 text-3xl font-medium text-gray-900 dark:text-white">
                                                            {selectedListing.title}
                                                        </span>
                                                    </Listbox.Button>
                                                    <Transition
                                                        as={Fragment}
                                                        leave="transition ease-in duration-100"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0"
                                                    >
                                                        <Listbox.Options className="z-10 absolute mt-1 max-h-[20vh] w-full overflow-auto scrollbar-thin rounded-md bg-white dark:bg-darkBackground py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                            {[
                                                                ...listings,
                                                                {
                                                                    id: 'create',
                                                                    title: 'Create new listing',
                                                                },
                                                            ]?.map((option) => (
                                                                <Listbox.Option
                                                                    key={option.id}
                                                                    value={option}
                                                                    className={({
                                                                        active,
                                                                    }) =>
                                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                                            active
                                                                                ? 'bg-primaryBlue text-white'
                                                                                : 'text-gray-900 dark:text-white'
                                                                        }`
                                                                    }
                                                                >
                                                                    {({
                                                                        selected,
                                                                        active,
                                                                    }) => (
                                                                        <>
                                                                            <span
                                                                                className={`block truncate ${
                                                                                    selected
                                                                                        ? 'font-medium'
                                                                                        : 'font-normal'
                                                                                }`}
                                                                            >
                                                                                {
                                                                                    option.title
                                                                                }
                                                                            </span>
                                                                            {selected ? (
                                                                                <span
                                                                                    className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                                        active
                                                                                            ? 'text-white'
                                                                                            : 'text-primary'
                                                                                    }`}
                                                                                >
                                                                                    <CheckIcon
                                                                                        className="h-5 w-5"
                                                                                        aria-hidden="true"
                                                                                    />
                                                                                </span>
                                                                            ) : option.id ===
                                                                            'create' ? (
                                                                                <span
                                                                                    className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                                        active
                                                                                            ? 'text-white'
                                                                                            : 'text-primary'
                                                                                    }`}
                                                                                >
                                                                                    <PlusIcon
                                                                                        className="h-5 w-5"
                                                                                        aria-hidden="true"
                                                                                    />
                                                                                </span>
                                                                            ) : null}
                                                                        </>
                                                                    )}
                                                                </Listbox.Option>
                                                            ))}
                                                        </Listbox.Options>
                                                    </Transition>
                                                </div>
                                            </Listbox>
                                            <br />
                                            <span className="text-sm font-medium text-gray-500">
                                                Listing created on{' '}
                                                {new Date(
                                                    selectedListing.dateCreated
                                                ).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex justify-center items-center gap-12 md:gap-24">
                                            <div className="flex justify-center items-center gap-2 md:gap-6 px-4 py-4">
                                                <RoundButton
                                                    {...{
                                                        name: 'Copy link',
                                                        icon: LinkIcon,
                                                        onClick: () => {
                                                            navigator.clipboard.writeText(
                                                                `${window.location.origin}/app/listings/${selectedListing.id}`
                                                            );
                                                            addNotification({
                                                                type: 'success',
                                                                title: 'Link copied',
                                                                text: `${selectedListing.title}'s listing link has been copied to your clipboard.`,
                                                            });
                                                        },
                                                    }}
                                                />
                                                <RoundButton
                                                    {...{
                                                        name: 'Invite talent',
                                                        icon: UserPlusIcon,
                                                        onClick: () =>
                                                            router.push(
                                                                `/app/client/browse-talent?listing=${selectedListing.id}`
                                                            ),
                                                    }}
                                                />
                                                <RoundButton
                                                    {...{
                                                        name: 'Edit listing',
                                                        icon: PencilSquareIcon,
                                                        onClick: () =>
                                                            router.push(
                                                                `/app/listings/${selectedListing.id}`
                                                            ),
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='grid grid-cols-12 gap-4 bg-background dark:bg-darkBackground md:pl-4'>
                                    <div className="w-full h-full bg-background dark:bg-darkBackground col-span-12 md:col-span-8 lg:col-span-9">
                                        <div className="bg-background dark:bg-darkBackground p-4 grid grid-cols-6 gap-8 center-items">
                                            {APPLICATION_STATUS.map((status) => (
                                                <div
                                                    onClick={() =>
                                                        handleStatusTabClick(status)
                                                    }
                                                    className={`${
                                                        selectedStatus === status && status === "bookmarked"
                                                            ? `shadow-bookmarked`
                                                            : ''
                                                    } ${
                                                        selectedStatus === status && status === "invited"
                                                            ? `shadow-invited`
                                                            : ''
                                                    }
                                                    ${
                                                        selectedStatus === status && status === "applied"
                                                            ? `shadow-applied`
                                                            : ''
                                                    }
                                                    ${
                                                        selectedStatus === status && status === "interviewing"
                                                            ? `shadow-interviewing`
                                                            : ''
                                                    }
                                                    ${
                                                        selectedStatus === status && status === "shortlisted"
                                                            ? `shadow-shortlisted`
                                                            : ''
                                                    }
                                                    ${
                                                        selectedStatus === status && status === "hired"
                                                            ? `shadow-hired`
                                                            : ''
                                                    } hover:${selectedStatus !== status ? "shadow-lg" : ""} bg-white dark:bg-darkForeground flex flex-col h-[187px] rounded-2xl p-4 justify-between items-center my-4 col-span-3 md:col-span-2 lg:col-span-1`}
                                                >
                                                    <div>
                                                {status === "bookmarked" ? 
                                                <svg xmlns="http://www.w3.org/2000/svg" width="62" height="62" viewBox="0 0 62 62" fill="none">
        <rect width="62" height="62" rx="31" fill="#0079FE" fill-opacity="0.2"/>
        <path d="M25.75 28.375L29.25 31.875L37.125 24M43.25 46.75V23.65C43.25 20.7097 43.25 19.2396 42.6778 18.1165C42.1744 17.1287 41.3713 16.3256 40.3835 15.8222C39.2604 15.25 37.7903 15.25 34.85 15.25H27.15C24.2097 15.25 22.7396 15.25 21.6165 15.8222C20.6287 16.3256 19.8256 17.1287 19.3222 18.1165C18.75 19.2396 18.75 20.7097 18.75 23.65V46.75L31 39.75L43.25 46.75Z" stroke="#0079FE" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg> : null}

        {status === "invited" ? <svg xmlns="http://www.w3.org/2000/svg" width="62" height="62" viewBox="0 0 62 62" fill="none">
        <rect width="62" height="62" rx="31" fill="#F2994A" fill-opacity="0.2"/>
        <path d="M47.6249 41.5L36 31M26 31L14.3751 41.5M13.5 22.25L27.7886 32.252C28.9457 33.062 29.5242 33.4669 30.1535 33.6238C30.7093 33.7623 31.2907 33.7623 31.8465 33.6238C32.4758 33.4669 33.0543 33.062 34.2114 32.252L48.5 22.25M21.9 45H40.1C43.0403 45 44.5104 45 45.6334 44.4278C46.6213 43.9244 47.4244 43.1213 47.9278 42.1335C48.5 41.0104 48.5 39.5403 48.5 36.6V25.4C48.5 22.4597 48.5 20.9896 47.9278 19.8665C47.4244 18.8787 46.6213 18.0756 45.6334 17.5722C44.5104 17 43.0403 17 40.1 17H21.9C18.9597 17 17.4896 17 16.3665 17.5722C15.3787 18.0756 14.5756 18.8787 14.0722 19.8665C13.5 20.9896 13.5 22.4597 13.5 25.4V36.6C13.5 39.5403 13.5 41.0104 14.0722 42.1335C14.5756 43.1213 15.3787 43.9244 16.3665 44.4278C17.4896 45 18.9597 45 21.9 45Z" stroke="#F2994A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg> : null}

        {status === "applied" ? <svg xmlns="http://www.w3.org/2000/svg" width="62" height="62" viewBox="0 0 62 62" fill="none">
        <rect width="62" height="62" rx="31" fill="#F2C94C" fill-opacity="0.2"/>
        <path d="M25.75 30.1232L29.25 33.6232L37.125 25.7482M45 30.9982C45 39.588 35.6306 45.8354 32.2215 47.8242C31.834 48.0503 31.6403 48.1633 31.3669 48.2219C31.1548 48.2674 30.8452 48.2674 30.6331 48.2219C30.3597 48.1633 30.166 48.0503 29.7785 47.8242C26.3694 45.8354 17 39.588 17 30.9982V22.629C17 21.2298 17 20.5303 17.2288 19.9289C17.431 19.3977 17.7595 18.9237 18.1859 18.5479C18.6686 18.1225 19.3236 17.8768 20.6337 17.3855L30.0169 13.8669C30.3807 13.7304 30.5626 13.6622 30.7497 13.6352C30.9157 13.6112 31.0843 13.6112 31.2503 13.6352C31.4374 13.6622 31.6193 13.7304 31.9831 13.8669L41.3663 17.3855C42.6764 17.8768 43.3314 18.1225 43.8141 18.5479C44.2405 18.9237 44.569 19.3977 44.7712 19.9289C45 20.5303 45 21.2298 45 22.629V30.9982Z" stroke="#F2C94C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg> : null}

        {status === "interviewing" ? <svg xmlns="http://www.w3.org/2000/svg" width="62" height="62" viewBox="0 0 62 62" fill="none">
        <rect width="62" height="62" rx="31" fill="#27AE60" fill-opacity="0.2"/>
        <path d="M14.3756 32.75H24.8756M37.1256 32.75H47.6256M31.0006 22.25V46.75M31.0006 22.25C33.4168 22.25 35.3756 20.2912 35.3756 17.875M31.0006 22.25C28.5843 22.25 26.6256 20.2912 26.6256 17.875M17.0006 46.75L45.0006 46.75M17.0006 17.875L26.6256 17.875M26.6256 17.875C26.6256 15.4588 28.5843 13.5 31.0006 13.5C33.4168 13.5 35.3756 15.4588 35.3756 17.875M35.3756 17.875L45.0006 17.875M25.5414 35.0886C24.8401 37.7735 22.4573 39.75 19.6256 39.75C16.7939 39.75 14.411 37.7735 13.7098 35.0886C13.6525 34.8692 13.6239 34.7596 13.6211 34.3213C13.6194 34.0526 13.7193 33.4331 13.8053 33.1786C13.9456 32.7634 14.0975 32.529 14.4013 32.0603L19.6256 24L24.8498 32.0603C25.1536 32.529 25.3056 32.7634 25.4459 33.1786C25.5319 33.4331 25.6318 34.0526 25.6301 34.3213C25.6273 34.7596 25.5986 34.8692 25.5414 35.0886ZM48.2914 35.0886C47.5901 37.7735 45.2073 39.75 42.3756 39.75C39.5439 39.75 37.161 37.7735 36.4598 35.0886C36.4025 34.8692 36.3739 34.7596 36.3711 34.3213C36.3694 34.0526 36.4693 33.4331 36.5553 33.1786C36.6956 32.7634 36.8475 32.529 37.1513 32.0603L42.3756 24L47.5998 32.0603C47.9036 32.529 48.0556 32.7634 48.1959 33.1786C48.2819 33.4331 48.3817 34.0526 48.3801 34.3213C48.3773 34.7596 48.3486 34.8692 48.2914 35.0886Z" stroke="#27AE60" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg> : null}

        {status === "shortlisted" ? <svg xmlns="http://www.w3.org/2000/svg" width="62" height="62" viewBox="0 0 62 62" fill="none">
        <rect width="62" height="62" rx="31" fill="#9B51E0" fill-opacity="0.2"/>
        <path d="M31 37.125H23.125C20.6828 37.125 19.4616 37.125 18.468 37.4264C16.2308 38.1051 14.4801 39.8558 13.8014 42.093C13.5 43.0866 13.5 44.3078 13.5 46.75M38 41.5L41.5 45L48.5 38M35.375 23.125C35.375 27.4742 31.8492 31 27.5 31C23.1508 31 19.625 27.4742 19.625 23.125C19.625 18.7758 23.1508 15.25 27.5 15.25C31.8492 15.25 35.375 18.7758 35.375 23.125Z" stroke="#9B51E0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg> : null}

        {status === "hired" ? <svg xmlns="http://www.w3.org/2000/svg" width="62" height="62" viewBox="0 0 62 62" fill="none">
        <rect width="62" height="62" rx="31" fill="#56CCF2" fill-opacity="0.2"/>
        <path d="M22.4855 29.5807L15.8272 17.6659C15.0616 16.2959 14.6788 15.6109 14.7433 15.05C14.7996 14.5607 15.0595 14.1177 15.4592 13.8299C15.9173 13.5 16.702 13.5 18.2715 13.5H22.1824C22.7657 13.5 23.0573 13.5 23.3189 13.5842C23.5504 13.6588 23.7638 13.7807 23.9455 13.9423C24.1508 14.125 24.2988 14.3762 24.5949 14.8788L30.9992 25.75L37.4035 14.8788C37.6996 14.3762 37.8476 14.125 38.053 13.9423C38.2347 13.7807 38.4481 13.6588 38.6795 13.5842C38.9411 13.5 39.2327 13.5 39.816 13.5H43.727C45.2964 13.5 46.0811 13.5 46.5392 13.8299C46.9389 14.1177 47.1988 14.5607 47.2551 15.05C47.3196 15.6109 46.9368 16.2959 46.1712 17.6659L39.5129 29.5807M28.3742 34.5L30.9992 32.75V41.5M28.8117 41.5H33.1867M39.0426 29.0817C43.4848 33.5239 43.4848 40.7261 39.0426 45.1683C34.6004 49.6106 27.3981 49.6106 22.9559 45.1683C18.5137 40.7261 18.5137 33.5239 22.9559 29.0817C27.3981 24.6394 34.6003 24.6394 39.0426 29.0817Z" stroke="#56CCF2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg> : null}
                                                    </div>

                                                    <div>
                                                        <p className={`mx-auto text-2xl font-medium text-black dark:text-white`}>
                                                            {filteredApplications(
                                                                status
                                                            )?.length || 0}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="my-auto mt-2 text-sm font-medium text-black dark:text-white">
                                                            {capitalizeFirstLetter(
                                                                status
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className='pt-8 pr-4 md:pr-8 h-full bg-background dark:bg-darkBackground col-span-12 md:col-span-4 lg:col-span-3 '>
                                <div className="flex-col justify-center items-center hover:shadow-xl rounded-2xl bg-white dark:bg-darkForeground h-[110px] mb-8">
                                    <div className="px-4 pt-4 mb-2 flex justify-between items-center rounded-2xl">
                                        <div className="inline-flex">
                                            {
                                                user?.talentData?.profile?.photoUrl ? (
                                                    <img
                                                        className="hidden md:flex md:h-12 md:w-12 rounded-full text-gray-300 bg-gray-100"
                                                        src={
                                                            user?.talentData?.profile?.photoUrl
                                                        }
                                                    />
                                                ) : 
                                                <UserCircleIcon className="hidden md:flex md:h-12 md:w-12 rounded-full text-gray-300 bg-gray-100" />
                                            }

                                            <div className="ml-4 font-medium text-black dark:text-white flex items-center">
                                                <div>
                                                    <span className="mt- text-sm md:text-base lg:text-lg inline-flex">
                                                    {user?.contact?.firstName} {user?.contact?.lastName}
                                                    </span>
                                                    <div>
                                                        <span className="text-xs inline-flex">
                                                            <span>
                                                                {"Hyderabad"}
                                                            </span>
                                                            ,
                                                            <span
                                                                className={`ml-1`}
                                                            >
                                                                {"TG"}
                                                            </span>
                                                            {', '} {"India"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-center items-center text-black dark:text-white bg-background dark:bg-lightForeground rounded-xl p-2 text-primaryBlue">
                                        <PencilIcon className='h-4 text-primaryBlue'/>
                                            <button className="ml-2 text-xs md:text-sm" onClick={() => router.push('/app/profiles')}>Edit Profile</button>
                                        </div>
                                    </div>
                                    <div className="pl-8 md:pl-4 pb-2 text-black dark:text-white inline-flex items-center text-xs">
                                        <p>Senior UI/UX Designer</p>
                                        <PencilIcon className='w-4 h-4 text-primaryBlue ml-2'/>
                                    </div>
                                </div>
                                <div className='bg-white dark:bg-darkForeground rounded-2xl mb-8 p-4 text-black dark:text-white'>
                                    <div className='inline-flex items-center justify-between w-full'>
                                        <p className='text-black dark:text-white text-xs md:text-base lg:text-lg font-semibold'>Profile Completion</p>
                                        <div className='bg-greenBackground-200 rounded-md p-1'>
                                            <p className='text-greenText-500 font-medium'>10% Done</p>
                                        </div>
                                    </div>
                                    <div className='mt-4 w-full inline-flex items-center justify-between'>
                                        <p className='text-textGrey dark:text-darkTextGrey text-base'>Stand out from crowd and showcase your work experience</p>
                                        <button className='m-0 p-0' onClick={onClickProfileExpande}>
                                            {profileExpanded ? <ChevronUpIcon className='w-12 h-6 text-black dark:text-white mr-[-12px]'/> : 
                                            <ChevronDownIcon className='w-12 h-6 text-black dark:text-white mr-[-12px]'/> }
                                        </button>
                                    </div>
                                    {profileExpanded && 
                                    <div>
                                        <div className='inline-flex justify-between items-center w-full mt-4'>
                                            <div className='inline-flex items-center'>
                                                <ExclamationTriangleIcon className='w-4 h-4 text-subscribed mr-4'/>
                                                <p className='text-textGrey dark:text-darkTextGrey text-base'>Profile Picture</p>
                                            </div>
                                            <PencilIcon className='w-4 h-4 text-primaryBlue'/>
                                        </div>
                                        <div className='inline-flex justify-between items-center w-full mt-4'>
                                            <div className='inline-flex items-center'>
                                                <ExclamationTriangleIcon className='w-4 h-4 text-subscribed mr-4'/>
                                                <p className='text-textGrey dark:text-darkTextGrey text-base'>Full Address</p>
                                            </div>
                                            <PencilIcon className='w-4 h-4 text-primaryBlue'/>
                                        </div>
                                        <div className='inline-flex justify-between items-center w-full mt-4'>
                                            <div className='inline-flex items-center'>
                                                <ExclamationTriangleIcon className='w-4 h-4 text-subscribed mr-4'/>
                                                <p className='text-textGrey dark:text-darkTextGrey text-base'>Company Information</p>
                                            </div>
                                            <PencilIcon className='w-4 h-4 text-primaryBlue'/>
                                        </div>
                                        <div className='inline-flex justify-between items-center w-full mt-4'>
                                            <div className='inline-flex items-center'>
                                                <ExclamationTriangleIcon className='w-4 h-4 text-subscribed mr-4'/>
                                                <p className='text-textGrey dark:text-darkTextGrey text-base'>Sales Team Information</p>
                                            </div>
                                            <PencilIcon className='w-4 h-4 text-primaryBlue'/>
                                        </div>
                                        <div className='inline-flex justify-between items-center w-full mt-4'>
                                            <div className='inline-flex items-center'>
                                                <ExclamationTriangleIcon className='w-4 h-4 text-subscribed mr-4'/>
                                                <p className='text-textGrey dark:text-darkTextGrey text-base'>Social Information</p>
                                            </div>
                                            <PencilIcon className='w-4 h-4 text-primaryBlue'/>
                                        </div>
                                        <div className='inline-flex justify-between items-center w-full mt-4'>
                                            <div className='inline-flex items-center'>
                                                <ExclamationTriangleIcon className='w-4 h-4 text-subscribed mr-4'/>
                                                <p className='text-textGrey dark:text-darkTextGrey text-base'>Create Listings</p>
                                            </div>
                                            <PencilIcon className='w-4 h-4 text-primaryBlue'/>
                                        </div>
                                    </div>
                                    }
                                </div>
                                <div className='bg-white dark:bg-darkForeground rounded-2xl mb-8 p-4 text-black dark:text-white'>
                                    <div className='w-full'>
                                        <p className='text-black dark:text-white text-xs md:text-base lg:text-lg font-semibold'>Recent Activity</p>
                                    </div>
                                    <div className='mt-4 w-full inline-flex items-center justify-between'>
                                        <p className='text-textGrey dark:text-darkTextGrey text-base'>You Applied to a job</p>
                                        <button className='m-0 p-0' onClick={onClickActivityExpande}>
                                            {activityExpanded ? <ChevronUpIcon className='w-12 h-6 text-black dark:text-white mr-[-12px]'/> : 
                                            <ChevronDownIcon className='w-12 h-6 text-black dark:text-white mr-[-12px]'/> }
                                        </button>
                                    </div>
                                </div>
                                <div className='min-h-[100px] bg-white dark:bg-darkForeground rounded-2xl mb-8 p-4 text-black dark:text-white'>
                                    <div className='w-full'>
                                        <p className='text-black dark:text-white text-xs md:text-base lg:text-lg font-semibold'>Recent Chats</p>
                                    </div>
                                    <div className='mt-4 w-full inline-flex items-center justify-between'>
                                       
                                    </div>          
                                </div>
                            </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center h-[100vh] dark:bg-darkBackground pt-8">
                                <ClockIcon className="h-8 w-8 text-gray-900 dark:text-white" />
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
};


export default ClientIndex;
