import { Router } from 'express';

import { upload } from '../../fs';
import { subjects } from '../../database';
import { genId, checkToken, checkUserAdmin, checkUser } from '../../auth';

import {
    idRouter as subLessonsRouter,
    allRouter as allLessonsRouter,
} from './lessons';
import {
    idRouter as subHomeworksRouter,
    allRouter as allHomeworksRouter,
} from './homeworks';

export const router = Router();

// It was inserted before subject's routes because of conflicts
router.use('/lessons', allLessonsRouter);
router.use('/:subjectId/lessons', subLessonsRouter);
router.use('/homeworks', allHomeworksRouter);
router.use('/:subjectId/homeworks', subHomeworksRouter);

router.get('/', async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUser(res, tokenData);
    if (user == null) return;

    const data = await subjects.find(
        { group_id: tokenData.group },
        { _id: 0, __v: 0, lessons: 0, homeworks: 0 }
    );
    res.send({ items: data, count: data.length });
});

router.get('/:id', async (req, res) => {
    const tokenData = checkToken(req, res);
    await checkUser(res, tokenData);

    const subjectId = req.params.id;
    if (subjectId == null) {
        res.status(400);
        res.send({ error: 'no subject_id specified', code: 3 });
        return;
    }

    res.send(
        await subjects.findOne(
            { group_id: tokenData.group, subject_id: subjectId },
            { _id: 0, __v: 0, 'lessons._id': 0, 'homeworks._id': 0 }
        )
    );
});

router.post('/', upload.none(), async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUserAdmin(res, tokenData);
    if (user == null) return;

    const name: string = req.body.name;
    if (name == null) {
        res.status(400);
        res.send({ error: 'no subject name specified', code: 3 });
        return;
    }

    let linkId = genId('4');

    const newSubject = await subjects.create({
        subject_id: linkId,
        group_id: tokenData.group,
        name: name,
        lessons: [],
        homeworks: [],
    });

    const json = newSubject.toJSON();
    delete json.__v;
    delete json._id;

    res.send(json);
});

router.delete('/:id', async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUserAdmin(res, tokenData);
    if (user == null) return;

    const subjectId = req.params.id;
    if (subjectId == null) {
        res.status(400);
        res.send({ error: 'no subject id specified', code: 3 });
        return;
    }

    const thisSubject = await subjects.findOne({ subject_id: subjectId });
    if (thisSubject == null) {
        res.status(400);
        res.send({ error: 'no such subject found', code: 6 });
        return;
    }

    await thisSubject.delete();

    res.send({});
});

router.put('/:id', upload.none(), async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUserAdmin(res, tokenData);
    if (user == null) return;

    const subjectId = req.params.id;
    if (subjectId == null) {
        res.status(400);
        res.send({ error: 'no subject id specified', code: 3 });
        return;
    }
    const name: string = req.body.name;
    if (name == null) {
        res.status(400);
        res.send({ error: 'no changes cpecified', code: 3 });
        return;
    }

    const thisSubject = await subjects.findOne({ subject_id: subjectId });
    if (thisSubject == null) {
        res.status(400);
        res.send({ error: 'no such subject found', code: 6 });
        return;
    }

    thisSubject.name = name;
    const data = await thisSubject.save();

    const json = data.toJSON();
    delete json.__v;
    delete json._id;

    res.send(json);
});
