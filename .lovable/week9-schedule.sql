SELECT cron.schedule('week9-choir-tonight-montreal', '0 13 2 11 *', $job$
DO $send$
BEGIN
  IF now() >= timestamptz '2026-11-02 08:00:00 America/Toronto'
     AND now() < timestamptz '2026-11-02 08:00:00 America/Toronto' + interval '15 minutes' THEN
    PERFORM net.http_post(
      url := 'https://vbbfpzszmtwhydhpgtgj.supabase.co/functions/v1/send-campaign',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-token', (SELECT token FROM public.cron_tokens WHERE name = 'send-campaign')),
      body := jsonb_build_object('segment', 'choir-tonight', 'location', 'Montreal', 'expectCampaignKey', 'fall-2026-choir-tonight-week9-v1'),
      timeout_milliseconds := 125000
    );
  END IF;
  PERFORM cron.unschedule('week9-choir-tonight-montreal');
END $send$;
$job$);

SELECT cron.schedule('week9-choir-tonight-hudson', '0 13 3 11 *', $job$
DO $send$
BEGIN
  IF now() >= timestamptz '2026-11-03 08:00:00 America/Toronto'
     AND now() < timestamptz '2026-11-03 08:00:00 America/Toronto' + interval '15 minutes' THEN
    PERFORM net.http_post(
      url := 'https://vbbfpzszmtwhydhpgtgj.supabase.co/functions/v1/send-campaign',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-token', (SELECT token FROM public.cron_tokens WHERE name = 'send-campaign')),
      body := jsonb_build_object('segment', 'choir-tonight', 'location', 'Hudson', 'expectCampaignKey', 'fall-2026-choir-tonight-week9-v1'),
      timeout_milliseconds := 125000
    );
  END IF;
  PERFORM cron.unschedule('week9-choir-tonight-hudson');
END $send$;
$job$);

SELECT cron.schedule('week9-choir-tonight-saint-hubert', '0 13 4 11 *', $job$
DO $send$
BEGIN
  IF now() >= timestamptz '2026-11-04 08:00:00 America/Toronto'
     AND now() < timestamptz '2026-11-04 08:00:00 America/Toronto' + interval '15 minutes' THEN
    PERFORM net.http_post(
      url := 'https://vbbfpzszmtwhydhpgtgj.supabase.co/functions/v1/send-campaign',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-token', (SELECT token FROM public.cron_tokens WHERE name = 'send-campaign')),
      body := jsonb_build_object('segment', 'choir-tonight', 'location', 'Saint-Hubert', 'expectCampaignKey', 'fall-2026-choir-tonight-week9-v1'),
      timeout_milliseconds := 125000
    );
  END IF;
  PERFORM cron.unschedule('week9-choir-tonight-saint-hubert');
END $send$;
$job$);

SELECT cron.schedule('week9-choir-tonight-pointe-claire', '0 13 5 11 *', $job$
DO $send$
BEGIN
  IF now() >= timestamptz '2026-11-05 08:00:00 America/Toronto'
     AND now() < timestamptz '2026-11-05 08:00:00 America/Toronto' + interval '15 minutes' THEN
    PERFORM net.http_post(
      url := 'https://vbbfpzszmtwhydhpgtgj.supabase.co/functions/v1/send-campaign',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-token', (SELECT token FROM public.cron_tokens WHERE name = 'send-campaign')),
      body := jsonb_build_object('segment', 'choir-tonight', 'location', 'Pointe-Claire', 'expectCampaignKey', 'fall-2026-choir-tonight-week9-v1'),
      timeout_milliseconds := 125000
    );
  END IF;
  PERFORM cron.unschedule('week9-choir-tonight-pointe-claire');
END $send$;
$job$);