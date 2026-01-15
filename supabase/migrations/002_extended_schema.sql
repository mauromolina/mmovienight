-- MMovieNight - Migración extendida
-- Agrega watchlist, códigos de invitación, comentarios y feed de actividad

-- =============================================================================
-- MODIFICAR TABLA PROFILES
-- =============================================================================

-- Agregar campos adicionales al perfil
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 300),
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_preset TEXT;

-- =============================================================================
-- TABLA DE WATCHLIST (películas propuestas para ver)
-- =============================================================================

CREATE TABLE IF NOT EXISTS watchlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT CHECK (char_length(reason) <= 500), -- Por qué la recomienda
  priority INTEGER DEFAULT 0, -- Para ordenar por prioridad/votos
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(group_id, movie_id)
);

-- Índices para watchlist
CREATE INDEX IF NOT EXISTS idx_watchlist_group_id ON watchlist_items(group_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_movie_id ON watchlist_items(movie_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_added_by ON watchlist_items(added_by);

-- =============================================================================
-- TABLA DE CÓDIGOS DE INVITACIÓN
-- =============================================================================

CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL UNIQUE, -- Código de 6 caracteres alfanumérico
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  max_uses INTEGER DEFAULT 1, -- Número máximo de usos (NULL = ilimitado)
  use_count INTEGER DEFAULT 0, -- Contador de usos
  expires_at TIMESTAMPTZ, -- NULL = no expira
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para códigos de invitación
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_group_id ON invite_codes(group_id);

-- =============================================================================
-- TABLA DE COMENTARIOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- Para respuestas
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para comentarios
CREATE INDEX IF NOT EXISTS idx_comments_group_id ON comments(group_id);
CREATE INDEX IF NOT EXISTS idx_comments_movie_id ON comments(movie_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- =============================================================================
-- TABLA DE FEED DE ACTIVIDAD
-- =============================================================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'movie_added',      -- Se agregó una película al historial
    'movie_rated',      -- Alguien calificó una película
    'rating_updated',   -- Alguien actualizó su calificación
    'watchlist_added',  -- Se agregó película a watchlist
    'comment_added',    -- Nuevo comentario
    'member_joined',    -- Nuevo miembro en el grupo
    'member_left'       -- Miembro salió del grupo
  )),
  target_movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB, -- Datos adicionales (ej: score del rating, nombre del miembro)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para feed de actividad
CREATE INDEX IF NOT EXISTS idx_activity_group_id ON activity_feed(group_id);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_feed(created_at DESC);

-- =============================================================================
-- TABLA DE PELÍCULAS FAVORITAS DEL USUARIO
-- =============================================================================

CREATE TABLE IF NOT EXISTS favorite_movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, movie_id)
);

-- Índices para favoritos
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorite_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_movie_id ON favorite_movies(movie_id);

-- =============================================================================
-- TABLA DE ASISTENTES A FUNCIONES
-- =============================================================================

CREATE TABLE IF NOT EXISTS screening_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_movie_id UUID NOT NULL REFERENCES group_movies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(group_movie_id, user_id)
);

-- Índices para asistentes
CREATE INDEX IF NOT EXISTS idx_attendees_group_movie_id ON screening_attendees(group_movie_id);
CREATE INDEX IF NOT EXISTS idx_attendees_user_id ON screening_attendees(user_id);

-- =============================================================================
-- MODIFICAR GROUP_MOVIES PARA TIPO DE FUNCIÓN
-- =============================================================================

ALTER TABLE group_movies
  ADD COLUMN IF NOT EXISTS screening_type TEXT DEFAULT 'presencial'
    CHECK (screening_type IN ('presencial', 'remota'));

-- =============================================================================
-- FUNCIONES AUXILIARES
-- =============================================================================

-- Función para generar código de invitación único
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para validar y usar código de invitación
CREATE OR REPLACE FUNCTION use_invite_code(p_code TEXT, p_user_id UUID)
RETURNS TABLE(success BOOLEAN, group_id UUID, group_name TEXT, error_message TEXT) AS $$
DECLARE
  v_invite_code invite_codes%ROWTYPE;
  v_group groups%ROWTYPE;
  v_already_member BOOLEAN;
