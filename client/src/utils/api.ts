import type { Game, RecommendationResult, GameStatus } from '../types';

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// ── Games ─────────────────────────────────────────────
export async function fetchAllGames(): Promise<Game[]> {
  const res = await fetch(`${BASE}/games`);
  if (!res.ok) throw new Error('Failed to fetch games');
  return res.json();
}

export async function fetchRecommendations(
  likedIds: string[],
  dislikedIds: string[] = [],
  completedIds: string[] = []
): Promise<RecommendationResult[]> {
  const res = await fetch(`${BASE}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ likedIds, dislikedIds, completedIds, limit: 8 }),
  });
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
}

export function getSteamImageUrl(steamId: number | null): string {
  if (!steamId) return '';
  return `https://cdn.akamai.steamstatic.com/steam/apps/${steamId}/header.jpg`;
}

// ── User statuses (requires auth) ───────────────────
export async function fetchStatuses(): Promise<Record<string, GameStatus>> {
  const res = await fetch(`${BASE}/statuses`, { credentials: 'include' });
  if (!res.ok) return {};
  return res.json();
}

export async function saveStatus(gameId: string, status: GameStatus): Promise<void> {
  await fetch(`${BASE}/statuses`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId, status }),
  });
}

export async function clearAllStatuses(): Promise<void> {
  await fetch(`${BASE}/statuses`, {
    method: 'DELETE',
    credentials: 'include',
  });
}
