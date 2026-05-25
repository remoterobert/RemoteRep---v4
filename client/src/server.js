require('dotenv').config();

const fs = require('fs');
const http = require('http');
const https = require('https');
const { parse } = require('url');

const next = require('next');

const app = next({
    dev: false,
    hostname: process.env.HOSTNAME,
    port: process.env.HTTPS_PORT
        ? process.env.HTTPS_PORT
        : process.env.HTTP_PORT,
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
    if (
        process.env.HTTPS_CERT &&
        process.env.HTTPS_KEY &&
        process.env.HTTPS_PORT
    ) {
        https
            .createServer(
                {
                    cert: fs.readFileSync(process.env.HTTPS_CERT),
                    key: fs.readFileSync(process.env.HTTPS_KEY),
                },
                async (req, res) => {
                    try {
                        await handle(req, res, parse(req.url, true));
                    } catch (err) {
                        console.error('Error occurred handling', req.url, err);
                        res.statusCode = 500;
                        res.end('Internal server error');
                    }
                }
            )
            .listen(process.env.HTTPS_PORT, () => {
                console.log('HTTPS ready.');
            });

        http.createServer(async (req, res) => {
            res.writeHead(301, {
                Location: 'https://' + req.headers['host'] + req.url,
            });
            res.end();
        }).listen(process.env.HTTP_PORT, () => {
            console.log('Redirecting HTTP traffic to HTTPS...');
        });
    } else if (process.env.HTTP_PORT) {
        http.createServer(async (req, res) => {
            try {
                await handle(req, res, parse(req.url, true));
            } catch (err) {
                console.error('Error occurred handling', req.url, err);
                res.statusCode = 500;
                res.end('Internal server error');
            }
        }).listen(process.env.HTTP_PORT, () => {
            console.log('HTTP ready.');
        });
    } else {
        console.error('NO HTTP OR HTTPS');
    }
});
