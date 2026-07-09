-- District 45 — demo seed
-- Creates four demo barber accounts (mirroring the design prototype) directly
-- in auth.users so the signup trigger builds their profiles, barber rows and
-- default working hours. Run AFTER 0001_init.sql, e.g. `supabase db reset`
-- picks this up automatically when placed in supabase/seed.sql.
--
-- Demo barber logins: <email> / password "district45" (change in production!)

do $$
declare
  b record;
  v_id uuid;
begin
  for b in
    select * from (values
      ('marcus@district45.demo', 'Marcus Reed',   'Fades & Tapers',   8,  '+15552014471', '118 Vine Street, Austin, TX',     0),
      ('diego@district45.demo',  'Diego Alvarez', 'Classic Cuts',     5,  '+15553408827', '452 Congress Ave, Austin, TX',    1),
      ('jordan@district45.demo', 'Jordan Lee',    'Beard Sculpting',  10, '+15551182290', '77 East 6th Street, Austin, TX',  2),
      ('sam@district45.demo',    'Sam Okafor',    'Modern Crops',     6,  '+15559026634', '930 Rainey Street, Austin, TX',   3)
    ) as t(email, full_name, specialty, years, phone, address, sort_order)
  loop
    v_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', b.email,
      crypt('district45', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('role', 'barber', 'full_name', b.full_name),
      now(), now()
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id, v_id,
      jsonb_build_object('sub', v_id::text, 'email', b.email, 'email_verified', true),
      'email', now(), now(), now()
    );

    update public.barbers set
      specialty        = b.specialty,
      years_experience = b.years,
      phone            = b.phone,
      address          = b.address,
      sort_order       = b.sort_order
    where id = v_id;

    update public.profiles set phone = b.phone where id = v_id;

    -- the four starter services from the design
    insert into public.services (barber_id, name, duration_min, price, sort_order) values
      (v_id, 'Classic Cut',       30, 28, 0),
      (v_id, 'Skin Fade',         45, 35, 1),
      (v_id, 'Beard Trim',        20, 18, 2),
      (v_id, 'Cut + Beard Combo', 50, 45, 3);
  end loop;
end;
$$;
