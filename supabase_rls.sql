-- ============================================================
-- PRO WORLD ARENA — Row Level Security (RLS)
-- Versão: Fase 4 — Multi-tenant isolado por organizador_id
-- Aplique este arquivo no SQL Editor do Supabase
-- ============================================================

-- ─── HELPERS ─────────────────────────────────────────────────────────────────
-- Função que verifica se o usuário autenticado é admin master
-- (o admin do sistema não usa Supabase Auth, então esta é uma segurança extra)
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS boolean AS $$
  SELECT auth.role() = 'authenticated';
$$ LANGUAGE sql SECURITY DEFINER;

-- ─── USUARIOS ─────────────────────────────────────────────────────────────────
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS usuarios_select ON usuarios;
DROP POLICY IF EXISTS usuarios_select_own ON usuarios;
DROP POLICY IF EXISTS usuarios_select_organizer ON usuarios;
DROP POLICY IF EXISTS usuarios_insert ON usuarios;
DROP POLICY IF EXISTS usuarios_update ON usuarios;
DROP POLICY IF EXISTS usuarios_delete ON usuarios;

-- Jogador lê seu próprio perfil
CREATE POLICY usuarios_select_own ON usuarios
  FOR SELECT USING (auth.uid()::text = id::text);

-- Organizador lê todos os usuários que pertencem à sua organização
CREATE POLICY usuarios_select_organizer ON usuarios
  FOR SELECT USING (
    auth.uid()::text = organizador_id::text
  );

CREATE POLICY usuarios_insert ON usuarios
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY usuarios_update ON usuarios
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY usuarios_delete ON usuarios
  FOR DELETE USING (auth.uid()::text = id::text);

-- ─── FEDERACOES ───────────────────────────────────────────────────────────────
ALTER TABLE federacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS federacoes_select ON federacoes;
DROP POLICY IF EXISTS federacoes_select_public ON federacoes;
DROP POLICY IF EXISTS federacoes_select_owner ON federacoes;
DROP POLICY IF EXISTS federacoes_insert ON federacoes;
DROP POLICY IF EXISTS federacoes_update ON federacoes;
DROP POLICY IF EXISTS federacoes_delete ON federacoes;

-- Federações públicas são visíveis por todos (página pública)
CREATE POLICY federacoes_select_public ON federacoes
  FOR SELECT USING (true);

CREATE POLICY federacoes_insert ON federacoes
  FOR INSERT WITH CHECK (auth.uid()::text = organizador_id::text);

-- Só o organizador dono pode editar/deletar
CREATE POLICY federacoes_update ON federacoes
  FOR UPDATE USING (auth.uid()::text = organizador_id::text);

CREATE POLICY federacoes_delete ON federacoes
  FOR DELETE USING (auth.uid()::text = organizador_id::text);

-- ─── CAMPEONATOS ──────────────────────────────────────────────────────────────
ALTER TABLE campeonatos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS campeonatos_select ON campeonatos;
DROP POLICY IF EXISTS campeonatos_select_public ON campeonatos;
DROP POLICY IF EXISTS campeonatos_insert ON campeonatos;
DROP POLICY IF EXISTS campeonatos_update ON campeonatos;
DROP POLICY IF EXISTS campeonatos_delete ON campeonatos;

-- Qualquer pessoa autenticada pode ver campeonatos (necessário para jogadores se inscreverem)
CREATE POLICY campeonatos_select_public ON campeonatos
  FOR SELECT USING (true);

CREATE POLICY campeonatos_insert ON campeonatos
  FOR INSERT WITH CHECK (auth.uid()::text = organizador_id::text);

-- Só o organizador dono edita
CREATE POLICY campeonatos_update ON campeonatos
  FOR UPDATE USING (auth.uid()::text = organizador_id::text);

CREATE POLICY campeonatos_delete ON campeonatos
  FOR DELETE USING (auth.uid()::text = organizador_id::text);

-- ─── PARTICIPANTES (inscrições) ───────────────────────────────────────────────
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS participantes_select ON participantes;
DROP POLICY IF EXISTS participantes_insert ON participantes;
DROP POLICY IF EXISTS participantes_update ON participantes;
DROP POLICY IF EXISTS participantes_delete ON participantes;

-- Organizador vê todas inscrições dos seus torneios; jogador vê as suas
CREATE POLICY participantes_select ON participantes
  FOR SELECT USING (
    auth.uid()::text = usuario_id::text
    OR auth.uid()::text = team_owner_id::text
    OR auth.uid()::text = organizador_id::text
  );

CREATE POLICY participantes_insert ON participantes
  FOR INSERT WITH CHECK (is_authenticated());

-- Aprovação/rejeição: apenas organizador dono
CREATE POLICY participantes_update ON participantes
  FOR UPDATE USING (
    auth.uid()::text = organizador_id::text
    OR auth.uid()::text = team_owner_id::text
  );

