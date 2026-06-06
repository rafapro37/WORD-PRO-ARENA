
import React from 'react';
import { MarketPlayer } from '../types';

interface PlayerCardProps {
  player: MarketPlayer;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  return (
    <div className="bg-brand-surface p-4 rounded-xl border border-brand-border flex flex-col items-center">
      <img src={player.photoUrl} alt={player.name} className="w-20 h-20 rounded-full object-cover mb-4" />
      <h3 className="text-lg font-bold text-white">{player.name}</h3>
      <p className="text-sm text-brand-textMuted">{player.position} - Overall: {player.overall}</p>
      <p className="text-sm text-brand-textMuted">Clube: {player.timeAtual}</p>
      <p className="text-sm font-bold text-brand-primary mt-2">Valor: {player.valorTransferencia}</p>
    </div>
  );
};

export default PlayerCard;
