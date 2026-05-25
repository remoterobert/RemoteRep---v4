import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes';
import expressErrorHandler from './utilities/expressErrorHandler';

const app = express();

app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);
app.use(
    cors({
        origin:
            process.env.DEPLOYMENT_STAGE === 'prod'
                ? 'https://app.remoterep.com'
                : process.env.DEPLOYMENT_STAGE === 'staging'
                ? 'https://staging.remoterep.com'
                : 'http://localhost:3000',
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routes);

app.use(expressErrorHandler);

export default app;
