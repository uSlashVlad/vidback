import { Router } from 'express';

import { subjects } from '../../database';
import { genId } from '../../auth';

export const router = Router({ mergeParams: true });