CREATE POLICY participantes_delete ON participantes
  FOR DELETE USING (
    auth.uid()::text = organizador_id::text
    OR auth.uid()::text = team_owner_id::text
  );

-- ─── TIMES ────────────────────────────────────────────────────────────────────
ALTER TABLE times ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS times_select ON times;
DROP POLICY IF EXISTS times_select_public ON times;
DROP POLICY IF EXISTS times_insert ON times;
DROP POLICY IF EXISTS times_update ON times;
DROP POLICY IF EXISTS times_delete ON times;

-- Todos podem ver times (tabela de classificação pública)
CREATE POLICY times_select_public ON times
  FOR SELECT USING (true);

-- Organizer cria times; manager também pode criar o seu
CREATE POLICY times_insert ON times
  FOR INSERT WITH CHECK (
    auth.uid()::text = organizador_id::text
    OR auth.uid()::text = owner_id::text
    OR auth.uid()::text = manager_id::text
  );

-- Só dono/manager e organizador podem editar
CREATE POLICY times_update ON times
  FOR UPDATE USING (
    auth.uid()::text = organizador_id::text
    OR auth.uid()::text = owner_id::text
    OR auth.uid()::text = manager_id::text
  );

CREATE POLICY times_delete ON times
  FOR DELETE USING (
    auth.uid()::text = organizador_id::text
    OR auth.uid()::text = owner_id::text
  );

-- ─── PARTIDAS ─────────────────────────────────────────────────────────────────
ALTER TABLE partidas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS partidas_select ON partidas;
DROP POLICY IF EXISTS partidas_insert ON partidas;
DROP POLICY IF EXISTS partidas_update ON partidas;
DROP POLICY IF EXISTS partidas_delete ON partidas;

-- Partidas são públicas (exibição de resultados)
CREATE POLICY partidas_select ON partidas
  FOR SELECT USING (true);

CREATE POLICY partidas_insert ON partidas
  FOR INSERT WITH CHECK (auth.uid()::text = organizador_id::text);

-- Só o organizador lança resultados
CREATE POLICY partidas_update ON partidas
  FOR UPDATE USING (auth.uid()::text = organizador_id::text);

CREATE POLICY partidas_delete ON partidas
  FOR DELETE USING (auth.uid()::text = organizador_id::text);

-- ─── JOGADORES ────────────────────────────────────────────────────────────────
ALTER TABLE jogadores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jogadores_select ON jogadores;
DROP POLICY IF EXISTS jogadores_insert ON jogadores;
DROP POLICY IF EXISTS jogadores_update ON jogadores;
DROP POLICY IF EXISTS jogadores_delete ON jogadores;

-- Jogadores são visíveis por todos (ranking/estatísticas)
CREATE POLICY jogadores_select ON jogadores
  FOR SELECT USING (true);

CREATE POLICY jogadores_insert ON jogadores
  FOR INSERT WITH CHECK (auth.uid()::text = organizador_id::text);

CREATE POLICY jogadores_update ON jogadores
  FOR UPDATE USING (auth.uid()::text = organizador_id::text);

CREATE POLICY jogadores_delete ON jogadores
  FOR DELETE USING (auth.uid()::text = organizador_id::text);

-- ─── PERFIS ───────────────────────────────────────────────────────────────────
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS perfis_select ON perfis;
DROP POLICY IF EXISTS perfis_insert ON perfis;
DROP POLICY IF EXISTS perfis_update ON perfis;
DROP POLICY IF EXISTS perfis_delete ON perfis;

-- Perfis são públicos
CREATE POLICY perfis_select ON perfis
  FOR SELECT USING (true);

CREATE POLICY perfis_insert ON perfis
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Só o próprio jogador edita o perfil
CREATE POLICY perfis_update ON perfis
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY perfis_delete ON perfis
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- ─── MERCADO TRANSFERÊNCIAS ───────────────────────────────────────────────────
ALTER TABLE mercado_transferencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mercado_transferencias_select ON mercado_transferencias;
DROP POLICY IF EXISTS mercado_transferencias_insert ON mercado_transferencias;
DROP POLICY IF EXISTS mercado_transferencias_update ON mercado_transferencias;
DROP POLICY IF EXISTS mercado_transferencias_delete ON mercado_transferencias;

CREATE POLICY mercado_transferencias_select ON mercado_transferencias
  FOR SELECT USING (true);

CREATE POLICY mercado_transferencias_insert ON mercado_transferencias
  FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY mercado_transferencias_update ON mercado_transferencias
  FOR UPDATE USING (is_authenticated());

CREATE POLICY mercado_transferencias_delete ON mercado_transferencias
  FOR DELETE USING (is_authenticated());

