require('dotenv').config();

import fs from 'fs';
import http from 'http';
import https from 'https';
import app from './app';

if (process.env.HTTP_PORT)
    http.createServer(app).listen(process.env.HTTP_PORT, () => {
        console.log(`HTTP listening on ${process.env.HTTP_PORT}`);
    });

if (process.env.HTTPS_CERT && process.env.HTTPS_KEY && process.env.HTTPS_PORT)
    https
        .createServer(
            {
                cert: fs.readFileSync(process.env.HTTPS_CERT),
                key: fs.readFileSync(process.env.HTTPS_KEY),
            },
            app
        )
        .listen(process.env.HTTPS_PORT, () => {
            console.log(`HTTPS listening on ${process.env.HTTPS_PORT}`);
        });
