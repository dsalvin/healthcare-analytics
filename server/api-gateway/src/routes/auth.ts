// src/routes/auth.ts
import express, { Request, Response, Router } from 'express';

const router: Router = express.Router();

router.post('/login', (req, res) => {
  // TODO: Implement login
  res.status(501).json({ message: 'Not implemented' });
});

export default router;