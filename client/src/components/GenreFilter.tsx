import React from 'react';

const ALL_GENRES = [
  'All',
  'Souls-like',
  'Action RPG',
  'Open World',
  'RPG',
  'FPS',
  'Action',
  'Metroidvania',
  'Roguelite',
  'Survival Horror',
  'Survival',
  'Strategy',
  'Platformer',
  'Adventure',
  'Exploration',
  'Sci-Fi',
  'Sandbox',
  'Puzzle',
  'Simulation',
  'Mystery',
];

interface Props {
  activeGenre: string;
  onChange: (genre: string) => void;
}

export const GenreFilter: React.FC<Props> = ({ activeGenre, onChange }) => {
  return (
    <div className="genre-strip">
      {ALL_GENRES.map(g => (
        <button
          key={g}
          className={`genre-chip ${activeGenre === g ? 'active' : ''}`}
          onClick={() => onChange(g)}
        >
          {g}
        </button>
      ))}
    </div>
  );
};
