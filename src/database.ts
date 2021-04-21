import { connect, connection, Schema, model, Document } from 'mongoose';

import * as config from '../config.json';

connect(config.mongodb, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = connection;
db.on('error', (err) => console.log(`Connection error: ${err.message}`));
db.once('open', () => console.log('Connected to DB!'));

const userSchema = new Schema({
    user_id: Number,
    username: String,
    is_group_admin: Boolean,
});

export interface IUser {
    user_id: number;
    username: string;
    is_group_admin: boolean;
}

const groupSchema = new Schema({
    group_id: Number,
    name: String,
    short_name: String,
    password: String,
    admin_code: String,
    users: [userSchema],
});

export interface IGroup {
    group_id: number;
    name: string;
    short_name: string;
    password: string;
    admin_code: string;
    users: IUser[];
}

interface IGroupDocument extends IGroup, Document {}

export const groups = model<IGroupDocument>('Group', groupSchema, 'groups');

const linkSchema = new Schema({
    link_id: Number,
    group_id: Number,
    user_id: Number,
    url: String,
    name: String,
});

export interface ILink {
    link_id: number;
    group_id: number;
    user_id: number;
    url: string;
    name: string;
}

interface ILinkDocument extends ILink, Document {}

export const links = model<ILinkDocument>('Link', linkSchema, 'links');
