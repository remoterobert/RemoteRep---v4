import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const SignUp: NextPage = () => {
    const router = useRouter();

    useEffect(() => {
        const theme = localStorage.getItem("theme");
        if(!theme){
            localStorage.setItem("theme","light");
            document.documentElement.classList.remove("dark");
        }else{
            if(theme === "dark"){
                document.documentElement.classList.add("dark");
            }
        }
    },[]);


    return (
        <>
            {/* <div className="shadow-lg w-full h-16 py-4 px-8">
                <img
                    className="absolute w-auto h-8"
                    src="/white-logo-with-text.svg"
                />
            </div> */}
            <div className='grid sm:grid-cols-2 lg:grid-cols-12 gap-0'>
                <div className='bg-background dark:bg-darkBackground lg:col-span-7 sm:col-span-1 border-none sm:h-full lg:h-screen'>
                    <img
                        className="h-full w-full object-cover"
                        src="/sign-in-background.jpg"
                    />
                </div>

                <div className="flex items-center justify-center h-full w-full lg:col-span-5 sm:col-span-1">
                    <div className="flex flex-col items-center justify-center sm:h-full lg:min-h-screen bg-background dark:bg-darkBackground w-full">
                        <div className='mb-16 pt-20 text-2xl text-black dark:text-white font-semibold'>
                            <p>Welcome to RemoteRep</p>
                        </div>
                        <div className="pt-8 pb-8 rounded-lg shadow-lg w-full min-h-[380px] max-w-sm bg-white dark:bg-darkForeground flex flex-col items-center">
                            <div className="flex mt-[-54px] justify-between w-[184px] p-0 rounded-tr-3xl rounded-bl-3xl rounded-tl-lg rounded-br-lg bg-white dark:bg-darkForeground">
                                <button
                                    className={`py-2 px-4 rounded-tr-3xl rounded-bl-3xl rounded-tl-lg rounded-br-lg m-0 w-[92px] bg-white dark:bg-darkForeground text-gray-400 font-semibold`}
                                    onClick={() => router.push('./sign-in')}
                                >
                                    Login
                                </button>
                                <button
                                    className={`py-2 px-4 rounded-tr-3xl rounded-bl-3xl rounded-tl-lg rounded-br-lg m-0 w-[92px] bg-blue-600 text-white font-semibold`}
                                >
                                    Sign up
                                </button>
                            </div>
                            <div className="py-5 w-[284px]">

                                <div className="mt-4">
                                        <span className="text-sm font-medium text-black dark:text-white">
                                            Join as an indivisual or company
                                        </span>

                                    <div className="grid gap-y-4 mt-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.push({
                                                        pathname: 'sign-up/talent',
                                                        query: router.query,
                                                    })
                                                }
                                                className="inline-flex w-full h-12 items-center justify-center rounded-full bg-white dark:bg-lightForeground px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                                            >
                                                Looking for Work
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.push({
                                                        pathname: 'sign-up/client',
                                                        query: router.query,
                                                    })
                                                }
                                                className="inline-flex w-full h-12 items-center justify-center rounded-full bg-white dark:bg-lightForeground px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 mt-4"
                                            >
                                                Looking to Hire
                                            </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignUp;
