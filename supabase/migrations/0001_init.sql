-- District 45 — initial schema
-- Roles: customer books appointments; barber manages services, hours, time off
-- and their schedule. profiles.id mirrors auth.users.id.
--
-- Weekday convention everywhere in this schema: 0 = Monday … 6 = Sunday
-- (matches the app's Mon-first week strip; Sunday defaults to closed).

create extension if not exists pgcrypto;

create type public.user_role as enum ('customer', 'barber');
create type public.appointment_status as enum ('booked', 'completed', 'cancelled');

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users, created by trigger on signup
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       public.user_role not null default 'customer',
  full_name  text not null default '',
  phone      text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- barbers: extension of a barber profile with public shop info
-- ---------------------------------------------------------------------------
create table public.barbers (
  id               uuid primary key references public.profiles (id) on delete cascade,
  display_name     text not null,
  specialty        text not null default '',
  years_experience int  not null default 0 check (years_experience >= 0),
  phone            text not null default '',
  address          text not null default '',
  photo_url        text,
  is_active        boolean not null default true,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- services: owned by a barber (name, duration, price — editable in Settings)
-- ---------------------------------------------------------------------------
create table public.services (
  id           uuid primary key default gen_random_uuid(),
  barber_id    uuid not null references public.barbers (id) on delete cascade,
  name         text not null,
  duration_min int  not null check (duration_min > 0),
  price        numeric(8,2) not null check (price >= 0),
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index services_barber_idx on public.services (barber_id) where is_active;

-- ---------------------------------------------------------------------------
-- working_hours: one row per weekday per barber (0 = Mon … 6 = Sun)
-- ---------------------------------------------------------------------------
create table public.working_hours (
  id         uuid primary key default gen_random_uuid(),
  barber_id  uuid not null references public.barbers (id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6),
  is_open    boolean not null default true,
  start_time time not null default '09:00',
  end_time   time not null default '19:00',
  constraint working_hours_valid_range check (end_time > start_time),
  constraint working_hours_unique_day unique (barber_id, weekday)
);

-- ---------------------------------------------------------------------------
-- time_off: vacation / blocked date ranges per barber (inclusive)
-- ---------------------------------------------------------------------------
create table public.time_off (
  id         uuid primary key default gen_random_uuid(),
  barber_id  uuid not null references public.barbers (id) on delete cascade,
  start_date date not null,
  end_date   date not null,
  constraint time_off_valid_range check (end_date >= start_date)
);
create index time_off_barber_idx on public.time_off (barber_id);

-- ---------------------------------------------------------------------------
-- appointments: the booking. Service/customer details are snapshotted so the
-- barber's schedule survives service edits/deletes and profile changes.
-- ---------------------------------------------------------------------------
create table public.appointments (
  id             uuid primary key default gen_random_uuid(),
  barber_id      uuid not null references public.barbers (id) on delete cascade,
  customer_id    uuid not null references public.profiles (id) on delete cascade,
  service_id     uuid references public.services (id) on delete set null,
  service_name   text not null,
  price          numeric(8,2) not null,
  duration_min   int not null,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  status         public.appointment_status not null default 'booked',
  customer_name  text not null default '',
  customer_phone text not null default '',
  created_at     timestamptz not null default now(),
  cancelled_at   timestamptz,
  constraint appointments_valid_range check (ends_at > starts_at)
);

-- A barber slot can only be booked once.
create unique index appointments_no_double_booking
  on public.appointments (barber_id, starts_at) where (status = 'booked');
-- A customer can hold only one active appointment at a time (the app locks
-- the customer to the Confirmed screen while one exists).
create unique index appointments_one_active_per_customer
  on public.appointments (customer_id) where (status = 'booked');
create index appointments_barber_time_idx on public.appointments (barber_id, starts_at);

-- ---------------------------------------------------------------------------
-- signup trigger: create profile (+ barber row when role = barber)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role public.user_role :=
    coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'customer')::public.user_role;
  v_name text := coalesce(new.raw_user_meta_data ->> 'full_name', '');
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, v_role, v_name);

  if v_role = 'barber' then
    insert into public.barbers (id, display_name)
    values (new.id, coalesce(nullif(v_name, ''), 'New barber'));
    -- default hours: Mon–Sat 9:00–19:00, Sunday closed
    insert into public.working_hours (barber_id, weekday, is_open)
    select new.id, d, d <> 6 from generate_series(0, 6) as d;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RPC: booked slots for a barber (safe for customers — no identities leaked)
-- ---------------------------------------------------------------------------
create or replace function public.get_booked_slots(
  p_barber_id uuid,
  p_from timestamptz,
  p_to   timestamptz
)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql security definer set search_path = public
stable
as $$
  select a.starts_at, a.ends_at
  from public.appointments a
  where a.barber_id = p_barber_id
    and a.status = 'booked'
    and a.starts_at >= p_from
    and a.starts_at < p_to;
$$;

-- ---------------------------------------------------------------------------
-- RPC: atomic booking with availability validation
-- ---------------------------------------------------------------------------
create or replace function public.book_appointment(
  p_barber_id  uuid,
  p_service_id uuid,
  p_starts_at  timestamptz
)
returns public.appointments
language plpgsql security definer set search_path = public
as $$
declare
  v_customer  public.profiles%rowtype;
  v_service   public.services%rowtype;
  v_barber    public.barbers%rowtype;
  v_ends_at   timestamptz;
  v_weekday   smallint;
  v_hours     public.working_hours%rowtype;
  v_appt      public.appointments%rowtype;
begin
  select * into v_customer from public.profiles where id = auth.uid();
  if not found then
    raise exception 'Not authenticated';
  end if;

  select * into v_barber from public.barbers
    where id = p_barber_id and is_active;
  if not found then
    raise exception 'Barber not found';
  end if;

  select * into v_service from public.services
    where id = p_service_id and barber_id = p_barber_id and is_active;
  if not found then
    raise exception 'Service not found for this barber';
  end if;

  if p_starts_at <= now() then
    raise exception 'Appointment must be in the future';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_service.duration_min);

  -- 0 = Monday … 6 = Sunday (isodow is 1..7)
  v_weekday := extract(isodow from p_starts_at)::smallint - 1;

  select * into v_hours from public.working_hours
    where barber_id = p_barber_id and weekday = v_weekday;
  if not found or not v_hours.is_open then
    raise exception 'Barber is closed on this day';
  end if;

  if p_starts_at::time < v_hours.start_time
     or v_ends_at::time > v_hours.end_time then
    raise exception 'Outside working hours';
  end if;

  if exists (
    select 1 from public.time_off t
    where t.barber_id = p_barber_id
      and p_starts_at::date between t.start_date and t.end_date
  ) then
    raise exception 'Barber is on time off';
  end if;

  if exists (
    select 1 from public.appointments a
    where a.barber_id = p_barber_id
      and a.status = 'booked'
      and a.starts_at < v_ends_at
      and a.ends_at > p_starts_at
  ) then
    raise exception 'Time slot is no longer available';
  end if;

  -- appointments whose time has passed no longer lock the customer
  update public.appointments
    set status = 'completed'
    where customer_id = auth.uid() and status = 'booked' and ends_at <= now();

  if exists (
    select 1 from public.appointments a
    where a.customer_id = auth.uid() and a.status = 'booked'
  ) then
    raise exception 'You already have an active appointment';
  end if;

  insert into public.appointments (
    barber_id, customer_id, service_id,
    service_name, price, duration_min,
    starts_at, ends_at,
    customer_name, customer_phone
  ) values (
    p_barber_id, auth.uid(), p_service_id,
    v_service.name, v_service.price, v_service.duration_min,
    p_starts_at, v_ends_at,
    v_customer.full_name, v_customer.phone
  )
  returning * into v_appt;

  return v_appt;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.barbers       enable row level security;
