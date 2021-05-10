import { Router } from 'express';

import { upload } from '../../fs';
import { subjects, ILesson } from '../../database';
import { genId, checkToken, checkUserAdmin, checkUser } from '../../auth';

// For mount point /:subjectId/lessons
export const idRouter = Router({ mergeParams: true });
// For mount point /lessons
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
        res.send({ error: 'no subject id specified' });
        return;
    }

    const thisSubject = await subjects.findOne(
        {
            group_id: tokenData.group,
            subject_id: subjectId,
        },
        { 'lessons._id': 0 }
    );
    if (thisSubject == null) {
        res.status(400);
        res.send({ error: 'no such subject exists' });
        return;
    }

    res.send(thisSubject.lessons);
});

idRouter.post('/', upload.none(), async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUserAdmin(res, tokenData);
    if (user == null) return;

    const subjectId = req.params.subjectId;
    if (subjectId == null) {
        res.status(400);
        res.send({ error: 'no subject id specified' });
        return;
    }

    const body: ILesson = req.body;
    if (typeof body.weeks == 'string') body.weeks = JSON.parse(body.weeks);
    if (typeof body.day == 'string') body.day = +body.day;
    if (typeof body.num == 'string') body.num = +body.num;
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

    let okWeeks = true,
        okDay = true,
        okNum = true,
        okType = true;
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
        res.send({ error: 'incorrect data' }); // TODO maybe some advanced fields errors
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

    body.lesson_id = genId('5');

    data.lessons.push(body);
    await data.save();

    res.send(body);
});

idRouter.delete('/:lessonId', async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUserAdmin(res, tokenData);
    if (user == null) return;

    const subjectId = req.params.subjectId;
    if (subjectId == null) {
        res.status(400);
        res.send({ error: 'no subject id specified' });
        return;
    }

    const lessonId = req.params.lessonId;
    if (lessonId == null) {
        res.status(400);
        res.send({ error: 'no lesson id specified' });
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

idRouter.put('/:lessonId', upload.none(), async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUserAdmin(res, tokenData);
    if (user == null) return;

    const subjectId = req.params.subjectId;
    if (subjectId == null) {
        res.status(400);
        res.send({ error: 'no subject id specified' });
        return;
    }

    const lessonId = req.params.lessonId;
    if (lessonId == null) {
        res.status(400);
        res.send({ error: 'no lesson id specified' });
        return;
    }

    const body: ILesson = req.body;
    if (body.weeks != null && typeof body.weeks == 'string')
        body.weeks = JSON.parse(body.weeks);
    if (body.day != null && typeof body.day == 'string') body.day = +body.day;
    if (body.num != null && typeof body.num == 'string') body.num = +body.num;
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

    if (!okWeeks || !okDay || !okNum || !okType) {
        res.status(400);
        res.send({ error: `incorrect data` }); // TODO maybe some advanced fields errors
        return;
    }

    const thisSubject = await subjects.findOne(
        {
            group_id: tokenData.group,
            subject_id: subjectId,
            'lessons.lesson_id': lessonId,
        },
        { 'lessons._id': 0 }
    );
    if (thisSubject == null) {
        res.status(400);
        res.send({ error: 'no such lesson exists' });
        return;
    }

    const l = thisSubject.lessons;
    let result: ILesson;
    for (let i = 0; i < l.length; i++) {
        if (l[i].lesson_id == lessonId) {
            if (body.weeks != null) l[i].weeks = body.weeks;
            if (body.day != null) l[i].day = body.day;
            if (body.num != null) l[i].num = body.num;
            if (body.type != null) l[i].type = body.type;
            result = l[i];
            break;
        }
    }
    await thisSubject.save();

    res.send(result);
});

// For getting lessons for specified week (and day)
allRouter.get('/', async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUser(res, tokenData);
    if (user == null) return;

    const weekNumber = +req.query.week;
    if (weekNumber == null || isNaN(weekNumber)) {
        res.status(400);
        res.send({ error: 'no week number specified' });
        return;
    }

    const dayNumber = +req.query.day;
    if (dayNumber == null || isNaN(dayNumber)) {
        res.send(
            await subjects.find(
                {
                    group_id: tokenData.group,
                    'lessons.weeks': { $in: [weekNumber] },
                },
                { _id: 0, __v: 0, 'lessons._id': 0, homeworks: 0 }
            )
        );
        return;
    }

    res.send(
        await subjects.find(
            {
                group_id: tokenData.group,
                'lessons.weeks': { $in: [weekNumber] },
                'lessons.day': dayNumber,
            },
            { _id: 0, __v: 0, 'lessons._id': 0, homeworks: 0 }
        )
    );
});
