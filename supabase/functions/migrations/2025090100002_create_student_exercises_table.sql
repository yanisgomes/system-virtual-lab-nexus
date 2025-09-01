-- Map exercises to students (M:N)
create table if not exists public.student_exercises (
  id uuid primary key default gen_random_uuid(),
  student_id text references public.students(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  status text not null default 'assigned' check (status in ('assigned','dispatched','ack','completed','failed')),
  unique(student_id, exercise_id)
);

create index if not exists student_exercises_student_idx on public.student_exercises (student_id);
create index if not exists student_exercises_exercise_idx on public.student_exercises (exercise_id);
