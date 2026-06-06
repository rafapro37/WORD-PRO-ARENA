// PRO WORLD ARENA — Sistema de Internacionalização
// Adicionar novo idioma: copie o bloco 'pt' e traduza os valores

export type Locale = 'pt' | 'en' | 'es';

export const AVAILABLE_LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English',   flag: '🇺🇸' },
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
];

const LOCALE_KEY = 'pwa_locale';

export const getSavedLocale = (): Locale => {
  try {
    const saved = localStorage.getItem(LOCALE_KEY) as Locale;
    if (saved && AVAILABLE_LOCALES.some(l => l.code === saved)) return saved;
  } catch {}
  // Detectar idioma do navegador automaticamente
  const lang = navigator.language?.slice(0, 2);
  if (lang === 'es') return 'es';
  if (lang === 'en') return 'en';
  return 'pt';
};

export const saveLocale = (locale: Locale) => {
  try { localStorage.setItem(LOCALE_KEY, locale); } catch {}
};

// ─── DICIONÁRIO PRINCIPAL ─────────────────────────────────────────────────────

export const translations = {
  pt: {
    // Navegação
    nav: {
      home:        'Início',
      dashboard:   'Painel',
      tournaments: 'Campeonatos',
      profile:     'Meu Perfil',
      stats:       'Estatísticas',
      market:      'Mercado',
      settings:    'Configurações',
      logout:      'Sair',
      admin:       'Painel Admin',
      customize:   'Personalização',
      organizers:  'Organizadores',
      teamManager: 'Gerente de Time',
      invitations: 'Convites',
    },

    // Geral
    common: {
      save:        'Salvar',
      cancel:      'Cancelar',
      confirm:     'Confirmar',
      delete:      'Excluir',
      edit:        'Editar',
      add:         'Adicionar',
      remove:      'Remover',
      search:      'Pesquisar',
      filter:      'Filtrar',
      back:        'Voltar',
      next:        'Próximo',
      previous:    'Anterior',
      close:       'Fechar',
      loading:     'Carregando...',
      error:       'Erro',
      success:     'Sucesso',
      yes:         'Sim',
      no:          'Não',
      name:        'Nome',
      email:       'E-mail',
      password:    'Senha',
      username:    'Usuário',
      optional:    'opcional',
      required:    'obrigatório',
      noData:      'Nenhum dado encontrado.',
      copy:        'Copiar',
      copied:      'Copiado!',
      upload:      'Enviar imagem',
      download:    'Baixar',
      actions:     'Ações',
      total:       'Total',
      of:          'de',
      and:         'e',
      or:          'ou',
    },

    // Status (exibição ao usuário)
    status: {
      active:          'Ativo',
      inactive:        'Inativo',
      pending:         'Pendente',
      approved:        'Aprovado',
      rejected:        'Recusado',
      draft:           'Rascunho',
      finished:        'Finalizado',
      open:            'Aberto',
      closed:          'Fechado',
      registered:      'Inscrito',
      waitingPayment:  'Aguardando Pagamento',
      paid:            'Pago',
      available:       'Disponível',
      negotiating:     'Negociando',
      loaned:          'Emprestado',
      free:            'Livre',
    },

    // Planos
    plans: {
      free:        'Grátis',
      basic:       'Básico',
      pro:         'Pro',
      elite:       'Elite',
      currentPlan: 'Plano Atual',
      upgrade:     'Fazer Upgrade',
      features:    'Recursos',
    },

    // Papéis
    roles: {
      admin:       'Administrador',
      organizer:   'Organizador',
      player:      'Jogador',
      teamManager: 'Gerente de Time',
      moderator:   'Moderador',
      guest:       'Visitante',
    },

    // Esportes e modos
    sports: {
      virtual:  'Virtual (Game)',
      field:    'Campo (11x11)',
      futsal:   'Futsal',
      x1:       'X1 (Individual)',
      proClubs: 'Pro Clubs (Equipe)',
    },

    // Formatos de torneio
    formats: {
      groups:                'Fase de Grupos',
      league:                'Liga',
      pontosCorridos:        'Pontos Corridos',
      pontosCorridosPlayoff: 'Pontos Corridos + Playoff',
      knockout:              'Mata-Mata',
      swiss:                 'Sistema Suíço',
      md3:                   'Melhor de 3',
    },

    // Campeonatos
    tournament: {
      create:       'Criar Campeonato',
      manage:       'Gerenciar',
      details:      'Detalhes',
      teams:        'Times',
      matches:      'Partidas',
      standings:    'Classificação',
      bracket:      'Chaveamento',
      groups:       'Grupos',
      players:      'Jogadores',
      awards:       'Premiações',
      registration: 'Inscrição',
      rules:        'Regulamento',
      noTournaments: 'Nenhum campeonato cadastrado.',
      round:        'Rodada',
      stage:        'Fase',
      finalStage:   'Fase Final',
      groupStage:   'Fase de Grupos',
      entryFee:     'Taxa de Inscrição',
      freeEntry:    'Gratuito',
    },

    // Partidas
    match: {
      result:       'Resultado',
      goals:        'Gols',
      assists:      'Assistências',
      mvp:          'MVP da Partida',
      rating:       'Nota',
      penalties:    'Pênaltis',
      goldenGoal:   'Gol de Ouro',
      notPlayed:    'Não realizada',
      finished:     'Finalizada',
      scheduled:    'Agendada',
      homeTeam:     'Time da Casa',
      awayTeam:     'Time Visitante',
    },

    // Times
    team: {
      myTeam:     'Meu Time',
      roster:     'Elenco',
      logo:       'Escudo',
      create:     'Criar Time',
      noTeam:     'Sem time',
      captain:    'Capitão',
      viceCaptain:'Vice-Capitão',
      position:   'Posição',
      kitNumber:  'Número',
    },

    // Mercado
    market: {
      title:          'Mercado da Bola',
      transferValue:  'Valor de Transferência',
      loanValue:      'Valor de Empréstimo',
      buyoutClause:   'Cláusula de Rescisão',
      makeOffer:      'Fazer Proposta',
      status:         'Status do Mercado',
      open:           'Aberto',
      closed:         'Fechado',
    },

    // Auth / Login
    auth: {
      login:          'Entrar',
      register:       'Cadastrar',
      logout:         'Sair',
      forgotPassword: 'Esqueci a senha',
      resetPassword:  'Redefinir senha',
      adminAccess:    'Acesso Administrador',
      adminMode:      '● MODO ADMINISTRADOR ATIVO',
      waitingApproval:'AGUARDANDO APROVAÇÃO. O administrador precisa autorizar seu perfil.',
      wrongCredentials: 'Usuário ou senha incorretos.',
      terms:          'Ao utilizar o PRO WORLD ARENA, você concorda com as regras de conduta e gerenciamento de competições.',
      chooseExperience: 'Como deseja jogar?',
      chooseExperienceDesc: 'Escolha sua experiência para começar',
      support:        'Suporte Técnico VIP',
    },

    // Tela inicial (Landing)
    landing: {
      tagline:    'GESTÃO ESPORTIVA PROFISSIONAL',
      subtitle:   'A plataforma definitiva para campeonatos de alto nível',
      joinNow:    'Entrar na Plataforma',
      publicPage: 'Página Pública',
      selectLang: 'Idioma',
      copyright:  '© 2025 PRO WORLD ARENA - SOLUÇÕES ESPORTIVAS DE ELITE',
      globalStatus: 'GLOBAL',
      activeStatus: 'ATIVO',
    },

    // Mensagens de sistema
    system: {
      syncOk:      'Dados sincronizados',
      syncError:   'Erro na sincronização',
      syncing:     'Sincronizando...',
      saved:       'Salvo com sucesso!',
      deleted:     'Excluído com sucesso!',
      noPermission:'Sem permissão para esta ação.',
      confirmDelete: 'Tem certeza que deseja excluir?',
      imageTooBig: 'Imagem muito grande. Limite: 2MB.',
      invalidImage: 'Apenas imagens PNG, JPG ou WEBP são aceitas.',
    },
  },

  // ─── ENGLISH ─────────────────────────────────────────────────────────────────
  en: {
    nav: {
      home:        'Home',
      dashboard:   'Dashboard',
      tournaments: 'Tournaments',
      profile:     'My Profile',
      stats:       'Statistics',
      market:      'Market',
      settings:    'Settings',
      logout:      'Sign Out',
      admin:       'Admin Panel',
      customize:   'Customize',
      organizers:  'Organizers',
      teamManager: 'Team Manager',
      invitations: 'Invitations',
    },
    common: {
      save:        'Save',
      cancel:      'Cancel',
      confirm:     'Confirm',
      delete:      'Delete',
      edit:        'Edit',
      add:         'Add',
      remove:      'Remove',
      search:      'Search',
      filter:      'Filter',
      back:        'Back',
      next:        'Next',
      previous:    'Previous',
      close:       'Close',
      loading:     'Loading...',
      error:       'Error',
      success:     'Success',
      yes:         'Yes',
      no:          'No',
      name:        'Name',
      email:       'Email',
      password:    'Password',
      username:    'Username',
      optional:    'optional',
      required:    'required',
      noData:      'No data found.',
      copy:        'Copy',
      copied:      'Copied!',
      upload:      'Upload image',
      download:    'Download',
      actions:     'Actions',
      total:       'Total',
      of:          'of',
      and:         'and',
      or:          'or',
    },
    status: {
      active:          'Active',
      inactive:        'Inactive',
      pending:         'Pending',
      approved:        'Approved',
      rejected:        'Rejected',
      draft:           'Draft',
      finished:        'Finished',
      open:            'Open',
      closed:          'Closed',
      registered:      'Registered',
      waitingPayment:  'Awaiting Payment',
      paid:            'Paid',
      available:       'Available',
      negotiating:     'Negotiating',
      loaned:          'On Loan',
      free:            'Free Agent',
    },
    plans: {
      free:        'Free',
      basic:       'Basic',
      pro:         'Pro',
      elite:       'Elite',
      currentPlan: 'Current Plan',
      upgrade:     'Upgrade',
      features:    'Features',
    },
    roles: {
      admin:       'Administrator',
      organizer:   'Organizer',
      player:      'Player',
      teamManager: 'Team Manager',
      moderator:   'Moderator',
      guest:       'Guest',
    },
    sports: {
      virtual:  'Virtual (Game)',
      field:    'Field (11v11)',
      futsal:   'Futsal',
      x1:       'X1 (Individual)',
      proClubs: 'Pro Clubs (Team)',
    },
    formats: {
      groups:                'Group Stage',
      league:                'League',
      pontosCorridos:        'Round Robin',
      pontosCorridosPlayoff: 'Round Robin + Playoff',
      knockout:              'Knockout',
      swiss:                 'Swiss System',
      md3:                   'Best of 3',
    },
    tournament: {
      create:        'Create Tournament',
      manage:        'Manage',
      details:       'Details',
      teams:         'Teams',
      matches:       'Matches',
      standings:     'Standings',
      bracket:       'Bracket',
      groups:        'Groups',
      players:       'Players',
      awards:        'Awards',
      registration:  'Registration',
      rules:         'Rules',
      noTournaments: 'No tournaments found.',
      round:         'Round',
      stage:         'Stage',
      finalStage:    'Final Stage',
      groupStage:    'Group Stage',
      entryFee:      'Entry Fee',
      freeEntry:     'Free',
    },
    match: {
      result:     'Result',
      goals:      'Goals',
      assists:    'Assists',
      mvp:        'Match MVP',
      rating:     'Rating',
      penalties:  'Penalties',
      goldenGoal: 'Golden Goal',
      notPlayed:  'Not played',
      finished:   'Finished',
      scheduled:  'Scheduled',
      homeTeam:   'Home Team',
      awayTeam:   'Away Team',
    },
    team: {
      myTeam:      'My Team',
      roster:      'Roster',
      logo:        'Crest',
      create:      'Create Team',
      noTeam:      'No team',
      captain:     'Captain',
      viceCaptain: 'Vice-Captain',
      position:    'Position',
      kitNumber:   'Number',
    },
    market: {
      title:         'Transfer Market',
      transferValue: 'Transfer Value',
      loanValue:     'Loan Value',
      buyoutClause:  'Buyout Clause',
      makeOffer:     'Make Offer',
      status:        'Market Status',
      open:          'Open',
      closed:        'Closed',
    },
    auth: {
      login:            'Sign In',
      register:         'Register',
      logout:           'Sign Out',
      forgotPassword:   'Forgot password',
      resetPassword:    'Reset password',
      adminAccess:      'Administrator Access',
      adminMode:        '● ADMINISTRATOR MODE ACTIVE',
      waitingApproval:  'AWAITING APPROVAL. The administrator needs to authorize your organizer profile.',
      wrongCredentials: 'Incorrect username or password.',
      terms:            'By using PRO WORLD ARENA, you agree to the conduct and competition management rules.',
      chooseExperience: 'How do you want to play?',
      chooseExperienceDesc: 'Choose your experience to get started',
      support:          'VIP Technical Support',
    },
    landing: {
      tagline:      'PROFESSIONAL SPORTS MANAGEMENT',
      subtitle:     'The definitive platform for high-level championships',
      joinNow:      'Enter Platform',
      publicPage:   'Public Page',
      selectLang:   'Language',
      copyright:    '© 2025 PRO WORLD ARENA - ELITE SPORTS SOLUTIONS',
      globalStatus: 'GLOBAL',
      activeStatus: 'ACTIVE',
    },
    system: {
      syncOk:        'Data synchronized',
      syncError:     'Sync error',
      syncing:       'Syncing...',
      saved:         'Saved successfully!',
      deleted:       'Deleted successfully!',
      noPermission:  'No permission for this action.',
      confirmDelete: 'Are you sure you want to delete?',
      imageTooBig:   'Image too large. Limit: 2MB.',
      invalidImage:  'Only PNG, JPG or WEBP images are accepted.',
    },
  },

  // ─── ESPAÑOL ─────────────────────────────────────────────────────────────────
  es: {
    nav: {
      home:        'Inicio',
      dashboard:   'Panel',
      tournaments: 'Torneos',
      profile:     'Mi Perfil',
      stats:       'Estadísticas',
      market:      'Mercado',
      settings:    'Configuración',
      logout:      'Salir',
      admin:       'Panel Admin',
      customize:   'Personalización',
      organizers:  'Organizadores',
      teamManager: 'Manager de Equipo',
      invitations: 'Invitaciones',
    },
    common: {
      save:        'Guardar',
      cancel:      'Cancelar',
      confirm:     'Confirmar',
      delete:      'Eliminar',
      edit:        'Editar',
      add:         'Agregar',
      remove:      'Quitar',
      search:      'Buscar',
      filter:      'Filtrar',
      back:        'Volver',
      next:        'Siguiente',
      previous:    'Anterior',
      close:       'Cerrar',
      loading:     'Cargando...',
      error:       'Error',
      success:     'Éxito',
      yes:         'Sí',
      no:          'No',
      name:        'Nombre',
      email:       'Correo',
      password:    'Contraseña',
      username:    'Usuario',
      optional:    'opcional',
      required:    'requerido',
      noData:      'Sin datos encontrados.',
      copy:        'Copiar',
      copied:      '¡Copiado!',
      upload:      'Subir imagen',
      download:    'Descargar',
      actions:     'Acciones',
      total:       'Total',
      of:          'de',
      and:         'y',
      or:          'o',
    },
    status: {
      active:          'Activo',
      inactive:        'Inactivo',
      pending:         'Pendiente',
      approved:        'Aprobado',
      rejected:        'Rechazado',
      draft:           'Borrador',
      finished:        'Finalizado',
      open:            'Abierto',
      closed:          'Cerrado',
      registered:      'Inscrito',
      waitingPayment:  'Esperando Pago',
      paid:            'Pagado',
      available:       'Disponible',
      negotiating:     'Negociando',
      loaned:          'Cedido',
      free:            'Libre',
    },
    plans: {
      free:        'Gratis',
      basic:       'Básico',
      pro:         'Pro',
      elite:       'Elite',
      currentPlan: 'Plan Actual',
      upgrade:     'Mejorar Plan',
      features:    'Funciones',
    },
    roles: {
      admin:       'Administrador',
      organizer:   'Organizador',
      player:      'Jugador',
      teamManager: 'Manager de Equipo',
      moderator:   'Moderador',
      guest:       'Visitante',
    },
    sports: {
      virtual:  'Virtual (Juego)',
      field:    'Campo (11v11)',
      futsal:   'Fútbol Sala',
      x1:       'X1 (Individual)',
      proClubs: 'Pro Clubs (Equipo)',
    },
    formats: {
      groups:                'Fase de Grupos',
      league:                'Liga',
      pontosCorridos:        'Liga Todos contra Todos',
      pontosCorridosPlayoff: 'Liga + Playoff',
      knockout:              'Eliminación Directa',
      swiss:                 'Sistema Suizo',
      md3:                   'Mejor de 3',
    },
    tournament: {
      create:        'Crear Torneo',
      manage:        'Gestionar',
      details:       'Detalles',
      teams:         'Equipos',
      matches:       'Partidos',
      standings:     'Clasificación',
      bracket:       'Cuadro',
      groups:        'Grupos',
      players:       'Jugadores',
      awards:        'Premios',
      registration:  'Inscripción',
      rules:         'Reglamento',
      noTournaments: 'No hay torneos.',
      round:         'Jornada',
      stage:         'Fase',
      finalStage:    'Fase Final',
      groupStage:    'Fase de Grupos',
      entryFee:      'Cuota de Inscripción',
      freeEntry:     'Gratis',
    },
    match: {
      result:     'Resultado',
      goals:      'Goles',
      assists:    'Asistencias',
      mvp:        'MVP del Partido',
      rating:     'Nota',
      penalties:  'Penales',
      goldenGoal: 'Gol de Oro',
      notPlayed:  'No jugado',
      finished:   'Finalizado',
      scheduled:  'Programado',
      homeTeam:   'Equipo Local',
      awayTeam:   'Equipo Visitante',
    },
    team: {
      myTeam:      'Mi Equipo',
      roster:      'Plantilla',
      logo:        'Escudo',
      create:      'Crear Equipo',
      noTeam:      'Sin equipo',
      captain:     'Capitán',
      viceCaptain: 'Vicecapitán',
      position:    'Posición',
      kitNumber:   'Número',
    },
    market: {
      title:         'Mercado de Fichajes',
      transferValue: 'Valor de Traspaso',
      loanValue:     'Valor de Préstamo',
      buyoutClause:  'Cláusula de Rescisión',
      makeOffer:     'Hacer Oferta',
      status:        'Estado del Mercado',
      open:          'Abierto',
      closed:        'Cerrado',
    },
    auth: {
      login:            'Iniciar Sesión',
      register:         'Registrarse',
      logout:           'Salir',
      forgotPassword:   'Olvidé mi contraseña',
      resetPassword:    'Restablecer contraseña',
      adminAccess:      'Acceso Administrador',
      adminMode:        '● MODO ADMINISTRADOR ACTIVO',
      waitingApproval:  'ESPERANDO APROBACIÓN. El administrador debe autorizar tu perfil.',
      wrongCredentials: 'Usuario o contraseña incorrectos.',
      terms:            'Al usar PRO WORLD ARENA, aceptas las reglas de conducta y gestión de competiciones.',
      chooseExperience: '¿Cómo quieres jugar?',
      chooseExperienceDesc: 'Elige tu experiencia para comenzar',
      support:          'Soporte Técnico VIP',
    },
    landing: {
      tagline:      'GESTIÓN DEPORTIVA PROFESIONAL',
      subtitle:     'La plataforma definitiva para campeonatos de alto nivel',
      joinNow:      'Entrar a la Plataforma',
      publicPage:   'Página Pública',
      selectLang:   'Idioma',
      copyright:    '© 2025 PRO WORLD ARENA - SOLUCIONES DEPORTIVAS DE ÉLITE',
      globalStatus: 'GLOBAL',
      activeStatus: 'ACTIVO',
    },
    system: {
      syncOk:        'Datos sincronizados',
      syncError:     'Error de sincronización',
      syncing:       'Sincronizando...',
      saved:         '¡Guardado con éxito!',
      deleted:       '¡Eliminado con éxito!',
      noPermission:  'Sin permiso para esta acción.',
      confirmDelete: '¿Estás seguro de que deseas eliminar?',
      imageTooBig:   'Imagen demasiado grande. Límite: 2MB.',
      invalidImage:  'Solo se aceptan imágenes PNG, JPG o WEBP.',
    },
  },
} as const;

