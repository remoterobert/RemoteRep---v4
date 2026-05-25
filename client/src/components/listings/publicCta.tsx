import { useRouter } from 'next/router';

export const PublicCta: React.FC<{
    title: string;
    name: string;
}> = ({ title, name }) => {
    const router = useRouter();

    return (
        <div className="fixed w-[80vw] ml-[10vw] mx-auto bottom-0 mb-8 md:top-0 md:mt-8 shadow-xl rounded-full bg-white h-16 flex justify-between items-center px-4 md:px-16">
            <span className="text-lg md:text-xl font-medium">
                Looking to apply for{' '}
                <span className="text-primary">{title}</span> at{' '}
                <span className="text-primary">{name}</span>?
            </span>
            <div className="flex justify-center items-center gap-8">
                <span
                    onClick={() =>
                        router.push(`/authentication/sign-up/talent`)
                    }
                    className="inline-flex w-24 h-10 items-center justify-center rounded-xl bg-primary p-2 text-sm md:text-md font-semibold text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 hover:cursor-pointer sm:col-start-1 sm:mt-0"
                >
                    Sign up
                </span>
            </div>
        </div>
    );
};
