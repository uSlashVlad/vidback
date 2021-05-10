import * as winston from 'winston';
import * as expressWinston from 'express-winston';

export const expressLogger = expressWinston.logger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: './logs/info.log' }),
    ],
    format: winston.format.json(),
    meta: false,
    expressFormat: true,
});
