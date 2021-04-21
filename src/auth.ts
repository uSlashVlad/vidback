import { groups, IUser } from './database';

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