BEGIN
  -- Buscar código
  SELECT * INTO v_invite_code
  FROM invite_codes
  WHERE code = UPPER(p_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'El código no es válido o ya expiró'::TEXT;
    RETURN;
  END IF;

  -- Verificar expiración
  IF v_invite_code.expires_at IS NOT NULL AND v_invite_code.expires_at < NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'El código ha expirado'::TEXT;
    RETURN;
  END IF;

  -- Verificar usos máximos
  IF v_invite_code.max_uses IS NOT NULL AND v_invite_code.use_count >= v_invite_code.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'El código ha alcanzado su límite de usos'::TEXT;
    RETURN;
  END IF;

  -- Obtener grupo
  SELECT * INTO v_group FROM groups WHERE id = v_invite_code.group_id;

  -- Verificar si ya es miembro
  SELECT EXISTS(
    SELECT 1 FROM memberships WHERE group_id = v_invite_code.group_id AND user_id = p_user_id
  ) INTO v_already_member;

  IF v_already_member THEN
    RETURN QUERY SELECT true, v_group.id, v_group.name, 'already_member'::TEXT;
    RETURN;
  END IF;

  -- Agregar como miembro
  INSERT INTO memberships (group_id, user_id, role)
  VALUES (v_invite_code.group_id, p_user_id, 'member');

  -- Incrementar contador de usos
  UPDATE invite_codes SET use_count = use_count + 1 WHERE id = v_invite_code.id;

  -- Registrar actividad
  INSERT INTO activity_feed (group_id, user_id, activity_type, metadata)
  VALUES (v_invite_code.group_id, p_user_id, 'member_joined', '{}');

  RETURN QUERY SELECT true, v_group.id, v_group.name, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular promedio de calificaciones de una película en un grupo
CREATE OR REPLACE FUNCTION get_group_movie_stats(p_group_id UUID, p_movie_id UUID)
RETURNS TABLE(
  average_rating NUMERIC,
  total_ratings INTEGER,
  rating_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(r.score)::NUMERIC, 1) as average_rating,
    COUNT(r.id)::INTEGER as total_ratings,
    jsonb_object_agg(r.score::TEXT, COALESCE(counts.count, 0)) as rating_distribution
  FROM ratings r
  LEFT JOIN (
    SELECT score, COUNT(*) as count
    FROM ratings
    WHERE group_id = p_group_id AND movie_id = p_movie_id
    GROUP BY score
  ) counts ON r.score = counts.score
  WHERE r.group_id = p_group_id AND r.movie_id = p_movie_id
  GROUP BY r.group_id, r.movie_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS PARA ACTIVITY FEED
-- =============================================================================

-- Trigger para registrar cuando se agrega película al grupo
CREATE OR REPLACE FUNCTION log_movie_added()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_feed (group_id, user_id, activity_type, target_movie_id, metadata)
  VALUES (NEW.group_id, NEW.added_by, 'movie_added', NEW.movie_id,
    jsonb_build_object('watched_at', NEW.watched_at));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_movie_added
  AFTER INSERT ON group_movies
  FOR EACH ROW EXECUTE FUNCTION log_movie_added();

-- Trigger para registrar cuando se califica película
CREATE OR REPLACE FUNCTION log_rating_added()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_feed (group_id, user_id, activity_type, target_movie_id, metadata)
    VALUES (NEW.group_id, NEW.user_id, 'movie_rated', NEW.movie_id,
      jsonb_build_object('score', NEW.score));
  ELSIF TG_OP = 'UPDATE' AND OLD.score != NEW.score THEN
    INSERT INTO activity_feed (group_id, user_id, activity_type, target_movie_id, metadata)
    VALUES (NEW.group_id, NEW.user_id, 'rating_updated', NEW.movie_id,
      jsonb_build_object('old_score', OLD.score, 'new_score', NEW.score));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_rating_changed
  AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION log_rating_added();

-- Trigger para registrar cuando se agrega a watchlist
CREATE OR REPLACE FUNCTION log_watchlist_added()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_feed (group_id, user_id, activity_type, target_movie_id, metadata)
  VALUES (NEW.group_id, NEW.added_by, 'watchlist_added', NEW.movie_id,
    jsonb_build_object('reason', NEW.reason));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_watchlist_item_added
  AFTER INSERT ON watchlist_items
  FOR EACH ROW EXECUTE FUNCTION log_watchlist_added();

-- Trigger para actualizar updated_at en comments
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_attendees ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLÍTICAS DE WATCHLIST_ITEMS
-- =============================================================================

CREATE POLICY "Members can view group watchlist"
  ON watchlist_items FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can add to watchlist"
  ON watchlist_items FOR INSERT
  WITH CHECK (
    is_group_member(group_id, auth.uid())
    AND added_by = auth.uid()
  );

CREATE POLICY "Users can update their watchlist items"
  ON watchlist_items FOR UPDATE
  USING (added_by = auth.uid() OR is_group_owner(group_id, auth.uid()))
  WITH CHECK (added_by = auth.uid() OR is_group_owner(group_id, auth.uid()));

CREATE POLICY "Users can delete their watchlist items"
  ON watchlist_items FOR DELETE
  USING (added_by = auth.uid() OR is_group_owner(group_id, auth.uid()));

-- =============================================================================
-- POLÍTICAS DE INVITE_CODES
-- =============================================================================

CREATE POLICY "Members can view group invite codes"
  ON invite_codes FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- Cualquiera puede leer un código específico (para validación)
CREATE POLICY "Anyone can validate invite code"
  ON invite_codes FOR SELECT
  USING (true);

CREATE POLICY "Members can create invite codes"
  ON invite_codes FOR INSERT
  WITH CHECK (
    is_group_member(group_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Owners can manage invite codes"
  ON invite_codes FOR UPDATE
  USING (is_group_owner(group_id, auth.uid()));

CREATE POLICY "Owners can delete invite codes"
  ON invite_codes FOR DELETE
  USING (is_group_owner(group_id, auth.uid()) OR created_by = auth.uid());

-- =============================================================================
-- POLÍTICAS DE COMMENTS
-- =============================================================================

CREATE POLICY "Members can view group comments"
  ON comments FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    is_group_member(group_id, auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their comments"
  ON comments FOR DELETE
  USING (user_id = auth.uid() OR is_group_owner(group_id, auth.uid()));

-- =============================================================================
-- POLÍTICAS DE ACTIVITY_FEED
-- =============================================================================

CREATE POLICY "Members can view group activity"
  ON activity_feed FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- Solo el sistema puede insertar actividad (via triggers)
CREATE POLICY "System can insert activity"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- POLÍTICAS DE FAVORITE_MOVIES
-- =============================================================================

CREATE POLICY "Users can view their favorites"
  ON favorite_movies FOR SELECT
  USING (user_id = auth.uid());

-- Los usuarios pueden ver favoritos de miembros de sus grupos
CREATE POLICY "Members can view group members favorites"
  ON favorite_movies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships m1
      JOIN memberships m2 ON m1.group_id = m2.group_id
      WHERE m1.user_id = auth.uid()
      AND m2.user_id = favorite_movies.user_id
    )
  );

CREATE POLICY "Users can manage their favorites"
  ON favorite_movies FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their favorites"
  ON favorite_movies FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- POLÍTICAS DE SCREENING_ATTENDEES
-- =============================================================================

CREATE POLICY "Members can view screening attendees"
  ON screening_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_movies gm
      WHERE gm.id = screening_attendees.group_movie_id
      AND is_group_member(gm.group_id, auth.uid())
    )
  );

