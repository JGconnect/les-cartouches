-- =====================================================================
-- Jozzo (ex-Les Cartouches) : cartes perso partagées par une bande (code de groupe)
-- À coller dans le SQL Editor de Supabase, puis « Run ». Sans risque
-- pour les avis existants : crée seulement une nouvelle table.
--
-- Sécurité : la table n'est pas lisible directement depuis le site.
-- On passe par 3 fonctions qui exigent le code du groupe (10 caractères
-- aléatoires, impossible à deviner) : lire, ajouter, supprimer.
-- =====================================================================
create table if not exists public.cartes_groupe (
  id      bigint generated always as identity primary key,
  groupe  text not null check (groupe ~ '^[A-Z0-9]{8,16}$'),
  jeu     text not null check (jeu in ('coupable','tribunal','dilemme','chrono','vraifaux','quiadit','liste','taboo')),
  carte   text not null check (char_length(carte) between 1 and 400),
  cree_le timestamptz not null default now()
);
create index if not exists cartes_groupe_groupe_idx on public.cartes_groupe (groupe);

alter table public.cartes_groupe enable row level security;
revoke all on table public.cartes_groupe from anon, authenticated;

create or replace function public.cartes_du_groupe(code text)
returns table (id bigint, jeu text, carte text)
language sql security definer set search_path = public stable as $$
  select c.id, c.jeu, c.carte from public.cartes_groupe c
  where c.groupe = upper(code) order by c.id limit 2000;
$$;

create or replace function public.ajouter_carte_groupe(code text, p_jeu text, p_carte text)
returns bigint
language plpgsql security definer set search_path = public as $$
declare n int; new_id bigint;
begin
  if upper(code) !~ '^[A-Z0-9]{8,16}$' then raise exception 'code invalide'; end if;
  select count(*) into n from public.cartes_groupe where groupe = upper(code);
  if n >= 1000 then raise exception 'groupe plein'; end if;
  select c.id into new_id from public.cartes_groupe c
    where c.groupe = upper(code) and c.jeu = p_jeu and c.carte = p_carte limit 1;
  if new_id is not null then return new_id; end if;
  insert into public.cartes_groupe (groupe, jeu, carte) values (upper(code), p_jeu, p_carte)
    returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.supprimer_carte_groupe(code text, p_id bigint)
returns void
language sql security definer set search_path = public as $$
  delete from public.cartes_groupe where groupe = upper(code) and id = p_id;
$$;

revoke all on function public.cartes_du_groupe(text) from public;
revoke all on function public.ajouter_carte_groupe(text, text, text) from public;
revoke all on function public.supprimer_carte_groupe(text, bigint) from public;
grant execute on function public.cartes_du_groupe(text) to anon, authenticated;
grant execute on function public.ajouter_carte_groupe(text, text, text) to anon, authenticated;
grant execute on function public.supprimer_carte_groupe(text, bigint) to anon, authenticated;
