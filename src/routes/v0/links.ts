import { Router } from 'express';

import { upload } from '../../fs';
import { links, ILink } from '../../database';
import { genId, checkToken, checkUser } from '../../auth';

export const router = Router();

router.get('/', async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUser(res, tokenData);
    if (user == null) return;

    const data = await links.find(
        { group_id: tokenData.group },
        { _id: 0, __v: 0 }
    );
    res.send({ items: data, count: data.length });
});

router.get('/:id', async (req, res) => {
    const tokenData = checkToken(req, res);
    await checkUser(res, tokenData);

    const linkId = req.params.id;
    if (linkId == null) {
        res.status(400);
        res.send({ error: 'no link_id specified', code: 3 });
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
        res.send({ error: 'no such link found', code: 6 });
        return;
    }

    res.send(thisLink);
});

router.post('/', upload.none(), async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUser(res, tokenData);
    if (user == null) return;

    const body: ILink = req.body;
    if (body.name == null || body.url == null) {
        res.status(400);
        res.send({ error: 'not enought data', code: 3 });
        return;
    }

    body.group_id = tokenData.group;
    body.user_id = tokenData.user;
    body.link_id = genId('3');

    await links.create(body);

    res.send(body);
});

router.delete('/:id', async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUser(res, tokenData);
    if (user == null) return;

    const linkId = req.params.id;
    if (linkId == null) {
        res.status(400);
        res.send({ error: 'no link_id specified', code: 3 });
        return;
    }

    const thisLink = await links.findOne({
        group_id: tokenData.group,
        link_id: linkId,
    });
    if (thisLink == null) {
        res.status(400);
        res.send({ error: 'no such link found', code: 6 });
        return;
    }

    if (!user.is_group_admin && thisLink.user_id != tokenData.user) {
        res.status(403);
        res.send({
            error: "only group admin or link's creator can delete the link",
            code: 5,
        });
        return;
    }

    await thisLink.delete();
    res.send({});
});

router.put('/:id', upload.none(), async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUser(res, tokenData);
    if (user == null) return;

    const body: ILink = req.body;
    if (body.name == null && body.url == null) {
        res.status(400);
        res.send({ error: 'no changes specified', code: 3 });
        return;
    }

    const linkId = req.params.id;
    if (linkId == null) {
        res.status(400);
        res.send({ error: 'no link_id specified', code: 3 });
        return;
    }

    const thisLink = await links.findOne({
        group_id: tokenData.group,
        link_id: linkId,
    });
    if (thisLink == null) {
        res.status(400);
        res.send({ error: 'no such link found', code: 6 });
        return;
    }

    if (thisLink.user_id != tokenData.user) {
        res.status(403);
        res.send({ error: 'only creator of link can edit it', code: 5 });
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
