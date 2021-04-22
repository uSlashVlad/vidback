import { Router } from 'express';

import { subjects } from '../database';
import { jwtRead } from '../security';
import { genId, getUser } from '../auth';

export const router = Router();

router.get('/', async (req, res) => {
    const token = req.headers.authorization as string;
    if (token == null) {
        res.status(400);
        res.send({ error: 'no token specified' });
        return;
    }
    const tokenData = jwtRead(token);
    if (tokenData == null) {
        res.status(400);
        res.send({ error: 'incorrect token' });
        return;
    }
    const user = await getUser(tokenData.group, tokenData.user);
    if (user == null) {
        res.status(403);
        res.send({ error: 'this users was deleted or banned' });
        return;
    }

    const data = await subjects.find(
        { group_id: tokenData.group },
        { _id: 0, __v: 0, lessons: 0, homeworks: 0 }
    );
    res.send({ items: data, count: data.length });
});

router.get('/:id', async (req, res) => {
    const token = req.headers.authorization as string;
    if (token == null) {
        res.status(400);
        res.send({ error: 'no token specified' });
        return;
    }
    const tokenData = jwtRead(token);
    if (tokenData == null) {
        res.status(400);
        res.send({ error: 'incorrect token' });
        return;
    }
    const user = await getUser(tokenData.group, tokenData.user);
    if (user == null) {
        res.status(403);
        res.send({ error: 'this users was deleted or banned' });
        return;
    }
    const subjectId = +req.params.id;
    if (subjectId == null || isNaN(subjectId)) {
        res.status(400);
        res.send({ error: 'no subject_id specified or it is not number' });
        return;
    }

    res.send(
        await subjects.find(
            { group_id: tokenData.group, subject_id: subjectId },
            { _id: 0, __v: 0 }
        )
    );
});

router.post('/', async (req, res) => {
    const token = req.headers.authorization as string;
    if (token == null) {
        res.status(400);
        res.send({ error: 'no token specified' });
        return;
    }
    const tokenData = jwtRead(token);
    if (tokenData == null) {
        res.status(400);
        res.send({ error: 'incorrect token' });
        return;
    }
    const user = await getUser(tokenData.group, tokenData.user);
    if (user == null) {
        res.status(403);
        res.send({ error: 'this users was deleted or banned' });
        return;
    }
    if (!user.is_group_admin) {
        res.status(403);
        res.send({ error: "only group's admin can create new subject" });
        return;
    }
    const name: string = req.body.name;
    if (name == null) {
        res.status(400);
        res.send({ error: 'no subject name specified' });
        return;
    }

    let linkId = genId(4);
    while ((await subjects.findOne({ subject_id: linkId })) != null)
        linkId = genId(4);

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
    const token = req.headers.authorization as string;
    if (token == null) {
        res.status(400);
        res.send({ error: 'no token specified' });
        return;
    }
    const tokenData = jwtRead(token);
    if (tokenData == null) {
        res.status(400);
        res.send({ error: 'incorrect token' });
        return;
    }
    const user = await getUser(tokenData.group, tokenData.user);
    if (user == null) {
        res.status(403);
        res.send({ error: 'this users was deleted or banned' });
        return;
    }
    if (!user.is_group_admin) {
        res.status(403);
        res.send({ error: "only group's admin can create new subject" });
        return;
    }
    const subjectId = +req.params.id;
    if (subjectId == null || isNaN(subjectId)) {
        res.status(400);
        res.send({ error: 'no link_id specified or it is not number' });
        return;
    }

    const thisSubject = await subjects.findOne({ subject_id: subjectId });
    if (thisSubject == null) {
        res.status(400);
        res.send({ error: 'no such subject found' });
        return;
    }

    await thisSubject.delete();

    res.send({});
});

router.put('/:id', async (req, res) => {
    const token = req.headers.authorization as string;
    if (token == null) {
        res.status(400);
        res.send({ error: 'no token specified' });
        return;
    }
    const tokenData = jwtRead(token);
    if (tokenData == null) {
        res.status(400);
        res.send({ error: 'incorrect token' });
        return;
    }
    const user = await getUser(tokenData.group, tokenData.user);
    if (user == null) {
        res.status(403);
        res.send({ error: 'this users was deleted or banned' });
        return;
    }
    if (!user.is_group_admin) {
        res.status(403);
        res.send({ error: "only group's admin can create new subject" });
        return;
    }
    const subjectId = +req.params.id;
    if (subjectId == null || isNaN(subjectId)) {
        res.status(400);
        res.send({ error: 'no link_id specified or it is not number' });
        return;
    }
    const name: string = req.body.name;
    if (name == null) {
        res.status(400);
        res.send({ error: 'no changes cpecified' });
        return;
    }

    const thisSubject = await subjects.findOne({ subject_id: subjectId });
    if (thisSubject == null) {
        res.status(400);
        res.send({ error: 'no such subject found' });
        return;
    }

    thisSubject.name = name;
    const data = await thisSubject.save();

    const json = data.toJSON();
    delete json.__v;
    delete json._id;

    res.send(json);
});
