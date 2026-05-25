import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth';
import * as clientService from '../services/client';
import createError from './createError';

interface CustomRequest extends Request {
    user: authService.User;
}

const verifyUser = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.headers.authorization)
            throw createError(401, 'Authorization not found.');
        req.user = await authService.verify(req.headers.authorization);
        next();
    } catch (err) {
        next({
            status: err.status || 401,
            message: err.message || 'JWT token could not be verified.',
        });
    }
};

const checkTalent = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) throw createError(401, 'Authorization not found.');
        if (!(req.user instanceof authService.TalentUser)) throw new Error();
        next();
    } catch (err) {
        next({
            status: err.status || 403,
            message: err.message || 'User is not of type talent.',
        });
    }
};

const checkClient = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) throw createError(401, 'Authorization not found.');
        if (!(req.user instanceof authService.ClientUser)) throw new Error();
        next();
    } catch (err) {
        next({
            status: err.status || 403,
            message: err.message || 'User is not of type client.',
        });
    }
};

const checkAdministrator = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) throw createError(401, 'Authorization not found.');
        if (!(req.user instanceof authService.AdministratorUser))
            throw new Error();
        if (req.user.authority < 200) throw new Error();
        next();
    } catch (err) {
        next({
            status: err.status || 403,
            message: err.message || 'User is not of type administrator.',
        });
    }
};

const checkPayingClient = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) throw createError(401, 'Authorization not found.');
        if (!(req.user instanceof authService.ClientUser)) throw new Error();
        if (req.user.authority < 101) throw new Error();
        if (!(await clientService.getAccess(req.user)).access)
            throw new Error();

        next();
    } catch (err) {
        next({
            status: err.status || 403,
            message: err.message || 'User is not paying client.',
        });
    }
};

const checkAffiliate = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) throw createError(401, 'Authorization not found.');
        if (req.user.authority < 101)
            throw createError(403, 'Email unverified or user suspended.');
        if (req.user?.affiliateAccess !== 'active')
            throw createError(403, 'No affiliate access.');

        next();
    } catch (err) {
        next({
            status: err.status || 403,
            message: err.message || 'No affiliate access.',
        });
    }
};

export {
    CustomRequest,
    verifyUser,
    checkTalent,
    checkClient,
    checkAdministrator,
    checkPayingClient,
    checkAffiliate,
};
