import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config/index.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/routes.js';
import { readingsRouter } from './modules/readings/routes.js';
import { reportsRouter } from './modules/reports/routes.js';
import { patientsRouter } from './modules/patients/routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }));
  if (config.NODE_ENV !== 'test') app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '10kb' })); // readings are tiny; keep the cap small
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api', apiLimiter);
  app.use('/api/auth', authRouter);
  app.use('/api/readings', readingsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/patients', patientsRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