-- ─── RANKING / HALL DA FAMA ───────────────────────────────────────────────────
ALTER TABLE ranking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ranking_select ON ranking;
DROP POLICY IF EXISTS ranking_insert ON ranking;
DROP POLICY IF EXISTS ranking_update ON ranking;
DROP POLICY IF EXISTS ranking_delete ON ranking;

CREATE POLICY ranking_select ON ranking FOR SELECT USING (true);
CREATE POLICY ranking_insert ON ranking FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY ranking_update ON ranking FOR UPDATE USING (is_authenticated());
CREATE POLICY ranking_delete ON ranking FOR DELETE USING (is_authenticated());

ALTER TABLE hall_fama ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hall_fama_select ON hall_fama;
DROP POLICY IF EXISTS hall_fama_insert ON hall_fama;
DROP POLICY IF EXISTS hall_fama_update ON hall_fama;
DROP POLICY IF EXISTS hall_fama_delete ON hall_fama;

CREATE POLICY hall_fama_select ON hall_fama FOR SELECT USING (true);
CREATE POLICY hall_fama_insert ON hall_fama FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY hall_fama_update ON hall_fama FOR UPDATE USING (is_authenticated());
CREATE POLICY hall_fama_delete ON hall_fama FOR DELETE USING (is_authenticated());

-- ─── NOTICIAS / ANUNCIOS ──────────────────────────────────────────────────────
ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS noticias_select ON noticias;
DROP POLICY IF EXISTS noticias_insert ON noticias;
DROP POLICY IF EXISTS noticias_update ON noticias;
DROP POLICY IF EXISTS noticias_delete ON noticias;

CREATE POLICY noticias_select ON noticias FOR SELECT USING (true);

CREATE POLICY noticias_insert ON noticias
  FOR INSERT WITH CHECK (auth.uid()::text = organizador_id::text);

CREATE POLICY noticias_update ON noticias
  FOR UPDATE USING (auth.uid()::text = organizador_id::text);

CREATE POLICY noticias_delete ON noticias
  FOR DELETE USING (auth.uid()::text = organizador_id::text);

ALTER TABLE anuncios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anuncios_select ON anuncios;
DROP POLICY IF EXISTS anuncios_insert ON anuncios;
DROP POLICY IF EXISTS anuncios_update ON anuncios;
DROP POLICY IF EXISTS anuncios_delete ON anuncios;

CREATE POLICY anuncios_select ON anuncios FOR SELECT USING (true);

CREATE POLICY anuncios_insert ON anuncios
  FOR INSERT WITH CHECK (auth.uid()::text = organizador_id::text);

CREATE POLICY anuncios_update ON anuncios
  FOR UPDATE USING (auth.uid()::text = organizador_id::text);

CREATE POLICY anuncios_delete ON anuncios
  FOR DELETE USING (auth.uid()::text = organizador_id::text);

-- ─── MOVIMENTAÇÕES ────────────────────────────────────────────────────────────
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS movimentacoes_select ON movimentacoes;
DROP POLICY IF EXISTS movimentacoes_insert ON movimentacoes;
DROP POLICY IF EXISTS movimentacoes_update ON movimentacoes;
DROP POLICY IF EXISTS movimentacoes_delete ON movimentacoes;

CREATE POLICY movimentacoes_select ON movimentacoes
  FOR SELECT USING (auth.uid()::text = usuario_id::text);

CREATE POLICY movimentacoes_insert ON movimentacoes
  FOR INSERT WITH CHECK (auth.uid()::text = usuario_id::text);

CREATE POLICY movimentacoes_update ON movimentacoes
  FOR UPDATE USING (auth.uid()::text = usuario_id::text);

CREATE POLICY movimentacoes_delete ON movimentacoes
  FOR DELETE USING (auth.uid()::text = usuario_id::text);

-- ─── ÍNDICES DE PERFORMANCE (aplicar uma vez) ─────────────────────────────────
-- Descomente e execute separadamente se ainda não existirem

-- CREATE INDEX IF NOT EXISTS idx_campeonatos_organizador ON campeonatos(organizador_id);
-- CREATE INDEX IF NOT EXISTS idx_times_organizador ON times(organizador_id);
-- CREATE INDEX IF NOT EXISTS idx_times_torneio ON times(tournament_id);
-- CREATE INDEX IF NOT EXISTS idx_partidas_organizador ON partidas(organizador_id);
-- CREATE INDEX IF NOT EXISTS idx_partidas_torneio ON partidas(tournament_id);
-- CREATE INDEX IF NOT EXISTS idx_jogadores_organizador ON jogadores(organizador_id);
-- CREATE INDEX IF NOT EXISTS idx_participantes_organizador ON participantes(organizador_id);
-- CREATE INDEX IF NOT EXISTS idx_participantes_torneio ON participantes(tournament_id);
-- CREATE INDEX IF NOT EXISTS idx_federacoes_slug ON federacoes(slug);
-- CREATE INDEX IF NOT EXISTS idx_usuarios_organizador ON usuarios(organizador_id);
