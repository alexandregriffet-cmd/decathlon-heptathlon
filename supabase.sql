-- Déca · Hepta : personnages partagés (à exécuter une fois dans Supabase > SQL Editor)
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cat text not null check (cat in ('DEC','HEP')),
  data jsonb not null,
  code_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Personne ne lit ni n'écrit directement : tout passe par les fonctions ci-dessous
alter table public.characters enable row level security;
revoke all on public.characters from anon, authenticated;

-- Liste publique (sans le code secret)
create or replace function public.list_characters(p_cat text)
returns table(id uuid, name text, cat text, data jsonb, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select c.id, c.name, c.cat, c.data, c.updated_at
  from public.characters c
  where c.cat = p_cat
  order by c.updated_at desc
  limit 200;
$$;

-- Publication (p_id nul) ou mise à jour (p_id + code secret)
create or replace function public.publish_character(p_id uuid, p_code text, p_name text, p_cat text, p_data jsonb)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_hash text;
begin
  if p_cat not in ('DEC','HEP') then raise exception 'categorie invalide'; end if;
  if p_code is null or length(p_code) < 4 or length(p_code) > 64 then raise exception 'code invalide'; end if;
  if p_name is null or length(trim(p_name)) < 1 or length(p_name) > 60 then raise exception 'nom invalide'; end if;
  if p_data is null or length(p_data::text) > 6000 then raise exception 'donnees invalides'; end if;
  if p_id is null then
    if (select count(*) from public.characters) >= 5000 then raise exception 'base pleine'; end if;
    insert into public.characters(name, cat, data, code_hash)
    values (trim(p_name), p_cat, p_data, crypt(p_code, gen_salt('bf')))
    returning id into v_id;
    return v_id;
  end if;
  select code_hash into v_hash from public.characters where id = p_id;
  if v_hash is null or crypt(p_code, v_hash) <> v_hash then raise exception 'code incorrect'; end if;
  update public.characters
    set name = trim(p_name), cat = p_cat, data = p_data, updated_at = now()
  where id = p_id;
  return p_id;
end $$;

-- Retrait d'un personnage (avec son code secret)
create or replace function public.delete_character(p_id uuid, p_code text)
returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text;
begin
  select code_hash into v_hash from public.characters where id = p_id;
  if v_hash is null or crypt(p_code, v_hash) <> v_hash then raise exception 'code incorrect'; end if;
  delete from public.characters where id = p_id;
  return true;
end $$;

grant execute on function public.list_characters(text) to anon, authenticated;
grant execute on function public.publish_character(uuid, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.delete_character(uuid, text) to anon, authenticated;