alter table public.services      enable row level security;
alter table public.working_hours enable row level security;
alter table public.time_off      enable row level security;
alter table public.appointments  enable row level security;

-- profiles: users manage their own row
create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- barbers: everyone signed in can browse; barbers edit their own row
create policy "barbers: read all" on public.barbers
  for select using (auth.role() = 'authenticated');
create policy "barbers: update own" on public.barbers
  for update using (id = auth.uid()) with check (id = auth.uid());

-- services: everyone signed in can read; owning barber has full control
create policy "services: read all" on public.services
  for select using (auth.role() = 'authenticated');
create policy "services: barber insert" on public.services
  for insert with check (barber_id = auth.uid());
create policy "services: barber update" on public.services
  for update using (barber_id = auth.uid()) with check (barber_id = auth.uid());
create policy "services: barber delete" on public.services
  for delete using (barber_id = auth.uid());

-- working hours: readable by all signed-in users (drives the customer calendar)
create policy "hours: read all" on public.working_hours
  for select using (auth.role() = 'authenticated');
create policy "hours: barber insert" on public.working_hours
  for insert with check (barber_id = auth.uid());
create policy "hours: barber update" on public.working_hours
  for update using (barber_id = auth.uid()) with check (barber_id = auth.uid());
create policy "hours: barber delete" on public.working_hours
  for delete using (barber_id = auth.uid());

-- time off: same shape as working hours
create policy "time_off: read all" on public.time_off
  for select using (auth.role() = 'authenticated');
create policy "time_off: barber insert" on public.time_off
  for insert with check (barber_id = auth.uid());
create policy "time_off: barber update" on public.time_off
  for update using (barber_id = auth.uid()) with check (barber_id = auth.uid());
create policy "time_off: barber delete" on public.time_off
  for delete using (barber_id = auth.uid());

-- appointments: each party sees their own; inserts go through book_appointment;
-- only the barber can cancel or complete (per the design, customers must call).
create policy "appointments: customer reads own" on public.appointments
  for select using (customer_id = auth.uid());
create policy "appointments: barber reads own" on public.appointments
  for select using (barber_id = auth.uid());
create policy "appointments: barber updates status" on public.appointments
  for update using (barber_id = auth.uid()) with check (barber_id = auth.uid());
