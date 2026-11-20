import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { readingSchema, idParamSchema, listQuerySchema } from './schemas.js';
import * as controller from './controller.js';

export const readingsRouter = Router();

readingsRouter.use(requireAuth); // every route below needs a logged-in user

readingsRouter.get('/', validate(listQuerySchema, 'query'), asyncHandler(controller.list));
readingsRouter.post('/', validate(readingSchema), asyncHandler(controller.create));
readingsRouter.get('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.getOne));
readingsRouter.put('/:id', validate(idParamSchema, 'params'), validate(readingSchema), asyncHandler(controller.update));
readingsRouter.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.remove));
