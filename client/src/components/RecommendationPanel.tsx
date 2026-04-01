import React, { useState } from 'react';
import type { RecommendationResult, Game } from '../types';
import { getSteamImageUrl } from '../utils/api';

interface Props {
  recommendations: RecommendationResult[];
  likedGames: Game[];
  completedGames: Game[];
  isLoading: boolean;
  onRemoveLike: (id: string) => void;
  onRemoveCompleted: (id: string) => void;
  onClearAll: () => void;
  onScrollToGame: (id: string) => void;
}

const RecThumb: React.FC<{ game: Game }> = ({ game }) => {
  const [err, setErr] = useState(false);
  return (
    <div className="rec-thumb">
      <img
        src={err
          ? `https://placehold.co/80x45/1c1a16/3a3630?text=?`
          : getSteamImageUrl(game.steamId)
        }
        alt={game.title}
        onError={() => setErr(true)}
      />
    </div>
  );
};

export const RecommendationPanel: React.FC<Props> = ({
  recommendations,
  likedGames,
  completedGames,
  isLoading,
  onRemoveLike,
  onRemoveCompleted,
  onClearAll,
  onScrollToGame,
}) => {
  const [showAll, setShowAll] = useState<'liked' | 'completed' | null>(null);
  const maxScore = recommendations[0]?.score ?? 1;
  const totalTracked = likedGames.length + completedGames.length;

  return (
    <div className="rec-panel">
      {/* Header */}
      <div className="rec-header">
        <div className="rec-title">
          <span className="rec-live-dot" />
          For You
        </div>
        <div className="rec-subtitle">
          {likedGames.length === 0 && completedGames.length === 0
            ? 'Rate games to get recommendations'
            : `Based on ${likedGames.length + completedGames.length} rated game${totalTracked !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Recommendations */}
      {isLoading ? (
        <div className="rec-empty">
          <p className="rec-empty-text">Finding matches…</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rec-empty">
          <div className="rec-empty-icon">🎮</div>
          <p className="rec-empty-text">
            Like a game to get personalised picks.
          </p>
        </div>
      ) : (
        <div className="rec-list">
          {recommendations.map((rec, i) => {
            const pct = Math.round((rec.score / maxScore) * 100);
            return (
              <div
                key={rec.game.id}
                className="rec-card"
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => onScrollToGame(rec.game.id)}
              >
                <RecThumb game={rec.game} />
                <div className="rec-info">
                  <div className="rec-card-title">{rec.game.title}</div>
                  <div className="rec-reason">{rec.reason}</div>
                </div>
                <div className="rec-pct">
                  <span>{pct}%</span>
                  <div className="rec-bar">
                    <div className="rec-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Liked games section */}
      {likedGames.length > 0 && (
        <div className="tracked-section">
          <div className="tracked-header">
            <span>Liked <span className="tracked-count">{likedGames.length}</span></span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-text" onClick={() => setShowAll(showAll === 'liked' ? null : 'liked')}>
                {showAll === 'liked' ? 'hide' : 'view all'}
              </button>
              <button className="btn-text danger" onClick={onClearAll}>clear</button>
            </div>
          </div>
          <div className={`tracked-list${showAll === 'liked' ? ' expanded' : ''}`}>
            {likedGames.map(g => (
              <div key={g.id} className="tracked-item" onClick={() => onScrollToGame(g.id)}>
                <span className="tracked-dot liked-dot">♥</span>
                <span className="tracked-name">{g.title}</span>
                <button className="tracked-remove" onClick={e => { e.stopPropagation(); onRemoveLike(g.id); }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed games section */}
      {completedGames.length > 0 && (
        <div className="tracked-section">
          <div className="tracked-header">
            <span>Completed <span className="tracked-count">{completedGames.length}</span></span>
            <button className="btn-text" onClick={() => setShowAll(showAll === 'completed' ? null : 'completed')}>
              {showAll === 'completed' ? 'hide' : 'view all'}
            </button>
          </div>
          <div className={`tracked-list${showAll === 'completed' ? ' expanded' : ''}`}>
            {completedGames.map(g => (
              <div key={g.id} className="tracked-item" onClick={() => onScrollToGame(g.id)}>
                <span className="tracked-dot done-dot">✓</span>
                <span className="tracked-name">{g.title}</span>
                <button className="tracked-remove" onClick={e => { e.stopPropagation(); onRemoveCompleted(g.id); }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