export type TranslationKey = typeof translations['pt'];

// Hook de acesso às traduções
export const t = (locale: Locale): TranslationKey => {
  return translations[locale] ?? translations['pt'];
};

// Helpers para traduzir enums
export const translateSport = (sport: string, locale: Locale): string => {
  const map: Record<string, keyof TranslationKey['sports']> = {
    VIRTUAL: 'virtual',
    FIELD:   'field',
    FUTSAL:  'futsal',
  };
  const key = map[sport];
  return key ? t(locale).sports[key] : sport;
};

export const translateFormat = (format: string, locale: Locale): string => {
  const map: Record<string, keyof TranslationKey['formats']> = {
    GROUPS:                    'groups',
    LEAGUE:                    'league',
    PONTOS_CORRIDOS:           'pontosCorridos',
    PONTOS_CORRIDOS_PLAYOFF:   'pontosCorridosPlayoff',
    KNOCKOUT:                  'knockout',
    SWISS:                     'swiss',
    MD3:                       'md3',
  };
  const key = map[format];
  return key ? t(locale).formats[key] : format;
};

export const translateStatus = (status: string, locale: Locale): string => {
  const map: Record<string, keyof TranslationKey['status']> = {
    ACTIVE:           'active',
    INACTIVE:         'inactive',
    PENDING:          'pending',
    APPROVED:         'approved',
    REJECTED:         'rejected',
    DRAFT:            'draft',
    FINISHED:         'finished',
    OPEN:             'open',
    CLOSED:           'closed',
    WAITING_PAYMENT:  'waitingPayment',
    PAID:             'paid',
    DISPONIVEL:       'available',
    NEGOCIANDO:       'negotiating',
    EMPRESTADO:       'loaned',
    LIVRE:            'free',
  };
  const key = map[status];
  return key ? t(locale).status[key] : status;
};

export const translatePlan = (plan: string, locale: Locale): string => {
  const map: Record<string, keyof TranslationKey['plans']> = {
    FREE:  'free',
    BASIC: 'basic',
    PRO:   'pro',
    ELITE: 'elite',
  };
  const key = map[plan];
  return key ? t(locale).plans[key] : plan;
};

export const translateRole = (role: string, locale: Locale): string => {
  const map: Record<string, keyof TranslationKey['roles']> = {
    ADMIN:        'admin',
    ORGANIZER:    'organizer',
    PLAYER:       'player',
    TEAM_MANAGER: 'teamManager',
    MODERATOR:    'moderator',
    GUEST:        'guest',
  };
  const key = map[role];
  return key ? t(locale).roles[key] : role;
};
