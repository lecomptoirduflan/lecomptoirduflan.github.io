-- ============================================================
-- Comptoir du Flan — Étape 1 : socle
-- Boutiques, comptes de l'équipe, rôles, invitations.
-- À coller dans Supabase > SQL Editor > New query, puis "Run".
-- ============================================================

-- ---------- Rôles ----------
-- direction           Direction · admin et compta
-- resp_vente          Responsable vente
-- resp_production     Responsable production
-- resp_partenariats   Responsable partenariats et marketing
-- chef_patissier      Chef pâtissier
-- patissier           Pâtissier
-- vendeur             Vendeur
-- livreur             Livreur
-- cm                  Community manager
-- aucun               Compte en attente (pas d'accès)

-- ---------- Tables ----------
create table if not exists public.boutiques (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  ville       text,
  zone        text not null default 'montpellier' check (zone in ('montpellier','hors')),
  horaires    text,
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  prenom      text,
  nom         text,
  role        text not null default 'aucun' check (role in
              ('direction','resp_vente','resp_production','resp_partenariats',
               'chef_patissier','patissier','vendeur','livreur','cm','aucun')),
  boutique_id uuid references public.boutiques(id) on delete set null,
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.invitations (
  email       text primary key,
  role        text not null check (role in
              ('direction','resp_vente','resp_production','resp_partenariats',
               'chef_patissier','patissier','vendeur','livreur','cm')),
  boutique_id uuid references public.boutiques(id) on delete set null,
  invited_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  used_at     timestamptz
);

-- ---------- Fonctions d'accès ----------
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and actif and role <> 'aucun');
$$;

create or replace function public.is_responsable() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and actif
                 and role in ('direction','resp_vente','resp_production','resp_partenariats'));
$$;

-- ---------- Création automatique du profil à l'inscription ----------
-- Le tout premier compte devient "direction" (pour démarrer).
-- Ensuite : rôle de l'invitation si l'adresse a été invitée, sinon "aucun" (en attente).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  inv invitations%rowtype;
  nb  int;
begin
  select count(*) into nb from profiles;
  select * into inv from invitations where lower(email) = lower(new.email) and used_at is null;
  insert into profiles (id, email, prenom, nom, role, boutique_id)
  values (
    new.id, new.email,
    nullif(trim(new.raw_user_meta_data->>'prenom'), ''),
    nullif(trim(new.raw_user_meta_data->>'nom'), ''),
    case when nb = 0 then 'direction' when inv.email is not null then inv.role else 'aucun' end,
    inv.boutique_id
  );
  if inv.email is not null then
    update invitations set used_at = now() where email = inv.email;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un employé peut changer son prénom et son nom, pas son rôle ni sa boutique.
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_responsable() then
    new.role := old.role; new.actif := old.actif;
    new.boutique_id := old.boutique_id; new.email := old.email;
  end if;
  -- Personne ne se retire soi-même l'accès par erreur.
  if new.id = auth.uid() and (new.actif = false or new.role = 'aucun') then
    new.actif := old.actif; new.role := old.role;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile before update on public.profiles
  for each row execute function public.protect_profile();

-- ---------- Règles de sécurité (RLS) ----------
alter table public.boutiques   enable row level security;
alter table public.profiles    enable row level security;
alter table public.invitations enable row level security;

drop policy if exists "boutiques lecture"   on public.boutiques;
drop policy if exists "boutiques ecriture"  on public.boutiques;
create policy "boutiques lecture"  on public.boutiques for select using (public.is_member());
create policy "boutiques ecriture" on public.boutiques for all
  using (public.is_responsable()) with check (public.is_responsable());

drop policy if exists "profils lecture" on public.profiles;
drop policy if exists "profils modif"   on public.profiles;
create policy "profils lecture" on public.profiles for select
  using (id = auth.uid() or public.is_member());
create policy "profils modif" on public.profiles for update
  using (id = auth.uid() or public.is_responsable())
  with check (id = auth.uid() or public.is_responsable());

drop policy if exists "invitations responsables" on public.invitations;
create policy "invitations responsables" on public.invitations for all
  using (public.is_responsable()) with check (public.is_responsable());

-- ---------- Points de vente ----------
insert into public.boutiques (nom, ville, zone, horaires)
select * from (values
  ('Saint-Lazare',          'Montpellier',              'montpellier', 'Mar–ven 10h–19h · sam 10h–18h'),
  ('Polygone',              'Montpellier',              'montpellier', 'Lun–sam 10h–20h'),
  ('Odysseum',              'Montpellier',              'montpellier', 'Lun–sam 10h–20h'),
  ('Carrefour Lattes',      'Lattes',                   'montpellier', 'Lun–sam 8h30–21h'),
  ('Carrefour Trifontaine', 'Saint-Clément-de-Rivière', 'montpellier', 'Lun–sam 10h30–20h'),
  ('Nîmes',                 'Cap Costières',            'hors',        'Lun–sam 9h30–20h'),
  ('Béziers',               'Béziers',                  'hors',        null),
  ('Marseille',             'Marseille',                'hors',        null)
) as v(nom, ville, zone, horaires)
where not exists (select 1 from public.boutiques);

-- ---------- Mises à jour en direct ----------
alter publication supabase_realtime add table public.profiles, public.boutiques, public.invitations;
