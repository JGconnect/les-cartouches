-- Jozzo (ex-Les Cartouches) : suivi des variantes (ex. Le Menteur Histoires / Mots) + liste des jeux assouplie
alter table public.parties add column if not exists variante text check (variante is null or variante ~ '^[a-z]{2,20}$');
drop policy if exists "ajout anonyme des parties" on public.parties;
create policy "ajout anonyme des parties" on public.parties for insert to anon with check (
  jeu ~ '^[a-z]{2,30}$' and duree_s between 0 and 36000 and nb_joueurs between 0 and 16
  and mode in ('gages','alcool','famille') and (niveau is null or niveau in ('flirt','chaud','brulant'))
  and (variante is null or variante ~ '^[a-z]{2,20}$')
  and appareil ~ '^[a-z0-9]{8,24}$');
drop view if exists public.stats_parties;
create view public.stats_parties as
select jeu, coalesce(variante,'') as variante,
  count(*) as parties,
  count(*) filter (where fini) as finies,
  round(100.0 * count(*) filter (where fini) / count(*)) as pct_finies,
  round(avg(duree_s) / 60.0, 1) as duree_moy_min,
  count(distinct appareil) as appareils
from public.parties group by jeu, coalesce(variante,'') order by parties desc;
revoke all on public.stats_parties from anon, authenticated;
alter table public.retours drop constraint if exists retours_jeu_valide;
alter table public.retours add constraint retours_jeu_valide check (jeu ~ '^[a-z]{2,30}$');
drop policy if exists "insertion publique des avis" on public.retours;
create policy "insertion publique des avis" on public.retours for insert to anon with check (
  jeu ~ '^[a-z]{2,30}$'
  and vote in (-1, 1) and (commentaire is null or char_length(commentaire) <= 200)
  and mode in ('gages','alcool') and nb_joueurs between 0 and 16);
