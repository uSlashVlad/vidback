import * as express from 'express';

import { router as groupsRouter } from './routes/groups';
import { router as linksRouter } from './routes/links';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.all('*', (req, _, next) => {
    console.log(`${req.method}: ${req.url}`);
    next();
});

app.use('/api/groups', groupsRouter);
app.use('/api/links', linksRouter);

app.all('*', (_, res) => {
    res.status(404);
    res.send({ error: 'No such method found' });
});

app.listen(8080, () => {
    console.log('express started');
});
