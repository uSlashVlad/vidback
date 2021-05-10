import { Router } from 'express';

import { upload } from '../../fs';
import { groups, IGroup } from '../../database';
import { sha512, sha256, jwtSign } from '../../security';
import { genId, checkToken, checkUserAdmin } from '../../auth';

export const router = Router();

router.post('/create', upload.none(), async (req, res) => {
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

    body.group_id = genId('1');
    body.password = sha512(body.password);
    body.admin_code = sha256(body.admin_code);

    const newGroup = await groups.create(body);
    const json = newGroup.toJSON();
    delete json.__v;
    delete json._id;
    delete json.password;
    delete json.admin_code;

    res.send(json);
});

interface ILoginData {
    groupname: string;
    password: string;
    username: string;
    admin_code?: string;
}

router.post('/login', upload.none(), async (req, res) => {
    const body: ILoginData = req.body;
    if (
        body.groupname == null ||
        body.password == null ||
        body.username == null
    ) {
        res.status(400);
        res.send({ error: 'not enought data' });
        return;
    }

    const thisGroup = await groups.findOne({ short_name: body.groupname });
    if (thisGroup == null) {
        res.status(400);
        res.send({ error: 'no such group' });
        return;
    }

    if (sha512(body.password) != thisGroup.password) {
        res.status(400);
        res.send({ error: 'incorrect group password' });
        return;
    }

    if (
        body.admin_code != null &&
        sha256(body.admin_code) != thisGroup.admin_code
    ) {
        res.status(400);
        res.send({ error: 'incorrect admin code' });
        return;
    }

    let id = genId('2');

    thisGroup.users.push({
        user_id: id,
        username: body.username,
        is_group_admin: body.admin_code != null,
    });
    await thisGroup.save();

    res.send({ token: jwtSign({ user: id, group: thisGroup.group_id }) });
});

router.get('/users', async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUserAdmin(res, tokenData);
    if (user == null) return;

    const thisGroup = await groups.findOne(
        { group_id: tokenData.group },
        { 'users._id': 0 }
    );
    if (thisGroup == null) {
        res.status(400);
        res.send({ error: 'no such group' });
        return;
    }

    res.send(thisGroup.users);
});

router.delete('/users/:userId', async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUserAdmin(res, tokenData);
    if (user == null) return;

    const userId = req.params.userId;
    if (userId == null) {
        res.status(400);
        res.send({ error: 'no subject id specified' });
        return;
    }

    const thisGroup = await groups.findOne({ group_id: tokenData.group });
    if (thisGroup == null) {
        res.status(400);
        res.send({ error: 'no such group' });
        return;
    }

    const updRes = await groups.updateOne(
        { group_id: tokenData.group },
        { $pull: { users: { user_id: userId } } }
    );
    if (updRes.n == 0) {
        res.status(400);
        res.send({ error: 'no such user found' });
        return;
    }

    res.send({});
});

router.delete('/this', async (req, res) => {
    const tokenData = checkToken(req, res);
    if (tokenData == null) return;
    const user = await checkUserAdmin(res, tokenData);
    if (user == null) return;

    const delRes = await groups.deleteOne({ group_id: tokenData.group });
    if (delRes.deletedCount == 0) {
        res.status(400);
        res.send({ error: 'no such group found?' });
        return;
    }

    res.send({});
});
