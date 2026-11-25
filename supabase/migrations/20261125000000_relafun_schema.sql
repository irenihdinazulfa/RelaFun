-- Skema database RelaFun untuk Supabase (PostgreSQL).
--
-- Sama persis dengan model SQLAlchemy di apps/api/app/models.py, sehingga server Python (start.bat
-- dengan DATABASE_URL Supabase) dan backend Supabase (supabase/functions/api) memakai data yang sama.
-- Kolom yang diisi otomatis oleh SQLAlchemy diberi DEFAULT agar Edge Function bisa menyisipkan baris.
--
-- Privasi anak (CLAUDE.md aturan 6): tidak ada e-mail, HP, tanggal lahir, atau nama lengkap.
-- Keamanan: RLS aktif di SEMUA tabel tanpa kebijakan apa pun, dan hak anon/authenticated dicabut,
-- sehingga Data API publik Supabase (kunci anon) TIDAK bisa membaca atau mengubah data siswa.
-- Hanya Edge Function `api` (peran postgres, pemilik tabel) yang mengakses data.

create table if not exists classrooms (
  id serial primary key,
  name varchar(60) not null,
  code varchar(12) not null,
  teacher_id integer,
  leaderboard_enabled boolean not null default true,
  ai_enabled boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists ix_classrooms_code on classrooms (code);

create table if not exists users (
  id serial primary key,
  username varchar(40) not null,
  password_hash varchar(200) not null,
  role varchar(10) not null default 'student',
  nickname varchar(30) not null,
  class_id integer references classrooms (id),
  points integer not null default 0,
  streak integer not null default 0,
  last_active_date varchar(10),
  created_at timestamptz not null default now()
);
create unique index if not exists ix_users_username on users (username);

do $$ begin
  alter table classrooms add constraint classrooms_teacher_id_fkey foreign key (teacher_id) references users (id);
exception when duplicate_object then null; end $$;

create table if not exists attempts (
  id serial primary key,
  user_id integer not null references users (id),
  module_id varchar(40) not null,
  item_id varchar(60) not null,
  correct boolean not null,
  error_type varchar(40),
  answer text not null default '',
  points integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ix_attempts_module_id on attempts (module_id);
create index if not exists ix_attempts_user_id on attempts (user_id);
create index if not exists ix_attempts_item_id on attempts (item_id);

create table if not exists daily_stats (
  id serial primary key,
  user_id integer not null references users (id),
  date varchar(10) not null,
  correct_count integer not null default 0,
  points integer not null default 0,
  ai_calls integer not null default 0,
  unique (user_id, date)
);
create index if not exists ix_daily_stats_user_id on daily_stats (user_id);

create table if not exists module_progress (
  id serial primary key,
  user_id integer not null references users (id),
  module_id varchar(40) not null,
  step_index integer not null default 0,
  lesson_done boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);
create index if not exists ix_module_progress_user_id on module_progress (user_id);

create table if not exists tutor_logs (
  id serial primary key,
  user_id integer not null references users (id),
  problem_id varchar(40) not null,
  steps_done integer not null default 0,
  steps_total integer not null default 0,
  hints_used integer not null default 0,
  skipped integer not null default 0,
  attempts integer not null default 0,
  effort integer,
  seconds integer not null default 0,
  ai_used boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ix_tutor_logs_user_id on tutor_logs (user_id);

create table if not exists tutor_usage (
  id serial primary key,
  user_id integer not null references users (id),
  date varchar(10) not null,
  calls integer not null default 0,
  unique (user_id, date)
);
create index if not exists ix_tutor_usage_user_id on tutor_usage (user_id);

-- Kunci akses: RLS aktif tanpa kebijakan = tertutup untuk Data API (anon/authenticated).
do $$
declare t text;
begin
  foreach t in array array['classrooms', 'users', 'attempts', 'daily_stats', 'module_progress',
                           'tutor_logs', 'tutor_usage'] loop
    execute format('alter table %I enable row level security', t);
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on table %I from anon', t);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke all on table %I from authenticated', t);
    end if;
  end loop;
end $$;
