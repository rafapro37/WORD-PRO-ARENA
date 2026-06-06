/**
 * PRO WORLD ARENA — Roteamento com React Router v6
 *
 * Estratégia: React Router gerencia a URL real.
 * O AppContext continua gerenciando currentPage internamente
 * para compatibilidade com toda a lógica existente.
 * A ponte entre os dois é feita aqui — o Router lê a URL e
 * atualiza o AppContext; o AppContext atualiza a URL quando navega.
 */

import React, { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useParams,
  useNavigate,
  useLocation,
  Outlet,
} from 'react-router-dom';
import { LocaleProvider } from '../contexts/LocaleContext';
import { AppProvider, useApp } from '../contexts/AppContext';
import { UserRole } from '../../types';

// Importação lazy para performance
const App       = React.lazy(() => import('../../pages/App'));

// ─── Mapa: URL path → currentPage interno ─────────────────────────────────────
export const ROUTE_MAP: Record<string, string> = {
  '/':                     'landing',
  '/login':                'login',
  '/dashboard':            'dashboard',
  '/torneios':             'dashboard',
  '/torneio/:id':          'tournament-details',
  '/criar-campeonato':     'create-tournament',
  '/jogador':              'player-profile',
  '/time':                 'team-dashboard',
  '/estatisticas':         'stats',
  '/mercado':              'market',
  '/convites':             'invitations',
  '/buscar-jogadores':     'find-players',
  '/configuracoes':        'settings',
  '/admin':                'admin-dashboard',
  '/admin/personalizacao': 'admin-personalizacao',
  '/liga/:slug':           'landing',
  '/federacao/:slug':      'federation-public',
};

// ─── Mapa reverso: currentPage → URL ─────────────────────────────────────────
export const PAGE_TO_URL: Record<string, string> = {
  'landing':              '/',
  'login':                '/login',
  'dashboard':            '/dashboard',
  'tournament-details':   '/torneio',   // + /:id
  'create-tournament':    '/criar-campeonato',
  'player-profile':       '/jogador',
  'player-dashboard':     '/jogador',
  'team-dashboard':       '/time',
  'stats':                '/estatisticas',
  'market':               '/mercado',
  'invitations':          '/convites',
  'find-players':         '/buscar-jogadores',
  'settings':             '/configuracoes',
  'organizer-settings':   '/configuracoes',
  'admin-dashboard':      '/admin',
  'admin-personalizacao': '/admin/personalizacao',
  'federation-public':    '/federacao',  // + /:slug
};

// ─── Hook: sincroniza URL → AppContext ────────────────────────────────────────
export function useUrlSync() {
  const { setCurrentPage, setSelectedLeagueId, setSelectedTournamentId, state } = useApp();
  const location = useLocation();
  const params   = useParams<{ id?: string; slug?: string }>();

  useEffect(() => {
    const path = location.pathname;

    // /liga/:slug ou /federacao/:slug
    if (path.startsWith('/liga/') || path.startsWith('/federacao/')) {
      const slug = params.slug || path.split('/')[2];
      const league = state.leagues.find(l => l.slug === slug || l.id === slug);
      if (league) {
        setSelectedLeagueId(league.id);
        setCurrentPage(path.startsWith('/federacao/') ? 'federation-public' : 'landing');
      }
      return;
    }

    // /torneio/:id
    if (path.startsWith('/torneio/') && params.id) {
      setSelectedTournamentId(params.id);
      setCurrentPage('tournament-details');
      return;
    }

    // Demais rotas diretas
    const pageEntry = Object.entries(ROUTE_MAP).find(([route]) => {
      if (route.includes(':')) return false; // dinâmicas já tratadas acima
      return route === path;
    });
    if (pageEntry) setCurrentPage(pageEntry[1]);
  }, [location.pathname, params]);
}

