import { connect, connection, Schema, model, Document } from 'mongoose';

import * as config from '../config.json';

connect(config.mongodb, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = connection;
db.on('error', (err) => console.log(`Connection error: ${err.message}`));
db.once('open', () => console.log('Connected to DB!'));

// ----------------------------
// -- Data models for groups --
// ----------------------------
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
    created_at: Date,
});

export interface IGroup {
    group_id: number;
    name: string;
    short_name: string;
    password: string;
    admin_code: string;
    users: IUser[];
    created_at: Date;
}

interface IGroupDocument extends IGroup, Document {}

export const groups = model<IGroupDocument>('Group', groupSchema, 'groups');

// ---------------------------
// -- Data models for links --
// ---------------------------
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

// ------------------------------
// -- Data models for subjects --
// ------------------------------
const lessonSchema = new Schema({
    lesson_id: Number,
    weeks: [Number], // Week numbers, [1-17]
    day: Number, // Day number in week, 1-6
    num: Number, // Lesson number in day, 1-7
    type: String, // Lesson type, sem/lec/lab
});

export interface ILesson {
    lesson_id: number;
    weeks: number[];
    day: number;
    num: number;
    type: string;
}

const homeworkSchema = new Schema({
    homework_id: Number,
    week: Number,
    day: Number,
    text: String,
    files: [String],
});

export interface IHomework {
    homework_id: number;
    week: number;
    day: number;
    text: string;
    files: string[];
}

const subjectSchema = new Schema({
    subject_id: Number,
    group_id: Number,
    name: String,
    lessons: [lessonSchema],
    homeworks: [homeworkSchema],
});

export interface ISubject {
    subject_id: number;
    group_id: number;
    name: string;
    lessons: ILesson[];
    homeworks: IHomework[];
}

interface ISubjectDocument extends ISubject, Document {}

export const subjects = model<ISubjectDocument>(
    'Subject',
    subjectSchema,
    'subjects'
);
