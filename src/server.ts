import * as express from 'express';
import * as dotenv from 'dotenv';
dotenv.config();

import { v0Root } from './routes/v0/root';
import { expressLogger } from './loggers';

const startTime = new Date().toLocaleString('ru-RU', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});
console.log(`Host time: ${startTime}`);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const pathStart = ''; // may be "/api" for example

app.use(expressLogger);

app.use(`${pathStart}/v0`, v0Root);
app.use(`${pathStart}/`, v0Root);

app.all('*', (_, res) => {
    res.status(404);
    res.send({ error: 'No such method found', code: 6 });
});

app.listen(process.env.SERVER_PORT, () => {
    console.log(`Express started at port ${process.env.SERVER_PORT}`);
});
