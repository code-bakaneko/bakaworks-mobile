-- Gold: a per-user currency balance. Non-negative, starts at zero.
alter table public.profiles
  add column gold integer not null default 0 check (gold >= 0);
