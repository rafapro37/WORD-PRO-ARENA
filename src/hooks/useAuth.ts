import { useCallback } from 'react';
import { AppState, User, UserRole, PlayerProfile } from '../../types';
import { clearSession } from '../../services/authService';
import { generateId } from '../../services/dataService';

interface UseAuthActions {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setCurrentPage: (page: string) => void;
  logAction: (module: string, description: string) => void;
}

export function useAuth({ setState, setCurrentPage, logAction }: UseAuthActions) {

  const handleLogin = useCallback((user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
    if (user.role === UserRole.ADMIN)           setCurrentPage('admin-dashboard');
    else if (user.role === UserRole.PLAYER)     setCurrentPage('player-profile');
    else if (user.role === UserRole.TEAM_MANAGER) setCurrentPage('team-dashboard');
    else                                         setCurrentPage('dashboard');
  }, [setState, setCurrentPage]);

  const handleLogout = useCallback(() => {
    setState(prev => ({ ...prev, currentUser: null }));
    setCurrentPage('login');
    clearSession();
  }, [setState, setCurrentPage]);

  const handleRegister = useCallback((newUser: User, newProfile?: PlayerProfile) => {
    setState(prev => {
      const updatedUsers    = [...prev.users, newUser];
      const updatedProfiles = newProfile
        ? [...prev.playerProfiles, newProfile]
        : prev.playerProfiles;

      // Criar time automaticamente para TEAM_MANAGER
      const newTeamsList = [...prev.teams];
      if (newUser.role === UserRole.TEAM_MANAGER) {
        const teamExists = prev.teams.some(t => t.ownerId === newUser.id || t.managerId === newUser.id);
        if (!teamExists) {
          newTeamsList.push({
            id: `team-${newUser.id}-${Date.now()}`,
            name: `Time de ${newUser.name || newUser.username}`,
            organizadorId: newUser.organizadorId!,
            ownerId: newUser.id,
            managerId: newUser.id,
            tournamentId: 'GLOBAL',
            groupId: 'NONE',
            roster: [],
            played: 0, won: 0, drawn: 0, lost: 0,
            goalsFor: 0, goalsAgainst: 0, points: 0,
            ligaId: newProfile?.ligaId,
          });
        }
      }

      // Vincular automaticamente a torneios ativos da liga escolhida
      const updatedRegistrations = [...(prev.registrations || [])];
      if (newProfile?.ligaId) {
        prev.tournaments.forEach(t => {
          if (t.status === 'ACTIVE' && t.ligaId === newProfile.ligaId) {
            const alreadyReg = updatedRegistrations.some(
              r => r.tournamentId === t.id && r.teamOwnerId === newUser.id,
            );
            if (!alreadyReg) {
              updatedRegistrations.push({
                id: generateId(),
                organizadorId: t.organizadorId,
                tournamentId: t.id,
                teamOwnerId: newUser.id,
                teamName: newProfile.teamName || newUser.name || newUser.username,
                teamLogoUrl: newProfile.teamLogoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${newUser.id}`,
                status: 'PENDING',
                timestamp: Date.now(),
                userId: newUser.id,
              });
            }
          }
        });
      }

      return {
        ...prev,
        users: updatedUsers,
        playerProfiles: updatedProfiles,
        teams: newTeamsList,
        registrations: updatedRegistrations,
      };
    });

    logAction('Autenticação', `Novo usuário registrado: ${newUser.username} (${newUser.role})`);
  }, [setState, logAction]);

  return { handleLogin, handleLogout, handleRegister };
}
