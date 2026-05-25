import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import FormBuilder from '../../components/forms/formBuilder';
import { useForm } from 'react-hook-form';
import apiRequest from '../../services/apiRequest';
import * as authentication from '../../services/authentication';
import { useNotification } from 'contexts/NotificationContext';
import { useEffect } from 'react';

const SignIn: NextPage = () => {
    const signInForm = useForm();
    const router = useRouter();
    const { addNotification } = useNotification();

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
                    {/* <div className="absolute bg-white shadow-xl rounded-xl w-[80vw] md:w-[20vw]">
                        <div className="border-b border-gray-200 bg-white py-4 rounded-t-xl">
                            <h3 className="text-center text-sm font-semibold text-gray-900">
                                Don't have an account?{' '}
                                <span
                                    onClick={() => router.push('./sign-up')}
                                    className="text-primary"
                                >
                                    Sign up
                                </span>{' '}
                                instead.
                            </h3>
                        </div>

                        <div className="px-4 py-5 sm:px-6">
                            <span className="text-xl font-medium text-gray-900">
                                It's great to see you back.
                            </span>

                            <div className="mt-4">
                                <FormBuilder
                                    {...{
                                        formHook: signInForm,
                                        formName: 'signIn',
                                        submitText: 'Sign in',
                                        postFunc: async (data) => {
                                            try {
                                                const authRequest =
                                                    await apiRequest(
                                                        'POST',
                                                        '/auth/login',
                                                        {
                                                            ...data,
                                                            userTimeZone:
                                                                Intl?.DateTimeFormat()?.resolvedOptions()
                                                                    ?.timeZone ||
                                                                null,
                                                        }
                                                    );

                                                if (authRequest.data?.token) {
                                                    authentication
                                                        .getUser(
                                                            authRequest.data.token
                                                        )
                                                        .then(() =>
                                                            setTimeout(
                                                                () =>
                                                                    window.location.reload(),
                                                                1000
                                                            )
                                                        );

                                                    addNotification({
                                                        type: 'success',
                                                        title: 'Signed in successfully',
                                                        text: 'Redirecting you to your dasboard...',
                                                    });

                                                    return true;
                                                } else {
                                                    addNotification({
                                                        type: 'error',
                                                        title: 'Error signing in',
                                                        text:
                                                            authRequest?.error ||
                                                            'An unknown server error has occurred. Please try signing in again in a few minutes.',
                                                    });

                                                    return false;
                                                }
                                            } catch {
                                                addNotification({
                                                    type: 'error',
                                                    title: 'Error signing in',
                                                    text: 'An unknown server error has occurred. Please try signing in again in a few minutes.',
                                                });

                                                return false;
                                            }
                                        },
                                    }}
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-200 bg-white py-4 rounded-b-xl">
                            <h3
                                className="text-center text-sm font-semibold text-primary"
                                onClick={() => router.push('./reset-password')}
                            >
                                Forgot your password?
                            </h3>
                        </div>
                    </div> */}
                    
                    <div className="flex flex-col items-center justify-center sm:h-full lg:min-h-screen bg-background dark:bg-darkBackground w-full">
                        <div className='mb-16 pt-20 text-2xl text-black dark:text-white font-semibold'>
                            <p>Welcome to RemoteRep</p>
                        </div>
                        <div className="pt-8 pb-8 rounded-lg shadow-lg w-full min-h-[380px] max-w-sm bg-white dark:bg-darkForeground flex flex-col items-center">
                            <div className="flex mt-[-54px] justify-between w-[184px] p-0 rounded-tr-3xl rounded-bl-3xl rounded-tl-lg rounded-br-lg bg-white dark:bg-darkForeground">
                            <button
                                className={`py-2 px-4 rounded-tr-3xl rounded-bl-3xl rounded-tl-lg rounded-br-lg m-0 w-[92px] bg-blue-600 text-white font-semibold`}
                                // onClick={() => setIsLogin(true)}
                            >
                                Login
                            </button>
                            <button
                                className={`py-2 px-4 rounded-tr-3xl rounded-bl-3xl rounded-tl-lg rounded-br-lg m-0 w-[92px] bg-white dark:bg-darkForeground text-gray-400 font-semibold`}
                                onClick={() => router.push('./sign-up')}
                            >
                                Sign up
                            </button>
                            </div>
                            <div className="py-5 w-[284px]">

                                            <div className="mt-4">
                                                <FormBuilder
                                                    {...{
                                                        formHook: signInForm,
                                                        formName: 'signIn',
                                                        submitText: 'Login',
                                                        postFunc: async (data) => {
                                                            try {
                                                                const authRequest =
                                                                    await apiRequest(
                                                                        'POST',
                                                                        '/auth/login',
                                                                        {
                                                                            ...data,
                                                                            userTimeZone:
                                                                                Intl?.DateTimeFormat()?.resolvedOptions()
                                                                                    ?.timeZone ||
                                                                                null,
                                                                        }
                                                                    );

                                                                if (authRequest.data?.token) {
                                                                    authentication
                                                                        .getUser(
                                                                            authRequest.data.token
                                                                        )
                                                                        .then(() =>
                                                                            setTimeout(
                                                                                () =>
                                                                                    window.location.reload(),
                                                                                1000
                                                                            )
                                                                        );

                                                                    addNotification({
                                                                        type: 'success',
                                                                        title: 'Signed in successfully',
                                                                        text: 'Redirecting you to your dasboard...',
                                                                    });

                                                                    return true;
                                                                } else {
                                                                    addNotification({
                                                                        type: 'error',
                                                                        title: 'Error signing in',
                                                                        text:
                                                                            authRequest?.error ||
                                                                            'An unknown server error has occurred. Please try signing in again in a few minutes.',
                                                                    });

                                                                    return false;
                                                                }
                                                            } catch {
                                                                addNotification({
                                                                    type: 'error',
                                                                    title: 'Error signing in',
                                                                    text: 'An unknown server error has occurred. Please try signing in again in a few minutes.',
                                                                });

                                                                return false;
                                                            }
                                                        },
                                                    }}
                                                />
                                            </div>
                            </div>

                                        <div className="py-4 rounded-b-xl">
                                            <h3
                                                className="text-center text-sm font-semibold text-primary"
                                                onClick={() => router.push('./reset-password')}
                                            >
                                                Forgot your password?
                                            </h3>
                                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignIn;
