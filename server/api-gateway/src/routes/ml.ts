// src/routes/ml.ts
import express, { Request, Response, Router } from 'express';

const router: Router = express.Router();

router.post('/predict', (req, res) => {
  // TODO: Implement ML predictions
  res.status(501).json({ message: 'Not implemented' });
});

export default router;