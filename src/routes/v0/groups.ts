import { Router } from 'express';

import { groups, IGroup } from '../../database';
import { sha512, sha256, jwtSign } from '../../security';
import { genId } from '../../auth';

export const router = Router();

router.post('/create', async (req, res) => {
    const body: IGroup = req.body;
    if (
        body.name == null ||
        body.short_name == null ||
        body.password == null ||
        body.admin_code == null
    ) {
        res.status(400);
        res.send({ error: 'not enought data' });
        return;
    }

    const gr = await groups.findOne({ short_name: body.short_name });
    if (gr != null) {
        res.status(400);
        res.send({ error: 'such group is already exists' });
        return;
    }

    body.group_id = genId(1);
    while ((await groups.findOne({ group_id: body.group_id })) != null)
        body.group_id = genId(1);
    body.password = sha512(body.password);
    body.admin_code = sha256(body.admin_code);

    const newGroup = await groups.create(body);
    const json = newGroup.toJSON();
    delete json.__v;
    delete json._id;

    res.send(json);
});

interface ILoginData {
    groupname: string;
    password: string;
    username: string;
    admin_code?: string;
}

router.post('/login', async (req, res) => {
    const body: ILoginData = req.body;
    console.log(req.body);
    if (
        body.groupname == null ||
        body.password == null ||
        body.username == null
    ) {
        res.status(400);
        res.send({ error: 'not enought data' });
        return;
    }

    const gr = await groups.findOne({ short_name: body.groupname });

    if (gr == null) {
        res.status(400);
        res.send({ error: 'no such group' });
        return;
    }

    if (sha512(body.password) != gr.password) {
        res.status(400);
        res.send({ error: 'incorrect group password' });
        return;
    }

    if (body.admin_code != null && sha256(body.admin_code) != gr.admin_code) {
        res.status(400);
        res.send({ error: 'incorrect admin code' });
        return;
    }

    let id = genId(2);
    while (
        (await groups.findOne({
            short_name: body.groupname,
            'users.user_id': id,
        })) != null
    )
        id = genId(1);

    gr.users.push({
        user_id: id,
        username: body.username,
        is_group_admin: body.admin_code != null,
    });
    await gr.save();

    res.send({ token: jwtSign({ user: id, group: gr.group_id }) });
});
