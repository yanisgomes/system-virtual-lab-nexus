-- Create exercises table to store Unity-compatible SystemDef JSON
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  diff text not null check (diff in ('1','2','3','4')),
  system_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists exercises_created_at_idx on public.exercises (created_at desc);
