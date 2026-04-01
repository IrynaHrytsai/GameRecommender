import React from 'react';
import { AuthButton } from './AuthButton';

interface Props {
  totalGames: number;
  likedCount: number;
  completedCount: number;
}

export const Header: React.FC<Props> = ({ totalGames, likedCount, completedCount }) => {
  return (
    <header className="header">
      <span className="header-title">Game Picks</span>
      <div className="header-stats">
        <div className="stat-pill">{totalGames} games</div>
        {likedCount > 0 && (
          <div className="stat-pill liked">♥ {likedCount} liked</div>
        )}
        {completedCount > 0 && (
          <div className="stat-pill completed-pill">✓ {completedCount} done</div>
        )}
      </div>
      <AuthButton />
    </header>
  );
};
