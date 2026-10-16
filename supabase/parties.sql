-- Jozzo (ex-Les Cartouches) : statistiques d'utilisation anonymes (quel jeu, combien de temps, fini ou abandonné)
-- À coller dans le SQL Editor de Supabase, puis « Run ». Ne touche pas aux avis.
create table if not exists public.parties (
  id         bigint generated always as identity primary key,
  jeu        text not null check (jeu ~ '^[a-z]{2,30}$'),
  duree_s    integer not null check (duree_s between 0 and 36000),
  fini       boolean not null,
  nb_joueurs smallint not null check (nb_joueurs between 0 and 16),
  mode       text not null check (mode in ('gages','alcool','famille')),
  niveau     text check (niveau is null or niveau in ('flirt','chaud','brulant')),
  appareil   text not null check (appareil ~ '^[a-z0-9]{8,24}$'),
  cree_le    timestamptz not null default now()
);
alter table public.parties enable row level security;
revoke all on table public.parties from anon, authenticated;
grant insert on table public.parties to anon;
drop policy if exists "ajout anonyme des parties" on public.parties;
create policy "ajout anonyme des parties" on public.parties for insert to anon with check (
  jeu ~ '^[a-z]{2,30}$' and duree_s between 0 and 36000 and nb_joueurs between 0 and 16
  and mode in ('gages','alcool','famille') and (niveau is null or niveau in ('flirt','chaud','brulant'))
  and appareil ~ '^[a-z0-9]{8,24}$');
create or replace view public.stats_parties as
select jeu,
  count(*) as parties,
  count(*) filter (where fini) as finies,
  round(100.0 * count(*) filter (where fini) / count(*)) as pct_finies,
  round(avg(duree_s) / 60.0, 1) as duree_moy_min,
  count(distinct appareil) as appareils
from public.parties group by jeu order by parties desc;
revoke all on public.stats_parties from anon, authenticated;
