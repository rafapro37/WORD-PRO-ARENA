import { Tournament, Team, Match, Player } from '../types';

const STORAGE_KEY = 'campeonato';

export const loadCampeonato = (): { tournaments: Tournament[], teams: Team[], matches: Match[], players: Player[] } => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse campeonato from localStorage", e);
    }
  }
  return { tournaments: [], teams: [], matches: [], players: [] };
};

export const saveCampeonato = (campeonato: { tournaments: Tournament[], teams: Team[], matches: Match[], players: Player[] }) => {
  if (campeonato) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campeonato));
  }
};
