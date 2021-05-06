import { Request, Response } from 'express';

import { groups, IUser } from './database';
import { jwtRead, JWTData } from './security';

export async function getUser(group: number, user: number) {
    const res = await groups.aggregate([
        { $unwind: '$users' },
        { $match: { group_id: group, 'users.user_id': user } },
        {
            $project: {
                _id: 0,
                id: '$users.user_id',
                username: '$users.username',
                is_group_admin: '$users.is_group_admin',
            },
        },
    ]);
    return res[0] as IUser;
}

export function genId(base: number) {
    return Math.floor((Math.random() + base) * 1000000) + 1;
}

export function checkToken(req: Request, res: Response) {
    const token = req.headers.authorization as string;

    if (token == null) {
        res.status(401);
        res.send({ error: 'no token specified' });
        return null;
    }
    const tokenData = jwtRead(token);
    if (tokenData == null) {
        res.status(401);
        res.send({ error: 'incorrect token' });
        return null;
    }

    return tokenData;
}

export async function checkUser(res: Response, tokenData: JWTData) {
    const user = await getUser(tokenData.group, tokenData.user);

    if (user == null) {
        res.status(403);
        res.send({ error: 'this users was deleted or banned' });
        return;
    }

    return user;
}

export async function checkUserAdmin(res: Response, tokenData: JWTData) {
    const user = await checkUser(res, tokenData);

    if (user == null || !user.is_group_admin) {
        res.status(403);
        res.send({ error: "only group's admin can use it" });
        return;
    }

    return user;
}
