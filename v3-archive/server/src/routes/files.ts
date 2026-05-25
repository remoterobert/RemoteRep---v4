import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import {
    CustomRequest,
    verifyUser,
    checkAdministrator,
} from '../utilities/expressAuth';
import expressHandleWrapper from '../utilities/expressHandleWrapper';
import createError from '../utilities/createError';

const router = express.Router();

const upload = multer({
    dest: process.env.UPLOAD_DIR,
    limits: { fileSize: 4 * 1024 * 1024 },
});

router.use(upload.single('file'));

router.get('/profile/:fileName', async (req: CustomRequest, res) => {
    try {
        res.status(200).sendFile(
            path.join(process.env.UPLOAD_DIR, '/profile', req.params.fileName)
        );
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.get(
    '/resume/:fileName',
    // verifyUser,
    // checkAdministrator,
    async (req: CustomRequest, res) => {
        res.setHeader('Content-Security-Policy', 'frame-ancestors *');

        try {
            res.status(200).sendFile(
                path.join(
                    process.env.UPLOAD_DIR,
                    '/resume',
                    req.params.fileName
                )
            );
        } catch (err) {
            res.status(500).send({ error: err.message });
        }
    }
);

router.post('/profile', verifyUser, async (req: CustomRequest, res) => {
    try {
        if (!req.file) throw createError(400, 'No file attached.');
        else if (
            !['png', 'jpg', 'jpeg'].some(
                (ft) => req.file.originalname.split('.').at(-1) === ft
            )
        )
            throw createError(400, 'Unsupported file format.');

        const desiredPath = path.join(
            process.env.UPLOAD_DIR,
            '/profile',
            `${req.user.id}.${req.file.originalname.split('.').at(-1)}`
        );

        if (fs.existsSync(desiredPath)) fs.unlinkSync(desiredPath);

        fs.rename(req.file.path, desiredPath, (err) => {
            if (err) throw createError(500, 'Could not rename file.' + err);
            else
                res.status(200).send({
                    path: `${process.env.BACKEND_PUBLIC_URL}/files/profile/${
                        req.user.id
                    }.${req.file.originalname.split('.').at(-1)}`,
                });
        });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.post('/resume', verifyUser, async (req: CustomRequest, res) => {
    try {
        if (!req.file) throw createError(400, 'No file attached.');
        else if (req.file.originalname.split('.').at(-1) !== 'pdf')
            throw createError(400, 'Unsupported file format.');

        const desiredPath = path.join(
            process.env.UPLOAD_DIR,
            '/resume',
            `${req.user.id}.pdf`
        );

        fs.rename(req.file.path, desiredPath, (err) => {
            if (err) throw createError(500, 'Could not rename file.');
            else
                res.status(200).send({
                    path: `${process.env.BACKEND_PUBLIC_URL}/files/resume/${
                        req.user.id
                    }.${req.file.originalname.split('.').at(-1)}`,
                });
        });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

export default router;
