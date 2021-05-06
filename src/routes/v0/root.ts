import { Router } from 'express';

import { router as groupsRouter } from './groups';
import { router as linksRouter } from './links';
import { router as subjectsRouterV0 } from './subjects';

export const v0Root = Router();

v0Root.use('/groups', groupsRouter);
v0Root.use('/links', linksRouter);
v0Root.use('/subjects', subjectsRouterV0);
