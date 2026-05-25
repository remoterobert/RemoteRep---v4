import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import FormBuilder from '../../../components/forms/formBuilder';
import { useForm } from 'react-hook-form';
import apiRequest from '../../../services/apiRequest';
import * as authentication from '../../../services/authentication';
import { useState, useEffect } from 'react';

const TalentSignUp: NextPage = () => {
    const [createRef, setCreateRef] = useState('');

    const signUpForm = useForm();

    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;

        if (router?.query?.ref) setCreateRef(router.query.ref as string);
    }, [router.isReady, router.query]);

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
                    <div className="px-8 py-8 rounded-lg shadow-lg w-full min-h-[380px] max-w-sm bg-white dark:bg-darkForeground flex flex-col items-center">
                        <div className="border-b border-gray-200 py-4 rounded-t-xl">
                            <h3 className="text-center text-sm font-semibold text-gray-900 dark:text-white">
                                Looking to hire? Sign up{' '}
                                <span
                                    onClick={() =>
                                        router.push({
                                            pathname: './client',
                                            query: router.query,
                                        })
                                    }
                                    className="text-primary cursor-pointer"
                                >
                                    here
                                </span>{' '}
                                instead.
                            </h3>
                        </div>

                        <div className="py-5 w-[284px]">
                            <span className="text-xl font-medium text-gray-900 dark:text-white">
                                I am{' '}
                                <span className="text-primary">
                                    looking for work
                                </span>
                                .
                            </span>

                            <div className="mt-4">
                                <FormBuilder
                                    {...{
                                        formHook: signUpForm,
                                        formName: 'talentSignUp',
                                        submitText: 'Sign up',
                                        postFunc: async (data) => {
                                            try {
                                                const authRequest =
                                                    await apiRequest(
                                                        'POST',
                                                        '/auth/register',
                                                        {
                                                            ...data,
                                                            accountType: 'talent',
                                                            creationReference:
                                                                createRef ||
                                                                'default',
                                                            affiliateCode:
                                                                router?.query?.r,
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
                                                    return true;
                                                } else return false;
                                            } catch {
                                                return false;
                                            }
                                        },
                                    }}
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-200 py-4 rounded-b-xl">
                            <h3 className="text-center text-sm font-semibold text-gray-900 dark:text-white">
                                By creating an account you agree to our{' '}
                                <span
                                    onClick={() =>
                                        window.open('/privacy-policy', '_blank')
                                    }
                                    className="text-primary hover:underline"
                                >
                                    Privacy Policy
                                </span>{' '}
                                and{' '}
                                <span
                                    onClick={() =>
                                        window.open('/terms-of-use', '_blank')
                                    }
                                    className="text-primary hover:underline"
                                >
                                    Terms of Use
                                </span>
                                .
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default TalentSignUp;
