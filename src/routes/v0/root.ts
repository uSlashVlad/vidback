import { Router } from 'express';

import { router as groupsRouter } from './groups';
import { router as linksRouter } from './links';
import { router as subjectsRouter } from './subjects';
import { router as filesRouter } from './files';

export const v0Root = Router();

v0Root.use('/groups', groupsRouter);
v0Root.use('/links', linksRouter);
v0Root.use('/subjects', subjectsRouter);
v0Root.use('/files', filesRouter);
