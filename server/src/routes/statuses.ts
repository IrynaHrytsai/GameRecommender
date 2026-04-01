import { Router, Request, Response } from 'express';
import { pool } from '../lib/db.js';
import { auth } from '../lib/auth.js';

const router = Router();

// Helper — get authenticated user from request
async function getUser(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers as any });
  return session?.user ?? null;
}

// GET /api/statuses — return all statuses for current user
router.get('/', async (req: Request, res: Response) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { rows } = await pool.query(
    `SELECT game_id, status FROM game_statuses
     WHERE user_id = $1 AND status != 'none'`,
    [user.id]
  );

  // Return as { gameId: status } map — same shape as frontend useState
  const statusMap: Record<string, string> = {};
  for (const row of rows) statusMap[row.game_id] = row.status;

  return res.json(statusMap);
});

// POST /api/statuses — upsert a single game status
router.post('/', async (req: Request, res: Response) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { gameId, status } = req.body as { gameId: string; status: string };
  const validStatuses = ['liked', 'disliked', 'completed', 'none'];

  if (!gameId || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid gameId or status' });
  }

  if (status === 'none') {
    await pool.query(
      `DELETE FROM game_statuses WHERE user_id = $1 AND game_id = $2`,
      [user.id, gameId]
    );
  } else {
    await pool.query(
      `INSERT INTO game_statuses (user_id, game_id, status, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, game_id)
       DO UPDATE SET status = $3, updated_at = NOW()`,
      [user.id, gameId, status]
    );
  }

  return res.json({ ok: true });
});

// DELETE /api/statuses — clear all statuses for current user
router.delete('/', async (req: Request, res: Response) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  await pool.query(`DELETE FROM game_statuses WHERE user_id = $1`, [user.id]);
  return res.json({ ok: true });
});

export default router;
