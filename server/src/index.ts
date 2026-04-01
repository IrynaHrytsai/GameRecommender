import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import dotenv from 'dotenv';
dotenv.config();

import { auth } from './lib/auth.js';
import { games } from './data/games.js';
import { getRecommendations } from './routes/recommendations.js';
import statusesRouter from './routes/statuses.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(helmet({
  contentSecurityPolicy: false, // handled by frontend
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true, // needed for auth cookies
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
}));

// Better Auth handles ALL /api/auth/* routes (OAuth callbacks etc.)
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());

// ── Games ──────────────────────────────────────────────
app.get('/api/games', (_req, res) => {
  res.json(games);
});

app.get('/api/games/:id', (req, res) => {
  const game = games.find(g => g.id === req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  return res.json(game);
});

// ── Recommendations ───────────────────────────────────
app.post('/api/recommendations', (req, res) => {
  const { likedIds = [], dislikedIds = [], completedIds = [], limit = 8 } = req.body;
  if (!Array.isArray(likedIds)) return res.status(400).json({ error: 'likedIds must be an array' });
  return res.json(getRecommendations(likedIds, dislikedIds, completedIds, limit));
});

// ── User statuses (requires auth) ────────────────────
app.use('/api/statuses', statusesRouter);

app.listen(PORT, () => {
  console.log(`🎮 Game Picks API → http://localhost:${PORT}`);
});
