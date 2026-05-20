-- Subscription source model
-- RevenueCat is the source of truth for App Store / Google Play purchases.
-- public.profiles.is_premium and public.profiles.premium_until are reserved for promo/manual premium grants.

alter table public.profiles
    add column if not exists premium_source text not null default 'none',
    add column if not exists premium_granted_at timestamptz,
    add column if not exists premium_note text;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'profiles_premium_source_check'
    ) then
        alter table public.profiles
            add constraint profiles_premium_source_check
            check (premium_source in ('none', 'promo', 'manual', 'legacy'));
    end if;
end $$;

update public.profiles
set
    premium_source = case
        when is_premium = true and premium_source = 'none' then 'legacy'
        when is_premium = false then 'none'
        else premium_source
    end,
    premium_granted_at = case
        when is_premium = true then coalesce(premium_granted_at, updated_at, created_at, now())
        else premium_granted_at
    end;

create index if not exists profiles_promo_premium_idx
    on public.profiles (id, premium_until)
    where is_premium = true;

comment on column public.profiles.is_premium is
    'Promo/manual premium grant only. Store purchases are checked through RevenueCat.';

comment on column public.profiles.premium_until is
    'Null means unlimited promo/manual grant; a timestamp means promo/manual access expires at that time.';

comment on column public.profiles.premium_source is
    'Source of the Supabase premium grant: none, promo, manual, legacy.';
