import { Fragment, useEffect, useState } from 'react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
    Bars3Icon,
    BuildingOffice2Icon,
    ShieldCheckIcon,
    XMarkIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import * as localData from '../../services/localData';
import {
    administratorNavigation,
    administratorUserNavigation,
} from '../../services/appNavigation';
import { useRouter } from 'next/router';

function classNames(...classes: any) {
    return classes.filter(Boolean).join(' ');
}

export default function AdministratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>({});
    const [theme,setTheme] = useState("light");
    const router = useRouter();

    useEffect(() => {
        const localUser = localData.get('user');
        setUser(localUser);
    }, []);

    useEffect(() => {
        const theme = localStorage.getItem("theme");
        if(!theme){
            localStorage.setItem("theme","light");
            document.documentElement.classList.remove("dark");
            setTheme("light");
        }else{
            if(theme === "dark"){
                document.documentElement.classList.add(theme);
            }
            setTheme(theme);
        }
    },[]);

    const onChangeTheme = (e:any) => {
        const selectedTheme = e.target.checked ? "dark" : "light";
        setTheme(selectedTheme);
        localStorage.setItem("theme", selectedTheme);
        if(selectedTheme === "light"){
            document.documentElement.classList.remove("dark");
        }else{
            document.documentElement.classList.add("dark");
        }
    }

    return (
        <>
            <div>
                <Transition.Root show={sidebarOpen} as={Fragment}>
                    <Dialog
                        as="div"
                        className="relative z-50 lg:hidden"
                        onClose={setSidebarOpen}
                    >
                        <Transition.Child
                            as={Fragment}
                            enter="transition-opacity ease-linear duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity ease-linear duration-300"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-gray-900/80" />
                        </Transition.Child>

                        <div className="fixed inset-0 flex">
                            <Transition.Child
                                as={Fragment}
                                enter="transition ease-in-out duration-300 transform"
                                enterFrom="-translate-x-full"
                                enterTo="translate-x-0"
                                leave="transition ease-in-out duration-300 transform"
                                leaveFrom="translate-x-0"
                                leaveTo="-translate-x-full"
                            >
                                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-in-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in-out duration-300"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                            <button
                                                type="button"
                                                className="-m-2.5 p-2.5"
                                                onClick={() =>
                                                    setSidebarOpen(false)
                                                }
                                            >
                                                <span className="sr-only">
                                                    Close sidebar
                                                </span>
                                                <XMarkIcon
                                                    className="h-6 w-6 text-white"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </div>
                                    </Transition.Child>
                                    {/* Sidebar component, swap this element with another sidebar if you like */}
                                    <div className="flex grow flex-col gap-y-5 overflow-y-auto scrollbar-thin bg-gray-900 px-6 pb-2 ring-1 ring-white/10">
                                        <div className="flex h-16 shrink-0 items-center">
                                            <img
                                                className="h-8 w-auto"
                                                src="/white-logo-with-text.svg"
                                                alt="RemoteRep.com"
                                            />
                                        </div>
                                        <nav className="flex flex-1 flex-col">
                                            <ul
                                                role="list"
                                                className="flex flex-1 flex-col gap-y-7"
                                            >
                                                <li>
                                                    <ul
                                                        role="list"
                                                        className="-mx-2 space-y-1"
                                                    >
                                                        {administratorNavigation.map(
                                                            (item) => (
                                                                <li
                                                                    key={
                                                                        item.name
                                                                    }
                                                                >
                                                                    <a
                                                                        href={
                                                                            item.href
                                                                        }
                                                                        onClick={(
                                                                            e
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            if (
                                                                                item.newTab
                                                                            )
                                                                                window.open(
                                                                                    item.href,
                                                                                    '_blank'
                                                                                );
                                                                            else
                                                                                router.push(
                                                                                    item.href
                                                                                );
                                                                        }}
                                                                        className={classNames(
                                                                            router.pathname ===
                                                                                item.href
                                                                                ? 'bg-gray-800 text-white'
                                                                                : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                                        )}
                                                                    >
                                                                        <item.icon
                                                                            className="h-6 w-6 shrink-0"
                                                                            aria-hidden="true"
                                                                        />
                                                                        <span>
                                                                            {
                                                                                item.name
                                                                            }
                                                                        </span>
                                                                    </a>
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition.Root>

                {/* Static sidebar for desktop */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-[216px] lg:flex-col lg:shadow-xl">
                    {/* Sidebar component, swap this element with another sidebar if you like */}
                    <div className="flex grow flex-col gap-y-5 overflow-y-auto scrollbar-thin bg-sideMenu px-4 overflow-clip">
                        <div className="flex h-16 shrink-0 items-center">
                            <img
                                className="h-8 w-8"
                                src="/white-logo.svg"
                                alt="RemoteRep.com"
                            />
                            <h5 className="text-white font-black text-lg p-3">Remoterep.com</h5>
                        </div>
                        <nav className="flex flex-1 flex-col">
                            <ul
                                role="list"
                                className="flex flex-1 flex-col gap-y-7"
                            >
                                <li>
                                    <ul role="list" className="-mx-2 space-y-1">
                                        {administratorNavigation.map((item) => (
                                            <li key={item.name}>
                                                <a
                                                    href={item.href}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (item.newTab)
                                                            window.open(
                                                                item.href,
                                                                '_blank'
                                                            );
                                                        else
                                                            router.push(
                                                                item.href
                                                            );
                                                    }}
                                                    className={classNames(
                                                        router.pathname ===
                                                            item.href
                                                            ? 'bg-primaryBlue text-white'
                                                            : 'text-white hover:text-white hover:bg-primaryBlue',
                                                        'group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold'
                                                    )}
                                                >
                                                    <item.icon
                                                        className="h-6 w-6 shrink-0"
                                                        aria-hidden="true"
                                                    />
                                                    {item.name}
                                                    {/* <a className="z-40 invisible group-hover:visible bg-gray-800 text-white -mt-2 p-2 rounded-md absolute ml-12 whitespace-nowrap">
                                                        {item.name}
                                                    </a> */}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                                {/* <li className="-mx-6 mt-auto">
                                    <Menu as="div">
                                        <Menu.Button className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-white hover:bg-gray-800">
                                            <span className="sr-only">
                                                Open user menu
                                            </span>

                                            <ShieldCheckIcon className="h-8 w-8 rounded-full text-gray-100" />
                                        </Menu.Button>
                                        <Transition
                                            as={Fragment}
                                            enter="transition ease-out duration-100"
                                            enterFrom="transform opacity-0 scale-95"
                                            enterTo="transform opacity-100 scale-100"
                                            leave="transition ease-in duration-75"
                                            leaveFrom="transform opacity-100 scale-100"
                                            leaveTo="transform opacity-0 scale-95"
                                        >
                                            <Menu.Items className="absolute z-40 ml-20 bottom-2 w-32 rounded-md bg-gray-900 py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                                {administratorUserNavigation.map(
                                                    (item) => (
                                                        <Menu.Item
                                                            key={item.name}
                                                        >
                                                            <a
                                                                href={item.href}
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.preventDefault();
                                                                    router.push(
                                                                        item.href
                                                                    );
                                                                }}
                                                                className={classNames(
                                                                    router.pathname ===
                                                                        item.href
                                                                        ? 'bg-gray-800 text-white'
                                                                        : 'bg-gray-900 text-gray-400',
                                                                    'block px-3 py-1 text-sm leading-6 hover:text-white hover:bg-gray-800'
                                                                )}
                                                            >
                                                                {item.name}
                                                            </a>
                                                        </Menu.Item>
                                                    )
                                                )}
                                            </Menu.Items>
                                        </Transition>
                                    </Menu>
                                </li> */}
                                <li className="ml-4 mt-auto mb-8 text-white font-bold inline-flex">
                                    <span className="text-base font-bold text-white dark:text-gray-300">Dark Theme</span>
                                    <div className="pl-4">
                                        <label htmlFor="default-toggle" className="inline-flex relative items-center cursor-pointer">
                                        <input type="checkbox" checked={theme === "dark"} onClick={onChangeTheme} id="default-toggle" className="sr-only peer"/>
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primaryBlue"></div>
                                        </label>
                                    </div>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>

                <div className="sticky top-0 z-40 flex items-center justify-between gap-x-6 bg-gray-900 px-4 py-4 shadow-sm sm:px-6 lg:hidden shadow-xl">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-400 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    </button>

                    <Menu as="div" className="relative">
                        <Menu.Button className="-m-1.5 flex items-center p-1.5">
                            <span className="sr-only">Open user menu</span>

                            <ShieldCheckIcon className="h-8 w-8 rounded-full bg-gray-50" />
                        </Menu.Button>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute right-0 z-10 mt-5 w-32 origin-top-right rounded-md bg-gray-900 py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                {administratorUserNavigation.map((item) => (
                                    <Menu.Item key={item.name}>
                                        <a
                                            href={item.href}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                router.push(item.href);
                                            }}
                                            className={classNames(
                                                router.pathname === item.href
                                                    ? 'bg-gray-800 text-white'
                                                    : 'bg-gray-900 text-gray-400',
                                                'block px-3 py-1 text-sm leading-6 hover:text-white hover:bg-gray-800'
                                            )}
                                        >
                                            {item.name}
                                        </a>
                                    </Menu.Item>
                                ))}
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>

                <div className="hidden lg:fixed lg:inset-x-0 lg:z-30 lg:flex lg:pl-[216px] h-[72px]  lg:flex-col">
                    <div className="flex grow flex-col gap-x-5 overflow-x-auto bg-white dark:bg-darkForeground px-4 overflow-clip">
                    <div className="inline-flex gap-x-6 top-0 z-40 flex items-center justify-end gap-x-6 px-4 py-4 shadow-sm sm:px-6">
                        <Menu as="div" className="relative">
                            <Menu.Button className="-m-1.5 flex items-center p-1.5">
                                <span className="sr-only">Open user menu</span>
                                {user?.administratorData?.profile?.photoUrl ? (
                                    <>
                                    <ShieldCheckIcon className="h-8 w-8 rounded-full bg-white" />
                                    <h3 className="mr-4 text-sm text-black dark:text-white">{user?.contact?.firstName} {user?.contact?.lastName}</h3>
                                        <ChevronDownIcon className="h-4 w-4 text-black dark:text-white"/>
                                    </>
                                ) : (
                                    <>
                                    <ShieldCheckIcon className="h-8 w-8 rounded-full bg-white" />
                                    <ChevronDownIcon className="h-4 w-4 text-black dark:text-white ml-1"/>
                                    </>
                                )}
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="fixed right-0 z-10 mt-5 w-32 origin-top-right rounded-md bg-gray-900 py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                    {administratorUserNavigation.map((item) => (
                                        <Menu.Item key={item.name}>
                                            <a
                                                href={item.href}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    router.push(item.href);
                                                }}
                                                className={classNames(
                                                    router.pathname ===
                                                        item.href
                                                        ? 'bg-gray-800 text-white'
                                                        : 'bg-gray-900 text-gray-400',
                                                    'block px-3 py-1 text-sm leading-6 hover:text-white hover:bg-gray-800'
                                                )}
                                            >
                                                {item.name}
                                            </a>
                                        </Menu.Item>
                                    ))}
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>
                    </div>
                </div>
                
                <main className="lg:pl-[216px] lg:pt-[72px] bg-background dark:bg-darkBackground">{children}</main>
            </div>
        </>
    );
}
