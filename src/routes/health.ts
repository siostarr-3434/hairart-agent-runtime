import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'hairart-agent-runtime',
    version: '1.0.0',
    region: process.env.GCP_REGION || 'europe-west4',
  });
});

healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).send('Hair Art Clinics / Sio Hair Clinic Agent Runtime Active 🚀');
});
