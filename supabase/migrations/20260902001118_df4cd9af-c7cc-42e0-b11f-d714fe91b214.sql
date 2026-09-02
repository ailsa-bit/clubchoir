create or replace function public.get_my_member_profile()
returns table(display_name text, email text, status text, active_until date, location text, member_since date)
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  uemail text;
  p record;
  m record;
begin
  if uid is null then return; end if;
  select lower(u.email) into uemail from auth.users u where u.id = uid;
  select * into p from public.profiles pr where pr.user_id = uid limit 1;
  select * into m from public.members mb where lower(mb.email) = uemail and mb.archived_at is null
   order by mb.joined nulls last limit 1;

  return query select
    coalesce(
      nullif(trim(coalesce(m.first_name,'') || ' ' || coalesce(m.last_name,'')), ''),
      p.display_name,
      uemail
    ),
    uemail,
    coalesce(p.status, 'inactive'),
    p.active_until,
    coalesce(nullif(m.location, ''), p.location),
    m.joined;
end;
$function$;