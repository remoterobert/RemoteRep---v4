import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from './expressAuth';

export default function expressErrorHandler(
    err: any,
    req: Request | CustomRequest,
    res: Response,
    next: NextFunction
) {
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.status || 500).send({ error: err.message });
}
