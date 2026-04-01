import React, { useState } from 'react';
import type { Game, GameStatus } from '../types';
import { getSteamImageUrl } from '../utils/api';

interface Props {
  game: Game;
  status: GameStatus;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onComplete: (id: string) => void;
  animationIndex?: number;
}

const difficultyConfig: Record<Game['difficulty'], { label: string; cls: string }> = {
  easy:   { label: 'Easy',   cls: 'diff-easy'   },
  medium: { label: 'Medium', cls: 'diff-medium'  },
  hard:   { label: 'Hard',   cls: 'diff-hard'    },
  brutal: { label: 'Brutal', cls: 'diff-brutal'  },
};

export const GameCard: React.FC<Props> = ({
  game, status, onLike, onDislike, onComplete, animationIndex = 0
}) => {
  const [imgError, setImgError] = useState(false);

  const imgSrc = imgError
    ? `https://placehold.co/460x215/141210/2a2820?text=${encodeURIComponent(game.title)}`
    : getSteamImageUrl(game.steamId);

  const diff = difficultyConfig[game.difficulty];
  const isCompleted = status === 'completed';
  const isLiked     = status === 'liked';
  const isDisliked  = status === 'disliked';

  const cardClass = [
    'game-card',
    isLiked      ? 'liked'    : '',
    isDisliked   ? 'disliked' : '',
    isCompleted  ? 'completed': '',
  ].filter(Boolean).join(' ');

  return (
    <article
      className={cardClass}
      style={{ animationDelay: `${animationIndex * 0.05}s` }}
    >
      {isDisliked && (
        <div className="dislike-overlay">
          <span className="dislike-overlay-text">Not interested</span>
          <button
            className="dislike-undo"
            onClick={(e) => { e.stopPropagation(); onDislike(game.id); }}
          >
            Undo
          </button>
        </div>
      )}

      <div className="card-cover">
        <img
          src={imgSrc}
          alt={game.title}
          loading="lazy"
          onError={() => setImgError(true)}
        />
        <div className="card-cover-overlay" />
        <span className={`diff-badge ${diff.cls}`}>{diff.label}</span>
        <span className="rating-badge">★ {game.rating.toFixed(1)}</span>
        {isCompleted && <div className="completed-overlay"><span>✓ Completed</span></div>}
      </div>

      <div className="card-body">
        <h3 className="card-title">{game.title}</h3>
        <div className="card-meta">
          <span>{game.developer}</span>
          <span className="meta-dot">·</span>
          <span>{game.year}</span>
          <span className="meta-dot">·</span>
          <span>{game.playtime}</span>
        </div>
        <p className="card-desc">{game.description}</p>

        <div className="card-genres">
          {game.genres.map(g => (
            <span key={g} className="genre-tag">{g}</span>
          ))}
        </div>

        <div className="card-actions">
          <button
            className={`btn btn-like${isLiked ? ' active' : ''}`}
            onClick={() => onLike(game.id)}
          >
            {isLiked ? '♥ Liked' : '♡ Like'}
          </button>
          <button
            className={`btn btn-complete${isCompleted ? ' active' : ''}`}
            onClick={() => onComplete(game.id)}
            title="Mark as completed"
          >
            {isCompleted ? '✓' : '○'}
          </button>
          <button
            className={`btn btn-skip${isDisliked ? ' active' : ''}`}
            onClick={() => onDislike(game.id)}
            title="Not interested"
          >
            ✕
          </button>
        </div>
      </div>
    </article>
  );
};
