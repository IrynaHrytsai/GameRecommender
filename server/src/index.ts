import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        image TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "session" (
        id TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS "account" (
        id TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        scope TEXT,
        password TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "verification" (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS game_statuses (
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        game_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('liked', 'disliked', 'completed', 'none')),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, game_id)
      );
      CREATE INDEX IF NOT EXISTS idx_game_statuses_user ON game_statuses(user_id);
    `);
    console.log('✅ Migrations complete');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function startServer() {
  // Run migrations first
  await runMigrations();

  // Only import auth AFTER migrations run
  const { auth } = await import('./lib/auth.js');
  const { games } = await import('./data/games.js');
  const { getRecommendations } = await import('./routes/recommendations.js');
  const { default: statusesRouter } = await import('./routes/statuses.js');

  const app = express();
  const PORT = process.env.PORT || 3001;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  }));

  app.all('/api/auth/*', toNodeHandler(auth));
  app.use(express.json());

  app.get('/api/games', (_req, res) => res.json(games));

  app.get('/api/games/:id', (req, res) => {
    const game = games.find(g => g.id === req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    return res.json(game);
  });

  app.post('/api/recommendations', (req, res) => {
    const { likedIds = [], dislikedIds = [], completedIds = [], limit = 8 } = req.body;
    if (!Array.isArray(likedIds)) return res.status(400).json({ error: 'likedIds must be an array' });
    return res.json(getRecommendations(likedIds, dislikedIds, completedIds, limit));
  });

  app.use('/api/statuses', statusesRouter);

  app.listen(PORT, () => {
    console.log(`🎮 Game Picks API → http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
