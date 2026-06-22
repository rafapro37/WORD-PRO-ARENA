
import React, { useState } from 'react';
import { LayoutDashboard, Trophy, BarChart, Users, Settings, LogOut, Menu, ChevronLeft, Shield, ShoppingBag, Briefcase, Mail, Palette, RefreshCw } from './Icons';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
  onChangeExperience?: () => void;
  isRetracted: boolean;
  toggleRetract: () => void;
  themeColor: string; // New prop for dynamic theme color
  organization?: { nome: string, logo: string };
  pendingLeaguesCount?: number;
  showMarket?: boolean;
  showStats?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onNavigate, currentPage, onLogout, onChangeExperience, isRetracted, toggleRetract, themeColor, organization, pendingLeaguesCount = 0, showMarket = true, showStats = true }) => {
  
  // Dynamic style for active items
  const activeStyle = {
      backgroundColor: 'var(--bg-card)', // Dynamic Highlight
      borderColor: 'var(--primary)',
      color: 'var(--text-main)' // Dynamic Text
  };

  const inactiveStyle = {
      borderColor: 'transparent',
  };

  const orgName = organization?.nome || "PRO WORLD";
  const orgLogo = organization?.logo;

  return (
    <div className={`fixed md:relative z-50 h-screen bg-[var(--bg-main)] border-r border-[var(--border)] flex flex-col transition-all duration-300 ${isRetracted ? 'w-20 -translate-x-full md:translate-x-0' : 'w-64 translate-x-0'}`}>
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[var(--border)]">
        {!isRetracted && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1 rounded shadow-lg bg-[var(--primary)] shrink-0 w-8 h-8 flex items-center justify-center">
               {orgLogo ? <img src={orgLogo} className="w-full h-full object-contain" alt="Org Logo" /> : <Shield className="w-6 h-6 text-white" />}
            </div>
            <span className="font-bold text-xl text-[var(--text-main)] tracking-tight truncate">
              {orgName}
            </span>
          </div>
        )}
        {isRetracted && (
           <div className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center overflow-hidden bg-[var(--primary)]/10 border border-[var(--primary)]/20">
               {orgLogo ? <img src={orgLogo} className="w-full h-full object-contain" /> : <Shield className="w-6 h-6 text-[var(--primary)]" />}
           </div>
        )}
        <button onClick={toggleRetract} className="text-[var(--text-secondary)] hover:text-[var(--text-main)]">
          {isRetracted ? <Menu /> : <ChevronLeft />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-2">
        
        {(role === UserRole.ADMIN || role === UserRole.MODERATOR) && (
          <div 
            onClick={() => onNavigate('admin-dashboard')} 
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-l-4 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
            style={currentPage === 'admin-dashboard' ? activeStyle : inactiveStyle}
          >
            <LayoutDashboard size={20} />
            {!isRetracted && <span>Painel Admin</span>}
          </div>
        )}

        {(role === UserRole.ORGANIZER || role === UserRole.GUEST || role === UserRole.TEAM_MANAGER) && (
          <div 
              onClick={() => onNavigate('dashboard')} 
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-l-4 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
              style={currentPage === 'dashboard' ? activeStyle : inactiveStyle}
          >
            <LayoutDashboard size={20} />
            {!isRetracted && <span>Campeonatos</span>}
          </div>
        )}

        {role === UserRole.PLAYER && (
           <div 
              onClick={() => onNavigate('player-profile')} 
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-l-4 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
              style={currentPage === 'player-profile' ? activeStyle : inactiveStyle}
           >
             <Users size={20} />
             {!isRetracted && <span>Meu Perfil</span>}
           </div>
        )}

        {(role === UserRole.PLAYER || role === UserRole.TEAM_MANAGER) && (
           <div 
              onClick={() => onNavigate('invitations')} 
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-l-4 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)] relative group"
              style={currentPage === 'invitations' ? activeStyle : inactiveStyle}
           >
             <Mail size={20} />
             {!isRetracted && (
               <div className="flex-1 flex items-center justify-between">
                 <span>Convites</span>
                 {pendingLeaguesCount > 0 && (
                   <span className="bg-[var(--primary)] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
                     {pendingLeaguesCount}
                   </span>
                 )}
               </div>
             )}
             {isRetracted && pendingLeaguesCount > 0 && (
               <div className="absolute top-2 right-2 w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse border border-black" />
             )}
           </div>
        )}

        {/* TEAM MANAGER MANAGEMENT */}
        {role === UserRole.TEAM_MANAGER && (
           <div 
              onClick={() => onNavigate('team-dashboard')} 
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-l-4 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
              style={currentPage === 'team-dashboard' ? activeStyle : inactiveStyle}
           >
             <Briefcase size={20} />
             {!isRetracted && <span>Manager de Time</span>}
           </div>
        )}
        
        {/* CENTRAL DE ESTATÍSTICAS - Só para X11 */}
        {showStats && (
        <div 
            onClick={() => onNavigate('stats')} 
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-l-4 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
            style={currentPage === 'stats' ? activeStyle : inactiveStyle}
        >
          <BarChart size={20} />
          {!isRetracted && <span>Central de Estatísticas</span>}
        </div>
        )}

        {role === UserRole.ADMIN && (
          <div 
            onClick={() => onNavigate('organizers')} 
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-l-4 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
            style={currentPage === 'organizers' ? activeStyle : inactiveStyle}
          >
            <Users size={20} />
            {!isRetracted && <span>Organizadores</span>}
          </div>
        )}
        
        {role === UserRole.ADMIN && (
          <div 
            onClick={() => onNavigate('admin-personalizacao')} 
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-l-4 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
            style={currentPage === 'admin-personalizacao' ? activeStyle : inactiveStyle}
          >
            <Palette size={20} />
            {!isRetracted && <span>Personalização</span>}
          </div>
        )}
        
        {role === UserRole.ORGANIZER && (
           <div 
            onClick={() => onNavigate('settings')} 
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-l-4 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
            style={currentPage === 'settings' ? activeStyle : inactiveStyle}
           >
            <Settings size={20} />
            {!isRetracted && <span>Configurações</span>}
           </div>
        )}

      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)] space-y-2">
        <button 
            onClick={onLogout} 
            className="flex items-center gap-3 w-full p-3 text-[var(--text-main)] rounded-lg transition-colors hover:opacity-90 bg-[var(--primary)]"
        >
          <LogOut size={20} className="text-[var(--text-main)]" />
          {!isRetracted && <span className="text-[var(--text-main)] font-bold">Sair</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
