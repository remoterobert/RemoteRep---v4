import axios, { AxiosResponse } from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const methodDict = {
            GET: axios.get,
            POST: axios.post,
            PUT: axios.put,
            PATCH: axios.patch,
            DELETE: axios.delete,
        };

        if (!req.method || !Object.keys(methodDict).includes(req.method)) {
            res.status(400).json({ error: 'Invalid method' });
            return;
        }

        const axiosFunc: (...args: any[]) => Promise<AxiosResponse<any, any>> =
            methodDict[req.method as keyof typeof methodDict];

        if (
            !req.query ||
            !req.query.apiRoute ||
            typeof req.query.apiRoute !== 'object'
        ) {
            res.status(400).json({ error: 'Invalid route' });
            return;
        }

        const axiosParams: any[] = [
            `${process.env.BACKEND_BASE_URL}/${req.query.apiRoute.join('/')}`,
        ];

        if (['POST', 'PATCH', 'PUT'].includes(req.method))
            axiosParams.push(req.body);

        const axiosHeaders: { [key: string]: any } = {};

        if (req?.headers?.authorization)
            axiosHeaders['Authorization'] = req.headers.authorization;

        axiosParams.push({ headers: axiosHeaders });

        axiosFunc(...axiosParams)
            .then((apiRes) => res.status(apiRes.status).json(apiRes.data))
            .catch((apiErr) =>
                res.status(apiErr?.response?.status || 500).json(
                    apiErr?.response?.data || {
                        error: 'Internal server error',
                    }
                )
            );

        return;
    } catch {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }
}
