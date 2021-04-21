import { Router } from 'express';

import { links, ILink } from '../database';
import { jwtRead, JWTData } from '../security';
import { genId, getUser } from '../auth';

export const router = Router();

router.get('/get_all', async (req, res) => {
    const token = req.query.token as string;
    if (token == null) {
        res.status(400);
        res.send({ error: 'no token specified' });
        return;
    }
    const tokenData = jwtRead(token) as JWTData;
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

    res.send(
        await links.find({ group_id: tokenData.group }, { _id: 0, __v: 0 })
    );
});

router.get('/get', async (req, res) => {
    const token = req.query.token as string;
    if (token == null) {
        res.status(400);
        res.send({ error: 'no token specified' });
        return;
    }
    const tokenData = jwtRead(token) as JWTData;
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

    let linkId = +req.query.link_id;
    if (linkId == null || isNaN(linkId)) {
        res.status(400);
        res.send({ error: 'no link_id specified or it is not number' });
        return;
    }

    const thisLink = await links.findOne(
        {
            group_id: tokenData.group,
            link_id: linkId,
        },
        { _id: 0, __v: 0 }
    );
    if (thisLink == null) {
        res.status(400);
        res.send({ error: 'no such link found' });
        return;
    }

    res.send(thisLink);
});

router.post('/create', async (req, res) => {
    const token = req.query.token as string;
    if (token == null) {
        res.status(400);
        res.send({ error: 'no token specified' });
        return;
    }
    const tokenData = jwtRead(token) as JWTData;
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

    const body: ILink = req.body;
    if (body.name == null || body.url == null) {
        res.status(400);
        res.send({ error: 'not enought data' });
        return;
    }

    body.group_id = tokenData.group;
    body.user_id = tokenData.user;
    body.link_id = genId(3);
    while ((await links.find({ link_id: body.link_id })) != null)
        body.link_id = genId(3);

    await links.create(body);

    res.send(body);
});

router.post('/delete', async (req, res) => {
    const token = req.query.token as string;
    if (token == null) {
        res.status(400);
        res.send({ error: 'no token specified' });
        return;
    }
    const tokenData = jwtRead(token) as JWTData;
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

    let linkId = +req.body.link_id;
    if (linkId == null || isNaN(linkId)) {
        res.status(400);
        res.send({ error: 'no link_id specified or it is not number' });
        return;
    }

    const thisLink = await links.findOne({
        group_id: tokenData.group,
        link_id: linkId,
    });
    if (thisLink == null) {
        res.status(400);
        res.send({ error: 'no such link found' });
        return;
    }

    if (!user.is_group_admin && thisLink.user_id != tokenData.user) {
        res.status(403);
        res.send({
            error: "only group admin or link's creator can delete the link",
        });
        return;
    }

    await thisLink.delete();
    res.send({});
});

router.post('/edit', async (req, res) => {
    const token = req.query.token as string;
    if (token == null) {
        res.status(400);
        res.send({ error: 'no token specified' });
        return;
    }
    const tokenData = jwtRead(token) as JWTData;
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

    const body: ILink = req.body;
    if ((body.name == null && body.url == null) || body.link_id == null) {
        res.status(400);
        res.send({ error: 'not enought data' });
        return;
    }

    const thisLink = await links.findOne({
        group_id: tokenData.group,
        link_id: body.link_id,
    });
    if (thisLink == null) {
        res.status(400);
        res.send({ error: 'no such link found' });
        return;
    }

    if (thisLink.user_id != tokenData.user) {
        res.status(403);
        res.send({ error: 'only creator of link can edit it' });
        return;
    }

    if (body.name != null) thisLink.name = body.name;
    if (body.url != null) thisLink.url = body.url;
    await thisLink.save();

    // TODO maybe some optimization?
    body.name = thisLink.name;
    body.url = thisLink.url;
    body.group_id = thisLink.group_id;
    body.user_id = thisLink.user_id;
    body.link_id = thisLink.link_id;
    res.send(body);
});