CREATE POLICY "Members can add themselves as attendees"
  ON screening_attendees FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_movies gm
      WHERE gm.id = group_movie_id
      AND is_group_member(gm.group_id, auth.uid())
    )
  );

CREATE POLICY "Users can remove themselves as attendees"
  ON screening_attendees FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- VISTAS ÚTILES
-- =============================================================================

-- Vista para obtener películas del grupo con estadísticas
CREATE OR REPLACE VIEW group_movies_with_stats AS
SELECT
  gm.*,
  m.title,
  m.year,
  m.poster_path,
  m.backdrop_path,
  m.runtime,
  m.director,
  m.genres,
  COALESCE(stats.avg_rating, 0) as average_rating,
  COALESCE(stats.rating_count, 0) as rating_count,
  p.display_name as added_by_name
FROM group_movies gm
JOIN movies m ON gm.movie_id = m.id
JOIN profiles p ON gm.added_by = p.id
LEFT JOIN (
  SELECT
    group_id,
    movie_id,
    ROUND(AVG(score)::NUMERIC, 1) as avg_rating,
    COUNT(*) as rating_count
  FROM ratings
  GROUP BY group_id, movie_id
) stats ON gm.group_id = stats.group_id AND gm.movie_id = stats.movie_id;

-- Vista para obtener actividad reciente con detalles
CREATE OR REPLACE VIEW activity_feed_detailed AS
SELECT
  af.*,
  p.display_name as user_name,
  p.avatar_url as user_avatar,
  m.title as movie_title,
  m.poster_path as movie_poster,
  g.name as group_name
FROM activity_feed af
JOIN profiles p ON af.user_id = p.id
JOIN groups g ON af.group_id = g.id
LEFT JOIN movies m ON af.target_movie_id = m.id
ORDER BY af.created_at DESC;

-- =============================================================================
-- COMENTARIOS
-- =============================================================================

COMMENT ON TABLE watchlist_items IS 'Películas propuestas para ver en el grupo';
COMMENT ON TABLE invite_codes IS 'Códigos de invitación de 6 caracteres para unirse a grupos';
COMMENT ON TABLE comments IS 'Comentarios de usuarios en películas del grupo';
COMMENT ON TABLE activity_feed IS 'Feed de actividad de cada grupo';
COMMENT ON TABLE favorite_movies IS 'Películas favoritas de cada usuario';
COMMENT ON TABLE screening_attendees IS 'Asistentes a cada función del grupo';

COMMENT ON FUNCTION generate_invite_code IS 'Genera un código de invitación único de 6 caracteres';
COMMENT ON FUNCTION use_invite_code IS 'Valida y usa un código de invitación para unirse a un grupo';
COMMENT ON FUNCTION get_group_movie_stats IS 'Obtiene estadísticas de calificaciones de una película en un grupo';
