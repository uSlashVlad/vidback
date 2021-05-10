import { connect, connection, Schema, model, Document } from 'mongoose';

const protocol = process.env.MONGODB_PROTOCOL;
const user = process.env.MONGODB_USER;
const password = process.env.MONGODB_PASSWORD;
const domain = process.env.MONGODB_DOMAIN;
const database = process.env.MONDODB_DATABASE;
const connectionUrl = `${protocol}://${user}:${password}@${domain}/${database}?authSource=admin`;

connect(connectionUrl, {
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
    user: String,
    username: String,
    is_group_admin: Boolean,
});

export interface IUser {
    user_id: string;
    username: string;
    is_group_admin: boolean;
}

const groupSchema = new Schema({
    group_id: String,
    name: String,
    short_name: String,
    password: String,
    admin_code: String,
    users: [userSchema],
    created_at: Date,
});

export interface IGroup {
    group_id: string;
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
    link_id: String,
    group_id: String,
    user_id: String,
    url: String,
    name: String,
});

export interface ILink {
    link_id: string;
    group_id: string;
    user_id: string;
    url: string;
    name: string;
}

interface ILinkDocument extends ILink, Document {}

export const links = model<ILinkDocument>('Link', linkSchema, 'links');

// ------------------------------
// -- Data models for subjects --
// ------------------------------
const lessonSchema = new Schema({
    lesson_id: String,
    weeks: [Number], // Week numbers, [1-17]
    day: Number, // Day number in week, 1-6
    num: Number, // Lesson number in day, 1-7
    type: String, // Lesson type, sem/lec/lab
});

export interface ILesson {
    lesson_id: string;
    weeks: number[];
    day: number;
    num: number;
    type: string;
}

const homeworkSchema = new Schema({
    homework_id: String,
    week: Number,
    day: Number,
    text: String,
    files: [String],
});

export interface IHomework {
    homework_id: string;
    week: number;
    day: number;
    text: string;
    files: string[];
}

const subjectSchema = new Schema({
    subject_id: String,
    group_id: Number,
    name: String,
    lessons: [lessonSchema],
    homeworks: [homeworkSchema],
});

export interface ISubject {
    subject_id: string;
    group_id: string;
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