// ─── Hook: sincroniza AppContext → URL ────────────────────────────────────────
export function useNavigateSync() {
  const navigate = useNavigate();
  const { currentPage, selectedTournamentId, selectedLeagueId, state } = useApp();

  useEffect(() => {
    const path = location.pathname;

    if (currentPage === 'tournament-details' && selectedTournamentId) {
      const target = `/torneio/${selectedTournamentId}`;
      if (path !== target) navigate(target, { replace: true });
      return;
    }

    if (currentPage === 'federation-public' && selectedLeagueId) {
      const league = state.leagues.find(l => l.id === selectedLeagueId);
      const slug   = league?.slug || selectedLeagueId;
      const target = `/federacao/${slug}`;
      if (path !== target) navigate(target, { replace: true });
      return;
    }

    if (currentPage === 'landing' && selectedLeagueId) {
      const league = state.leagues.find(l => l.id === selectedLeagueId);
      const slug   = league?.slug || selectedLeagueId;
      const target = `/liga/${slug}`;
      if (path !== target) navigate(target, { replace: true });
      return;
    }

    const url = PAGE_TO_URL[currentPage];
    if (url && url !== '/:id' && !url.endsWith('/:slug')) {
      if (path !== url) navigate(url, { replace: true });
    }
  }, [currentPage, selectedTournamentId, selectedLeagueId]);
}

// ─── Proteção de rota autenticada ─────────────────────────────────────────────
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { state } = useApp();
  if (!state.currentUser) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(state.currentUser.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ─── Layout raiz — instala os hooks de sync ───────────────────────────────────
function RootLayout() {
  useUrlSync();
  useNavigateSync();
  return <Outlet />;
}

// ─── Wrapper do App com Suspense ──────────────────────────────────────────────
function AppWrapper() {
  return (
    <React.Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#1A1C22' }}>
        <div className="w-10 h-10 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <App />
    </React.Suspense>
  );
}

// ─── Configuração do router ───────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <LocaleProvider>
        <AppProvider>
          <RootLayout />
        </AppProvider>
      </LocaleProvider>
    ),
    children: [
      // Públicas
      { index: true,                   element: <AppWrapper /> },
      { path: 'login',                 element: <AppWrapper /> },
      { path: 'liga/:slug',            element: <AppWrapper /> },
      { path: 'federacao/:slug',       element: <AppWrapper /> },

      // Autenticadas — qualquer usuário logado
      { path: 'dashboard',             element: <ProtectedRoute><AppWrapper /></ProtectedRoute> },
      { path: 'torneio/:id',           element: <ProtectedRoute><AppWrapper /></ProtectedRoute> },
      { path: 'jogador',               element: <ProtectedRoute><AppWrapper /></ProtectedRoute> },
      { path: 'time',                  element: <ProtectedRoute><AppWrapper /></ProtectedRoute> },
      { path: 'estatisticas',          element: <ProtectedRoute><AppWrapper /></ProtectedRoute> },
      { path: 'mercado',               element: <ProtectedRoute><AppWrapper /></ProtectedRoute> },
      { path: 'convites',              element: <ProtectedRoute><AppWrapper /></ProtectedRoute> },
      { path: 'buscar-jogadores',      element: <ProtectedRoute><AppWrapper /></ProtectedRoute> },
      { path: 'configuracoes',         element: <ProtectedRoute><AppWrapper /></ProtectedRoute> },

      // Organizador/Admin
      {
        path: 'criar-campeonato',
        element: (
          <ProtectedRoute roles={[UserRole.ORGANIZER, UserRole.ADMIN]}>
            <AppWrapper />
          </ProtectedRoute>
        ),
      },

      // Admin exclusivo
      {
        path: 'admin',
        element: (
          <ProtectedRoute roles={[UserRole.ADMIN]}>
            <AppWrapper />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/personalizacao',
        element: (
          <ProtectedRoute roles={[UserRole.ADMIN]}>
            <AppWrapper />
          </ProtectedRoute>
        ),
      },

      // Fallback
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

// ─── Exportação principal ─────────────────────────────────────────────────────
export const AppRouter: React.FC = () => <RouterProvider router={router} />;
