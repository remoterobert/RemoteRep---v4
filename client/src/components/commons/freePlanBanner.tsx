import { useRouter } from 'next/router';

export const FreePlanBanner: React.FC = () => {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push('/app/client/create-listing')}
            className="flex items-center justify-center gap-x-6 bg-yellow-400 px-6 py-2.5 sm:px-3.5 cursor-pointer"
        >
            <p className="text-sm leading-6 text-black">
                <strong className="font-semibold">
                    You are currently on the free plan.
                </strong>{' '}
                Feel free to explore the platform on your current plan or click
                here to upgrade to a paid plan&nbsp;
                <span aria-hidden="true">&rarr;</span>
            </p>
        </div>
    );
};
