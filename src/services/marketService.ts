import { MarketPlayer, Negotiation, MarketSettings, MarketStatus } from '../../types';
import { MARKET_KEY } from '../../constants';

const STORAGE_PLAYERS = 'jogadoresMD3';
const STORAGE_CONFIG = 'mercadoConfig';
const STORAGE_PROPOSTAS = 'propostas';

export const marketService = {
  // --- Lógica Importante ---
  mercadoAberto: (): boolean => {
    const status = localStorage.getItem(MARKET_KEY);
    return status === "aberto";
  },

  // --- Persistência ---
  getConfig: (): MarketSettings => {
    const data = localStorage.getItem(STORAGE_CONFIG);
    return data ? JSON.parse(data) : { tournamentId: 'default', status: MarketStatus.CLOSED };
  },

  setConfig: (config: MarketSettings) => {
    localStorage.setItem(STORAGE_CONFIG, JSON.stringify(config));
  },

  getPlayers: (): MarketPlayer[] => {
    const data = localStorage.getItem(STORAGE_PLAYERS);
    return data ? JSON.parse(data) : [];
  },

  getPropostas: (): Negotiation[] => {
    const data = localStorage.getItem(STORAGE_PROPOSTAS);
    return data ? JSON.parse(data) : [];
  },

  // --- Funcionalidades ---
  enviarProposta: (proposta: Negotiation) => {
    const propostas = marketService.getPropostas();
    propostas.push(proposta);
    localStorage.setItem(STORAGE_PROPOSTAS, JSON.stringify(propostas));
  }
};
