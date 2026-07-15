create table if not exists public.review_shared_state (
  id text primary key,
  payload jsonb,
  revision bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint review_shared_state_singleton check (id = 'default'),
  constraint review_shared_state_revision_nonnegative check (revision >= 0)
);

alter table public.review_shared_state enable row level security;

revoke all on table public.review_shared_state from anon, authenticated;

insert into public.review_shared_state (id, payload, revision)
values ('default', null, 0)
on conflict (id) do nothing;
