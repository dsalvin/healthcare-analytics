// src/routes/health.ts
import express, { Request, Response, Router } from 'express';

const router: Router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'healthy' });
});

export default router;