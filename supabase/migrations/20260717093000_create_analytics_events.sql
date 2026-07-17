-- Product telemetry consumed by the admin analytics dashboard.
-- This migration is deliberately isolated from exams and question content.

create table if not exists public.analytics_events (
    id text primary key,
    user_id uuid references auth.users (id) on delete set null,
    event_name text not null,
    screen_name text,
    quiz_id text,
    question_id text,
    category text,
    duration_seconds integer,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),

    constraint analytics_events_event_name_not_blank
        check (length(trim(event_name)) between 1 and 100),
    constraint analytics_events_duration_nonnegative
        check (duration_seconds is null or duration_seconds >= 0),
    constraint analytics_events_metadata_object
        check (jsonb_typeof(metadata) = 'object')
);

create index if not exists analytics_events_created_at_idx
    on public.analytics_events (created_at desc);

create index if not exists analytics_events_name_created_at_idx
    on public.analytics_events (event_name, created_at desc);

create index if not exists analytics_events_user_created_at_idx
    on public.analytics_events (user_id, created_at desc)
    where user_id is not null;

create index if not exists analytics_events_screen_created_at_idx
    on public.analytics_events (screen_name, created_at desc)
    where screen_name is not null;

create index if not exists analytics_events_quiz_created_at_idx
    on public.analytics_events (quiz_id, created_at desc)
    where quiz_id is not null;

alter table public.analytics_events enable row level security;

revoke all on table public.analytics_events from anon, authenticated;
grant insert on table public.analytics_events to anon, authenticated;
grant select, insert, update, delete on table public.analytics_events to service_role;

drop policy if exists "analytics_events_anon_insert" on public.analytics_events;
create policy "analytics_events_anon_insert"
    on public.analytics_events
    for insert
    to anon
    with check (user_id is null);

drop policy if exists "analytics_events_authenticated_insert" on public.analytics_events;
create policy "analytics_events_authenticated_insert"
    on public.analytics_events
    for insert
    to authenticated
    with check (user_id = auth.uid());

comment on table public.analytics_events is
    'KVKK preference-aware product telemetry for aggregate admin analytics.';

comment on column public.analytics_events.user_id is
    'Authenticated owner when available; null for anonymous telemetry.';

comment on column public.analytics_events.metadata is
    'Event-specific non-sensitive attributes. Do not store secrets or free-form personal data.';

notify pgrst, 'reload schema';
