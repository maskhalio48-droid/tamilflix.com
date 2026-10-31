-- Tamilflix series support migration.
-- Assumption: public.movies.id is UUID (usual Supabase-generated ID).
-- Run in Supabase SQL Editor. Existing movie rows are preserved.
ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'movie';
UPDATE public.movies SET content_type='series' WHERE lower(coalesce(category,''))='series' AND content_type='movie';

CREATE TABLE IF NOT EXISTS public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  name text NOT NULL,
  season_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(movie_id, season_number)
);
CREATE TABLE IF NOT EXISTS public.episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  language text NOT NULL DEFAULT 'Tamil',
  video_url text NOT NULL,
  episode_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(season_id, episode_number)
);
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view seasons for active titles" ON public.seasons;
CREATE POLICY "Public can view seasons for active titles" ON public.seasons FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.movies m WHERE m.id=seasons.movie_id AND m.is_active=true));
DROP POLICY IF EXISTS "Admins manage seasons" ON public.seasons;
CREATE POLICY "Admins manage seasons" ON public.seasons FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id=auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id=auth.uid()));
DROP POLICY IF EXISTS "Public can view episodes for active titles" ON public.episodes;
CREATE POLICY "Public can view episodes for active titles" ON public.episodes FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.seasons s JOIN public.movies m ON m.id=s.movie_id WHERE s.id=episodes.season_id AND m.is_active=true));
DROP POLICY IF EXISTS "Admins manage episodes" ON public.episodes;
CREATE POLICY "Admins manage episodes" ON public.episodes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id=auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id=auth.uid()));
CREATE INDEX IF NOT EXISTS seasons_movie_id_idx ON public.seasons(movie_id);
CREATE INDEX IF NOT EXISTS episodes_season_id_idx ON public.episodes(season_id);
