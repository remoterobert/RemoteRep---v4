import { ClockIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import apiRequest from 'services/apiRequest';

const AdminCounts: React.FC = () => {
    const [counts, setCounts] = useState<any>();

    useEffect(() => {
        (async () => {
            const countsReq = await apiRequest('GET', '/admin/counts');

            if (countsReq.status === 200) setCounts(countsReq.data);
        })();
    }, []);

    return (
        <>
            <div className="md:col-span-6 bg-white border border-gray-300 rounded-md shadow-md">
                {!counts && (
                    <div className="flex items-center justify-center">
                        <ClockIcon className="h-8 w-8 text-gray-900" />
                    </div>
                )}

                {counts && (
                    <>
                        <dl className="grid grid-cols-2 divide-y divide-x divide-gray-200 overflow-hidden rounded-lg bg-white shadow md:grid-cols-4 md:divide-x md:divide-y-0">
                            {Object.entries(counts).map(([k, v]) => (
                                <div key={k} className="px-4 py-5 sm:p-6">
                                    <dt className="text-base font-normal text-gray-900">
                                        {`${k[0].toUpperCase()}${k.slice(1)}`}
                                    </dt>
                                    <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                                        <div className="flex items-baseline text-2xl font-semibold text-primary">
                                            {(v as number).toString()}
                                        </div>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </>
                )}
            </div>
        </>
    );
};

export default AdminCounts;
