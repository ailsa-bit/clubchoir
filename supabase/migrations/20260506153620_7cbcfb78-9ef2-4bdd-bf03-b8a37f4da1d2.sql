
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  member_match RECORD;
  new_status text;
  display text;
  parsed_first text;
  parsed_last text;
BEGIN
  SELECT * INTO member_match
  FROM public.members
  WHERE LOWER(email) = LOWER(NEW.email)
    AND status = 'ACTIVE'
  LIMIT 1;

  IF member_match IS NOT NULL THEN
    new_status := 'active';
  ELSE
    new_status := 'inactive';
  END IF;

  INSERT INTO public.profiles (user_id, display_name, location, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(member_match.location, NEW.raw_user_meta_data->>'location'),
    new_status
  );

  IF NOT EXISTS (SELECT 1 FROM public.members WHERE LOWER(email) = LOWER(NEW.email)) THEN
    display := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''), split_part(NEW.email, '@', 1));
    IF position(' ' IN display) > 0 THEN
      parsed_first := split_part(display, ' ', 1);
      parsed_last := TRIM(substring(display FROM position(' ' IN display) + 1));
    ELSE
      parsed_first := display;
      parsed_last := '';
    END IF;

    INSERT INTO public.members (first_name, last_name, email, location, status, joined)
    VALUES (
      parsed_first,
      parsed_last,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'location', ''),
      'ACTIVE',
      CURRENT_DATE
    );
  END IF;

  RETURN NEW;
END;
$function$;
