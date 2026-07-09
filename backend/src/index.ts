import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import importRouter from './routes/import';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  })
);

app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', importRouter);

app.listen(PORT, () => {
  console.log(`GrowEasy Backend running on port ${PORT}`);
});

export default app;
