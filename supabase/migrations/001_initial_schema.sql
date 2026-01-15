-- MMovieNight - Migración inicial
-- "Después de los créditos, empieza la charla."

-- =============================================================================
-- EXTENSIONES
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLAS
-- =============================================================================

-- Tabla de perfiles de usuario (se sincroniza con auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabla de grupos
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  image_url TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabla de membresías (relación usuarios-grupos)
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- Tabla de películas (cache de TMDb)
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  year INTEGER,
  poster_path TEXT,
  backdrop_path TEXT,
  runtime INTEGER,
  overview TEXT,
  director TEXT,
  genres TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabla de películas por grupo (screenings)
CREATE TABLE group_movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  watched_at DATE,
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(group_id, movie_id)
);

-- Tabla de ratings/calificaciones
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  comment TEXT CHECK (char_length(comment) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(group_id, movie_id, user_id)
);

-- Tabla de invitaciones
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- ÍNDICES
-- =============================================================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_group_id ON memberships(group_id);
CREATE INDEX idx_group_movies_group_id ON group_movies(group_id);
CREATE INDEX idx_group_movies_movie_id ON group_movies(movie_id);
CREATE INDEX idx_ratings_group_id ON ratings(group_id);
CREATE INDEX idx_ratings_movie_id ON ratings(movie_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_invites_token_hash ON invites(token_hash);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_invites_group_id ON invites(group_id);
CREATE INDEX idx_movies_tmdb_id ON movies(tmdb_id);

-- =============================================================================
-- FUNCIONES
-- =============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un usuario es miembro de un grupo
CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memberships
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es owner de un grupo
CREATE OR REPLACE FUNCTION is_group_owner(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memberships
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para agregar owner como miembro al crear grupo
CREATE OR REPLACE FUNCTION handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO memberships (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para crear perfil al registrar usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger para agregar owner como miembro
CREATE TRIGGER on_group_created
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION handle_new_group();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLÍTICAS DE PROFILES
-- =============================================================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden ver perfiles de miembros de sus grupos
CREATE POLICY "Users can view group members profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships m1
      JOIN memberships m2 ON m1.group_id = m2.group_id
      WHERE m1.user_id = auth.uid()
      AND m2.user_id = profiles.id
    )
  );

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- POLÍTICAS DE GROUPS
-- =============================================================================

-- Los usuarios solo pueden ver grupos de los que son miembros
CREATE POLICY "Members can view their groups"
  ON groups FOR SELECT
  USING (is_group_member(id, auth.uid()));

-- Cualquier usuario autenticado puede crear grupos
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Solo el owner puede actualizar el grupo
CREATE POLICY "Owners can update their groups"
  ON groups FOR UPDATE
  USING (is_group_owner(id, auth.uid()))
  WITH CHECK (is_group_owner(id, auth.uid()));

-- Solo el owner puede eliminar el grupo
CREATE POLICY "Owners can delete their groups"
  ON groups FOR DELETE
  USING (is_group_owner(id, auth.uid()));

-- =============================================================================
-- POLÍTICAS DE MEMBERSHIPS
-- =============================================================================

-- Los miembros pueden ver membresías de sus grupos
CREATE POLICY "Members can view group memberships"
  ON memberships FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- Solo owners pueden agregar miembros (además del trigger automático)
CREATE POLICY "Owners can add members"
  ON memberships FOR INSERT
  WITH CHECK (
    is_group_owner(group_id, auth.uid())
    OR (user_id = auth.uid() AND role = 'member') -- Para unirse por invitación
  );

-- Solo owners pueden modificar roles
CREATE POLICY "Owners can update memberships"
  ON memberships FOR UPDATE
  USING (is_group_owner(group_id, auth.uid()))
  WITH CHECK (is_group_owner(group_id, auth.uid()));

-- Los miembros pueden salir del grupo (eliminarse a sí mismos)
CREATE POLICY "Members can leave groups"
  ON memberships FOR DELETE
  USING (
    user_id = auth.uid()
    OR is_group_owner(group_id, auth.uid())
  );

-- =============================================================================
-- POLÍTICAS DE MOVIES
-- =============================================================================

-- Las películas son públicas (cache de TMDb)
CREATE POLICY "Anyone can view movies"
  ON movies FOR SELECT
  USING (true);

-- Cualquier usuario autenticado puede agregar películas (cache)
CREATE POLICY "Authenticated users can insert movies"
  ON movies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- POLÍTICAS DE GROUP_MOVIES
-- =============================================================================

-- Solo miembros pueden ver películas del grupo
CREATE POLICY "Members can view group movies"
  ON group_movies FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- Solo miembros pueden agregar películas al grupo
CREATE POLICY "Members can add movies to groups"
  ON group_movies FOR INSERT
  WITH CHECK (
    is_group_member(group_id, auth.uid())
    AND added_by = auth.uid()
  );

-- Solo el que agregó o el owner puede modificar
CREATE POLICY "Members can update their added movies"
  ON group_movies FOR UPDATE
  USING (
    added_by = auth.uid()
    OR is_group_owner(group_id, auth.uid())
  );

-- Solo el owner puede eliminar películas del grupo
CREATE POLICY "Owners can delete group movies"
  ON group_movies FOR DELETE
  USING (is_group_owner(group_id, auth.uid()));

-- =============================================================================
-- POLÍTICAS DE RATINGS
-- =============================================================================

-- Solo miembros pueden ver ratings del grupo
CREATE POLICY "Members can view group ratings"
  ON ratings FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- Solo miembros pueden crear sus propios ratings
CREATE POLICY "Members can create their ratings"
  ON ratings FOR INSERT
  WITH CHECK (
    is_group_member(group_id, auth.uid())
    AND user_id = auth.uid()
  );

-- Los usuarios solo pueden actualizar sus propios ratings
CREATE POLICY "Users can update their ratings"
  ON ratings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Los usuarios solo pueden eliminar sus propios ratings
CREATE POLICY "Users can delete their ratings"
  ON ratings FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- POLÍTICAS DE INVITES
-- =============================================================================

-- Solo miembros del grupo pueden ver invitaciones
CREATE POLICY "Members can view group invites"
  ON invites FOR SELECT
  USING (
    is_group_member(group_id, auth.uid())
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Solo owners y miembros pueden crear invitaciones
CREATE POLICY "Members can create invites"
  ON invites FOR INSERT
  WITH CHECK (
    is_group_member(group_id, auth.uid())
    AND invited_by = auth.uid()
  );

-- Solo el que invitó o el owner puede actualizar (marcar como aceptada)
CREATE POLICY "Invited users can accept invites"
  ON invites FOR UPDATE
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR invited_by = auth.uid()
    OR is_group_owner(group_id, auth.uid())
  );

-- Solo owners pueden eliminar invitaciones
CREATE POLICY "Owners can delete invites"
  ON invites FOR DELETE
  USING (is_group_owner(group_id, auth.uid()));

-- =============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =============================================================================

COMMENT ON TABLE profiles IS 'Perfiles de usuario sincronizados con auth.users';
COMMENT ON TABLE groups IS 'Grupos de amigos para ver películas juntos';
COMMENT ON TABLE memberships IS 'Relación entre usuarios y grupos con roles';
COMMENT ON TABLE movies IS 'Cache local de películas de TMDb';
COMMENT ON TABLE group_movies IS 'Películas agregadas a cada grupo (screenings)';
COMMENT ON TABLE ratings IS 'Calificaciones de usuarios por película por grupo';
COMMENT ON TABLE invites IS 'Invitaciones pendientes a grupos';

COMMENT ON FUNCTION is_group_member IS 'Verifica si un usuario es miembro de un grupo';
COMMENT ON FUNCTION is_group_owner IS 'Verifica si un usuario es owner de un grupo';
