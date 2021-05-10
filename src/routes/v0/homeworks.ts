import { Router } from 'express';

import { upload } from '../../fs';
import { subjects, IHomework } from '../../database';
import { genId, checkToken, checkUserAdmin, checkUser } from '../../auth';

// For mount point /:subjectId/homeworks
export const idRouter = Router({ mergeParams: true });
// For mount point /homeworks
export const allRouter = Router();

// A bit useless because this data available from subject GET /:subjectId
idRouter.get('/', async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUser(res, tokenData);
    if (user == null) return;

    const subjectId = req.params.subjectId;
    if (subjectId == null) {
        res.status(400);
        res.send({ error: 'no subject id specified', code: 3 });
        return;
    }

    const thisSubject = await subjects.findOne(
        {
            group_id: tokenData.group,
            subject_id: subjectId,
        },
        { 'homeworks._id': 0 }
    );
    if (thisSubject == null) {
        res.status(400);
        res.send({ error: 'no such subject exists', code: 6 });
        return;
    }

    res.send(thisSubject.homeworks);
});

idRouter.post('/', upload.none(), async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUserAdmin(res, tokenData);
    if (user == null) return;

    const subjectId = req.params.subjectId;
    if (subjectId == null) {
        res.status(400);
        res.send({ error: 'no subject id specified', code: 3 });
        return;
    }

    const body: IHomework = req.body;
    if (typeof body.files == 'string') body.files = JSON.parse(body.files);
    if (typeof body.week == 'string') body.week = +body.week;
    if (typeof body.day == 'string') body.day = +body.day;
    if (body.week == null || body.day == null) {
        res.status(400);
        res.send({ error: 'not enought data', code: 3 });
        return;
    }

    let okWeek = true,
        okDay = true;
    if (body.week <= 0) okWeek = false;
    if (body.day < 1 || body.day > 7) okDay = false;

    if (!okWeek || !okDay) {
        res.status(400);
        res.send({ error: 'incorrect data', code: 2 });
        return;
    }

    const data = await subjects.findOne({
        group_id: tokenData.group,
        subject_id: subjectId,
    });
    if (data == null) {
        res.status(400);
        res.send({ error: 'no such subject found', code: 6 });
        return;
    }

    body.homework_id = genId('6');

    data.homeworks.push(body);
    await data.save();

    res.send(body);
});

idRouter.delete('/:homeworkId', async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUserAdmin(res, tokenData);
    if (user == null) return;

    const subjectId = req.params.subjectId;
    if (subjectId == null) {
        res.status(400);
        res.send({ error: 'no subject id specified', code: 3 });
        return;
    }

    const homeworkId = req.params.homeworkId;
    if (homeworkId == null) {
        res.status(400);
        res.send({ error: 'no homework id specified', code: 3 });
        return;
    }

    const thisSubject = await subjects.findOne({
        group_id: tokenData.group,
        subject_id: subjectId,
        'homeworks.homework_id': homeworkId,
    });
    if (thisSubject == null) {
        res.status(400);
        res.send({ error: 'no such homework exists', code: 6 });
        return;
    }

    const h = thisSubject.homeworks;
    for (let i = 0; i < h.length; i++) {
        if (h[i].homework_id == homeworkId) {
            h.splice(i, 1);
            break;
        }
    }
    await thisSubject.save();

    res.send({});
});

idRouter.put('/:homeworkId', upload.none(), async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUserAdmin(res, tokenData);
    if (user == null) return;

    const subjectId = req.params.subjectId;
    if (subjectId == null) {
        res.status(400);
        res.send({ error: 'no subject id specified', code: 3 });
        return;
    }

    const homeworkId = req.params.homeworkId;
    if (homeworkId == null) {
        res.status(400);
        res.send({ error: 'no homework id specified', code: 3 });
        return;
    }

    const body: IHomework = req.body;
    if (body.files != null && typeof body.files == 'string')
        body.files = JSON.parse(body.files);
    if (body.week != null && typeof body.week == 'string')
        body.week = +body.week;
    if (body.day != null && typeof body.day == 'string') body.day = +body.day;
    if (
        body.week == null &&
        body.day == null &&
        body.text == null &&
        body.files == null
    ) {
        res.status(400);
        res.send({ error: 'not enought data', code: 3 });
        return;
    }

    let okWeek = true,
        okDay = true;
    if (body.week != null && body.week <= 0) okWeek = false;
    if (body.day && (body.day < 1 || body.day > 7)) okDay = false;

    if (!okWeek || !okDay) {
        res.status(400);
        res.send({ error: 'incorrect data', code: 2 });
        return;
    }

    const thisSubject = await subjects.findOne(
        {
            group_id: tokenData.group,
            subject_id: subjectId,
            'homeworks.homework_id': homeworkId,
        },
        { 'homeworks._id': 0 }
    );
    if (thisSubject == null) {
        res.status(400);
        res.send({ error: 'no such homework exists', code: 6 });
        return;
    }

    const h = thisSubject.homeworks;
    let result: IHomework;
    for (let i = 0; i < h.length; i++) {
        if (h[i].homework_id == homeworkId) {
            if (body.week != null) h[i].week = body.week;
            if (body.day != null) h[i].day = body.day;
            if (body.text != null) h[i].text = body.text;
            if (body.files != null) h[i].files = body.files;
            result = h[i];
            break;
        }
    }
    await thisSubject.save();

    res.send(result);
});

// For getting homeworks for specified week (and day)
allRouter.get('/', async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUser(res, tokenData);
    if (user == null) return;

    const weekNumber = +req.query.week;
    if (weekNumber == null || isNaN(weekNumber)) {
        res.status(400);
        res.send({ error: 'no week number specified', code: 3 });
        return;
    }

    const dayNumber = +req.query.day;
    if (dayNumber == null || isNaN(dayNumber)) {
        res.send(
            await subjects.find(
                {
                    group_id: tokenData.group,
                    'homeworks.week': weekNumber,
                },
                { _id: 0, __v: 0, 'homeworks._id': 0, lessons: 0 }
            )
        );
        return;
    }

    res.send(
        await subjects.find(
            {
                group_id: tokenData.group,
                'homeworks.week': weekNumber,
                'homeworks.day': dayNumber,
            },
            { _id: 0, __v: 0, 'homeworks._id': 0, lessons: 0 }
        )
    );
});
