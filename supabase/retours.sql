-- =====================================================================
--  Les Cartouches — table des avis de test (Supabase / PostgreSQL)
-- ---------------------------------------------------------------------
--  Projet Supabase : cartouches (id gfxpldjnrcoxdodidkze, région eu-west-3)
--  Cette table est DÉJÀ installée sur le projet Supabase de Julien.
--  Ce fichier sert de sauvegarde / documentation, et permet de tout
--  recréer à l'identique sur un nouveau projet si besoin.
--
--  À exécuter dans : Supabase → SQL Editor → New query → Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. La table
-- ---------------------------------------------------------------------
create table if not exists public.retours (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  jeu         text        not null,
  vote        smallint    not null,
  commentaire text,
  mode        text        not null,
  nb_joueurs  smallint    not null default 0,

  -- Un des seize jeux de l'appli
  constraint retours_jeu_valide check (jeu in (
    'ouinon','ninon','menteur','coupable',
    'cascade','chrono','tribunal','dilemme',
    'devine','liste','petitbac','taboo','fredonne','quiadit','vraifaux','histoire'
  )),
  -- Pouce en haut (1) ou pouce en bas (-1) uniquement
  constraint retours_vote_valide check (vote in (-1, 1)),
  -- Commentaire facultatif, 200 caractères maximum
  constraint retours_commentaire_court check (
    commentaire is null or char_length(commentaire) <= 200
  ),
  -- Gages (sans alcool) ou gorgées (alcool)
  constraint retours_mode_valide check (mode in ('gages','alcool')),
  -- De 0 (mode « personne à ta gauche ») à 16 joueurs
  constraint retours_nb_joueurs_valide check (nb_joueurs between 0 and 16)
);

-- ---------------------------------------------------------------------
-- 2. Sécurité (Row Level Security)
--    Les visiteurs anonymes peuvent UNIQUEMENT ajouter un avis.
--    Lecture, modification et suppression restent impossibles depuis
--    le site public : seules les clés de service (côté Supabase) y
--    accèdent.
-- ---------------------------------------------------------------------
alter table public.retours enable row level security;

drop policy if exists "insertion publique des avis" on public.retours;
create policy "insertion publique des avis"
  on public.retours
  for insert
  to anon
  with check (
    jeu in ('ouinon','ninon','menteur','coupable',
            'cascade','chrono','tribunal','dilemme',
            'devine','liste','petitbac','taboo','fredonne','quiadit','vraifaux','histoire')
    and vote in (-1, 1)
    and (commentaire is null or char_length(commentaire) <= 200)
    and mode in ('gages','alcool')
    and nb_joueurs between 0 and 16
  );

-- (Aucune policy de SELECT / UPDATE / DELETE pour anon : donc refusé.)

-- ---------------------------------------------------------------------
-- 3. Vue de classement — 👍, 👎 et total par jeu, du plus aimé au moins aimé
-- ---------------------------------------------------------------------
create or replace view public.classement_jeux as
select
  jeu,
  count(*) filter (where vote = 1)  as pouces_haut,
  count(*) filter (where vote = -1) as pouces_bas,
  count(*)                          as total_avis,
  sum(vote)                         as score
from public.retours
group by jeu
order by score desc, total_avis desc;

-- ---------------------------------------------------------------------
-- MISE À JOUR (octobre 2026) — à lancer une fois si la table existe déjà :
-- ajoute les huit jeux du rayon « Quiz & devinettes ».
-- ---------------------------------------------------------------------
-- alter table public.retours drop constraint retours_jeu_valide;
-- alter table public.retours add constraint retours_jeu_valide check (jeu in (
--   'ouinon','ninon','menteur','coupable','cascade','chrono','tribunal','dilemme','devine','liste','petitbac','taboo','fredonne','quiadit','vraifaux','histoire'));
-- drop policy if exists "insertion publique des avis" on public.retours;
-- create policy "insertion publique des avis" on public.retours for insert to anon with check (
--   jeu in ('ouinon','ninon','menteur','coupable','cascade','chrono','tribunal','dilemme','devine','liste','petitbac','taboo','fredonne','quiadit','vraifaux','histoire')
--   and vote in (-1, 1) and (commentaire is null or char_length(commentaire) <= 200)
--   and mode in ('gages','alcool') and nb_joueurs between 0 and 16);
