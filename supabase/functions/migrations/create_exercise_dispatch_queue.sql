-- Queue for dispatching exercises to headsets via UDP bridge
create table if not exists public.exercise_dispatch_queue (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid references public.exercises(id) on delete cascade,
  student_id text references public.students(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','sent','error')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists exercise_dispatch_queue_status_idx on public.exercise_dispatch_queue (status);
create index if not exists exercise_dispatch_queue_student_idx on public.exercise_dispatch_queue (student_id);
