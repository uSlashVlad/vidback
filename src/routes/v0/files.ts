import * as express from 'express';

import { upload, staticRoutePath } from '../../fs';
import { checkToken, checkUser } from '../../auth';

export const router = express.Router();

router.all('*', async (req, res, next) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUser(res, tokenData);
    if (user == null) return;

    next();
});

router.post('/photo', upload.single('photo'), (req, res) => {
    if (req.file == null) {
        res.status(400);
        res.send({ error: 'incorrect file' });
        return;
    }

    res.send({
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: process.env.SERVER_ADDRESS + staticRoutePath + req.file.filename,
    });
});

router.use('/static', express.static(process.env.SERVER_STATIC));
