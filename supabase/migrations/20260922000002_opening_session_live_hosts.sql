alter table public.opening_sessions
  add column host_key text not null default 'live-pull'
  check (host_key in ('live-pull', 'pokepiglt', 'beard-dad-cardz'));
