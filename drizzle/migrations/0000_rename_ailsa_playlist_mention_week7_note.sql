update public.weekly_announcements
set message_en = replace(message_en, 'the Ailsa Fall Session playlist on YouTube', 'the Ailsa (YouTube Recordings) playlist'),
    message_fr = replace(message_fr, 'la liste de lecture YouTube Ailsa Fall Session', 'la liste de lecture « Ailsa (enregistrements YouTube) »'),
    updated_at = now()
where id = 'c8abecc5-5179-4e4b-8668-1391a45002ed';