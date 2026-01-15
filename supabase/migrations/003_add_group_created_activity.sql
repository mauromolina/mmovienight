-- Migration: Add 'group_created' activity type
-- This migration updates the CHECK constraint on activity_feed to include group_created

-- Drop the existing constraint
ALTER TABLE activity_feed DROP CONSTRAINT IF EXISTS activity_feed_activity_type_check;

-- Add the updated constraint with group_created
ALTER TABLE activity_feed ADD CONSTRAINT activity_feed_activity_type_check
  CHECK (activity_type IN (
    'group_created',    -- Se creó un nuevo grupo
    'movie_added',      -- Se agregó una película al historial
    'movie_rated',      -- Alguien calificó una película
    'rating_updated',   -- Alguien actualizó su calificación
    'watchlist_added',  -- Se agregó película a watchlist
    'comment_added',    -- Nuevo comentario
    'member_joined',    -- Nuevo miembro en el grupo
    'member_left'       -- Miembro salió del grupo
  ));
