import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from './expressAuth';

export default async function (
    req: Request | CustomRequest,
    res: Response,
    next: NextFunction,
    func: (req: Request, res: Response) => Promise<void>
) {
    try {
        await func(req, res);
        next();
    } catch (err) {
        next({ status: err.status || 500, message: err.message });
    }
}
