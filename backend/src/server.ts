import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import plansRouter from './routes/plans';
import schedulesRouter from './routes/schedules';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use('/api/plans', plansRouter);
app.use('/api/plans/:planId/schedules', schedulesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
