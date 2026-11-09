-- Déca · Hepta : salles de jeu en ligne (à exécuter une fois dans Supabase > SQL Editor, après supabase.sql)
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.rooms (
  code text primary key,
  created_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  nseats int not null default 0
);
create table if not exists public.room_seats (
  code text not null references public.rooms(code) on delete cascade,
  seat int not null,
  token text not null,
  primary key (code, seat)
);
create table if not exists public.room_msgs (
  seq bigint generated always as identity primary key,
  code text not null references public.rooms(code) on delete cascade,
  seat int not null,
  kind text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists room_msgs_code_seq on public.room_msgs(code, seq);

-- Personne ne lit ni n'écrit directement : tout passe par les fonctions ci-dessous
alter table public.rooms enable row level security;
alter table public.room_seats enable row level security;
alter table public.room_msgs enable row level security;
revoke all on public.rooms, public.room_seats, public.room_msgs from anon, authenticated;

-- Création d'une salle (l'hôte est le siège 0)
create or replace function public.room_open()
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v_code text; v_tok text; i int := 0;
  v_alpha text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
begin
  delete from public.rooms where last_at < now() - interval '12 hours';
  if (select count(*) from public.rooms) >= 800 then raise exception 'trop de salles ouvertes, réessaie plus tard'; end if;
  loop
    v_code := '';
    for i in 1..5 loop v_code := v_code || substr(v_alpha, 1 + floor(random() * length(v_alpha))::int, 1); end loop;
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;
  v_tok := encode(gen_random_bytes(12), 'hex');
  insert into public.rooms(code, nseats) values (v_code, 1);
  insert into public.room_seats(code, seat, token) values (v_code, 0, v_tok);
  return json_build_object('code', v_code, 'seat', 0, 'token', v_tok);
end $$;

-- Rejoindre une salle (16 joueurs maximum)
create or replace function public.room_join(p_code text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v_n int; v_tok text; v_head bigint; v_code text := upper(trim(p_code));
begin
  select nseats into v_n from public.rooms where code = v_code for update;
  if v_n is null then raise exception 'salle inconnue ou expirée'; end if;
  if v_n >= 16 then raise exception 'salle pleine (16 joueurs)'; end if;
  v_tok := encode(gen_random_bytes(12), 'hex');
  insert into public.room_seats(code, seat, token) values (v_code, v_n, v_tok);
  update public.rooms set nseats = v_n + 1, last_at = now() where code = v_code;
  select coalesce(max(seq), 0) into v_head from public.room_msgs where code = v_code;
  return json_build_object('seat', v_n, 'token', v_tok, 'head', v_head);
end $$;

-- Envoi d'un message dans la salle
create or replace function public.room_send(p_code text, p_seat int, p_token text, p_kind text, p_data jsonb)
returns bigint
language plpgsql security definer set search_path = public, extensions as $$
declare v_seq bigint; v_code text := upper(trim(p_code));
begin
  if not exists (select 1 from public.room_seats where code = v_code and seat = p_seat and token = p_token) then
    raise exception 'siège incorrect';
  end if;
  if p_kind not in ('hello','cfg','start','roll','pass','bye','state') then raise exception 'type invalide'; end if;
  if p_kind in ('cfg','start') and p_seat <> 0 then raise exception 'réservé à l''hôte'; end if;
  if p_data is null or length(p_data::text) > 60000 then raise exception 'données invalides'; end if;
  if (select count(*) from public.room_msgs where code = v_code) >= 20000 then raise exception 'salle saturée'; end if;
  insert into public.room_msgs(code, seat, kind, data) values (v_code, p_seat, p_kind, p_data) returning seq into v_seq;
  update public.rooms set last_at = now() where code = v_code;
  return v_seq;
end $$;

-- Lecture des messages d'une salle depuis un numéro donné
create or replace function public.room_poll(p_code text, p_after bigint)
returns table(seq bigint, seat int, kind text, data jsonb)
language plpgsql security definer set search_path = public as $$
declare v_code text := upper(trim(p_code));
begin
  if not exists (select 1 from public.rooms where code = v_code) then raise exception 'salle inconnue ou expirée'; end if;
  return query select m.seq, m.seat, m.kind, m.data from public.room_msgs m
    where m.code = v_code and m.seq > p_after order by m.seq limit 400;
end $$;

grant execute on function public.room_open() to anon, authenticated;
grant execute on function public.room_join(text) to anon, authenticated;
grant execute on function public.room_send(text, int, text, text, jsonb) to anon, authenticated;
grant execute on function public.room_poll(text, bigint) to anon, authenticated;

notify pgrst, 'reload schema';
