ALTER TABLE public.song_resources DROP CONSTRAINT song_resources_part_valid;
ALTER TABLE public.song_resources ADD CONSTRAINT song_resources_part_valid CHECK (part IS NULL OR part = ANY (ARRAY['blue','pink','floaters','all','portrait-en','portrait-fr','landscape-en','landscape-fr']));
ALTER TABLE public.song_resources DROP CONSTRAINT song_resources_resource_type_check;
ALTER TABLE public.song_resources ADD CONSTRAINT song_resources_resource_type_check CHECK (resource_type = ANY (ARRAY['audio','lyrics','sheet_music','slides','invitation']));