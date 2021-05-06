import { Request } from 'express';
import * as multer from 'multer';

const storage = multer.diskStorage({
    destination: (_r, _f, cb) => {
        cb(null, process.env.SERVER_STATIC);
    },
    filename: (_, file, cb) => {
        // In general it is algorythm from express website...
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const spl = file.originalname.split('.');
        const fileExt = spl.length > 1 ? spl.pop() : null; // ...but I also get file extension
        cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${
                fileExt != null ? '.' + fileExt : ''
            }`
        );
    },
});

export const upload = multer({
    storage: storage,

    limits: { fileSize: 20971520 },
});

export const staticRoutePath = 'files/static/';
