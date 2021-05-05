import { Router } from 'express';

import { subjects, ILesson } from '../database';
import { genId, checkToken, checkUserAdmin } from '../auth';

export const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
    const tokenData = checkToken(req, res);
    await checkUserAdmin(res, tokenData);

    const subjectId = +req.params.subjectId;
    if (subjectId == null || isNaN(subjectId)) {
        res.status(400);
        res.send({ error: 'no subject id specified or it is not number' });
        return;
    }

    const thisSubject = await subjects.findOne({
        group_id: tokenData.group,
        subject_id: subjectId,
    });
    if (thisSubject == null) {
        res.status(400);
        res.send({ error: 'no such subject exists' });
        return;
    }

    res.send(thisSubject.lessons);
});

router.post('/', async (req, res) => {
    const tokenData = checkToken(req, res);
    await checkUserAdmin(res, tokenData);

    const subjectId = +req.params.subjectId;
    if (subjectId == null || isNaN(subjectId)) {
        res.status(400);
        res.send({ error: 'no subject id specified or it is not number' });
        return;
    }

    const body: ILesson = req.body;
    if (
        body.weeks == null ||
        body.day == null ||
        body.num == null ||
        body.type == null
    ) {
        res.status(400);
        res.send({ error: 'not enought data' });
        return;
    }

    let okWeeks: boolean = true,
        okDay: boolean = true,
        okNum: boolean = true,
        okType: boolean = true;
    if (body.weeks.length == 0) okWeeks = false;
    if (okWeeks) {
        for (let i = 0; i < body.weeks.length; i++) {
            if (body.weeks[i] <= 0) {
                okWeeks = false;
                break;
            }
        }
    }
    if (body.day < 1 || body.day > 7) okDay = false;
    if (body.num < 1) okNum = false;
    if (
        body.type != 'sem' &&
        body.type != 'lec' &&
        body.type != 'lab' &&
        body.type != 'other'
    )
        okType = false;

    if (!okWeeks || !okDay || !okNum || !okType) {
        res.status(400);
        res.send({ error: `incorrect data` }); // TODO maybe some advanced fields errors
        return;
    }

    const data = await subjects.findOne({
        group_id: tokenData.group,
        subject_id: subjectId,
    });
    if (data == null) {
        res.status(400);
        res.send({ error: 'no such subject found' });
        return;
    }

    body.lesson_id = genId(5);
    while (
        (await subjects.findOne({
            group_id: tokenData.group,
            subject_id: subjectId,
            'lessons.lesson_id': body.lesson_id,
        })) != null
    )
        body.lesson_id = genId(5);

    data.lessons.push(body);
    await data.save();

    res.send(body);
});

router.delete('/:lessonId', async (req, res) => {
    const tokenData = checkToken(req, res);
    await checkUserAdmin(res, tokenData);

    const subjectId = +req.params.subjectId;
    if (subjectId == null || isNaN(subjectId)) {
        res.status(400);
        res.send({ error: 'no subject id specified or it is not number' });
        return;
    }

    const lessonId = +req.params.lessonId;
    if (lessonId == null || isNaN(subjectId)) {
        res.status(400);
        res.send({ error: 'no lesson id specified or it is not number' });
        return;
    }

    const thisSubject = await subjects.findOne({
        group_id: tokenData.group,
        subject_id: subjectId,
        'lessons.lesson_id': lessonId,
    });
    if (thisSubject == null) {
        res.status(400);
        res.send({ error: 'no such lesson exists' });
        return;
    }

    const l = thisSubject.lessons;
    for (let i = 0; i < l.length; i++) {
        if (l[i].lesson_id == lessonId) {
            l.splice(i, 1);
            break;
        }
    }
    await thisSubject.save();

    res.send({});
});

router.put('/:lessonId', async (req, res) => {
    const tokenData = checkToken(req, res);
    await checkUserAdmin(res, tokenData);

    const subjectId = +req.params.subjectId;
    if (subjectId == null || isNaN(subjectId)) {
        res.status(400);
        res.send({ error: 'no subject id specified or it is not number' });
        return;
    }

    const lessonId = +req.params.lessonId;
    if (lessonId == null || isNaN(subjectId)) {
        res.status(400);
        res.send({ error: 'no lesson id specified or it is not number' });
        return;
    }

    const body: ILesson = req.body;
    if (
        body.weeks == null &&
        body.day == null &&
        body.num == null &&
        body.type == null
    ) {
        res.status(400);
        res.send({ error: 'not enought data' });
        return;
    }

    let okWeeks: boolean = true,
        okDay: boolean = true,
        okNum: boolean = true,
        okType: boolean = true;
    if (body.weeks != null) {
        if (body.weeks.length == 0) okWeeks = false;
        if (okWeeks) {
            for (let i = 0; i < body.weeks.length; i++) {
                if (body.weeks[i] <= 0) {
                    okWeeks = false;
                    break;
                }
            }
        }
    }
    if (body.day != null && (body.day < 1 || body.day > 7)) okDay = false;
    if (body.num != null && body.num < 1) okNum = false;
    if (
        body.type != null &&
        body.type != 'sem' &&
        body.type != 'lec' &&
        body.type != 'lab' &&
        body.type != 'other'
    )
        okType = false;

    if (!okWeeks && !okDay && !okNum && !okType) {
        res.status(400);
        res.send({ error: `incorrect data` }); // TODO maybe some advanced fields errors
        return;
    }

    const thisSubject = await subjects.findOne({
        group_id: tokenData.group,
        subject_id: subjectId,
        'lessons.lesson_id': lessonId,
    });
    if (thisSubject == null) {
        res.status(400);
        res.send({ error: 'no such lesson exists' });
        return;
    }

    const l = thisSubject.lessons;
    for (let i = 0; i < l.length; i++) {
        if (l[i].lesson_id == lessonId) {
            if (body.weeks != null) l[i].weeks = body.weeks;
            if (body.day != null) l[i].day = body.day;
            if (body.num != null) l[i].num = body.num;
            if (body.type != null) l[i].type = body.type;
            break;
        }
    }
    await thisSubject.save();

    const json = thisSubject.toJSON();
    delete json._id;
    delete json.__v;

    res.send(json);
});
