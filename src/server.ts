import * as express from 'express';

import { v0Root } from './routes/v0/root';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const pathStart = ''; // may be "/api" for example

app.all('*', (req, _, next) => {
    console.log(`${req.method}: ${req.url}`);
    next();
});

app.use(`${pathStart}/v0`, v0Root);
app.use(`${pathStart}/`, v0Root);

app.all('*', (_, res) => {
    res.status(404);
    res.send({ error: 'No such method found' });
});

app.listen(8080, () => {
    console.log('Express started');
});
