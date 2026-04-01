import { useCallback, useEffect, useRef, useState } from 'react';
import type { Game, RecommendationResult } from './types';
import { fetchAllGames, fetchRecommendations } from './utils/api';
import { useSession } from './utils/authClient';
import { useStatuses } from './hooks/useStatuses';
import { Header } from './components/Header';
import { GenreFilter } from './components/GenreFilter';
import { GameCard } from './components/GameCard';
import { RecommendationPanel } from './components/RecommendationPanel';

function App() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState('All');
  const [visibleCount, setVisibleCount] = useState(15);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const {
    statuses,
    syncing,
    handleLike,
    handleDislike,
    handleComplete,
    handleRemove,
    handleClearAll,
  } = useStatuses(isAuthenticated);

  useEffect(() => {
    fetchAllGames()
      .then(data => { setGames(data); setLoading(false); })
      .catch(() => {
        setError('Could not reach the server. Make sure the backend is running on port 3001.');
        setLoading(false);
      });
  }, []);

  const likedIds     = Object.entries(statuses).filter(([, s]) => s === 'liked').map(([id]) => id);
  const dislikedIds  = Object.entries(statuses).filter(([, s]) => s === 'disliked').map(([id]) => id);
  const completedIds = Object.entries(statuses).filter(([, s]) => s === 'completed').map(([id]) => id);

  const likedGames     = games.filter(g => likedIds.includes(g.id));
  const completedGames = games.filter(g => completedIds.includes(g.id));

  useEffect(() => {
    if (likedIds.length === 0) { setRecommendations([]); return; }
    setRecLoading(true);
    const timer = setTimeout(() => {
      fetchRecommendations(likedIds, dislikedIds, completedIds)
        .then(recs => { setRecommendations(recs); setRecLoading(false); })
        .catch(() => setRecLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(likedIds), JSON.stringify(dislikedIds), JSON.stringify(completedIds)]);

  const handleScrollToGame = useCallback((id: string) => {
    const game = games.find(g => g.id === id);
    if (game && activeGenre !== 'All') {
      const inFilter =
        game.genres.some(g => g.toLowerCase().includes(activeGenre.toLowerCase())) ||
        (activeGenre === 'Souls-like' && game.tags.includes('souls-like'));
      if (!inFilter) setActiveGenre('All');
    }
    setTimeout(() => {
      const el = cardRefs.current[id];
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight');
      setTimeout(() => el.classList.remove('highlight'), 1600);
    }, 80);
  }, [games, activeGenre]);

  const filteredGames = games.filter(g => {
    if (activeGenre === 'All') return true;
    if (activeGenre === 'Souls-like') return g.tags.includes('souls-like') || g.genres.includes('Souls-like');
    return g.genres.some(genre => genre.toLowerCase().includes(activeGenre.toLowerCase()));
  });

  const visibleGames = filteredGames.slice(0, visibleCount);

  if (loading) return (
    <div className="app">
      <Header totalGames={0} likedCount={0} completedCount={0} />
      <div className="hero">
        <p className="hero-eyebrow">Loading</p>
        <h1 className="hero-title">Waking up the archive…</h1>
      </div>
      <div className="main-content">
        <div className="game-grid">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-cover" />
              <div className="skeleton-body">
                <div className="skeleton-line short" />
                <div className="skeleton-line long" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="app">
      <Header totalGames={0} likedCount={0} completedCount={0} />
      <div className="error-state">
        <span className="error-icon">⚠</span>
        <h2 className="error-title">Connection Failed</h2>
        <p className="error-msg">{error}</p>
        <button className="btn-retry" onClick={() => window.location.reload()}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="app">
      <Header
        totalGames={games.length}
        likedCount={likedIds.length}
        completedCount={completedIds.length}
      />

      <section className="hero">
        <p className="hero-eyebrow">Personal Game Curator</p>
        <h1 className="hero-title">
          Find your next<br />
          <span className="hero-title-accent">favourite game</span>
        </h1>
        <p className="hero-subtitle">
          Like what you enjoy, mark what you've finished — the more you tell us,
          the sharper your recommendations get.
        </p>
        <div className="hero-cta-hint">
          <span className="hero-badge">
            <span className="hero-badge-dot" />
            {games.length} games in the archive
          </span>
          {!isAuthenticated && (
            <span className="hero-badge hero-badge-auth">
              ↑ Sign in to save progress
            </span>
          )}
          {syncing && (
            <span className="hero-badge">⟳ Syncing…</span>
          )}
        </div>
        <div className="hero-divider" />
      </section>

      <div className="main-content">
        <div>
          <GenreFilter
            activeGenre={activeGenre}
            onChange={(g) => { setActiveGenre(g); setVisibleCount(15); }}
          />

          <div className="section-header">
            <span className="section-title">Browse</span>
            <span className="section-count">{filteredGames.length} games</span>
            <div className="section-line" />
          </div>

          <div className="game-grid">
            {visibleGames.map((game, i) => (
              <div key={game.id} ref={el => { cardRefs.current[game.id] = el; }}>
                <GameCard
                  game={game}
                  status={statuses[game.id] ?? 'none'}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onComplete={handleComplete}
                  animationIndex={i}
                />
              </div>
            ))}
          </div>

          {visibleCount < filteredGames.length && (
            <div className="load-more-wrap">
              <button className="load-more-btn" onClick={() => setVisibleCount(v => v + 15)}>
                Show more ↓
              </button>
            </div>
          )}
        </div>

        <aside className="sidebar">
          <RecommendationPanel
            recommendations={recommendations}
            likedGames={likedGames}
            completedGames={completedGames}
            isLoading={recLoading}
            onRemoveLike={handleRemove}
            onRemoveCompleted={handleRemove}
            onClearAll={handleClearAll}
            onScrollToGame={handleScrollToGame}
          />
        </aside>
      </div>
    </div>
  );
}

export default App;
