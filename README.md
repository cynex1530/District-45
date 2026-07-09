# District 45

A barbershop booking app for iOS and Android, built with **Expo (React Native + TypeScript)** and **Supabase**. The UI is a faithful port of the design handoff (`barber-app-prototype.html`): dark/light glass theme, Manrope headings, swipeable barber carousel, 3-week calendar, locked confirmation screen, and full barber self-service settings.

## Two roles

- **Customer** — browse barbers (swipe carousel), pick a service, pick a date + time from real availability, get a locked-in confirmation with Maps/Waze/call links. While an appointment is active, the app opens straight to the Confirmed screen and new bookings are blocked.
- **Barber** — see today's & upcoming schedule (grouped by day, with call-the-customer buttons), and manage services/pricing, working hours, time off, phone and password in Settings.

## Stack

| Layer | Tech |
|---|---|
| Mobile app | Expo SDK 57, React Native, TypeScript |
| Backend | Supabase (Postgres, Auth, RLS, RPC) |
| Auth | Email + password (Apple/Google buttons present, OAuth not yet configured) |
| State | React context + local screen state machine (matches the prototype) |

## Getting started

### 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com) (or `supabase init` + `supabase start` locally).
2. Run the schema: paste `supabase/migrations/0001_init.sql` into the SQL editor (or `supabase db push` with the CLI).
3. Optionally run `supabase/seed.sql` to create the four demo barbers from the design (login `marcus@district45.demo` etc., password `district45`) with default services and hours.
4. For development, consider disabling **email confirmations** (Auth → Providers → Email) so registration signs users straight in.

### 2. Configure the app

```bash
cp .env.example .env   # fill in EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npx expo start         # scan the QR code with Expo Go, or press i / a
```

### 3. Accounts

- **Customers** register in the app (Register tab). Registration always creates a `customer`.
- **Barbers** are provisioned, not self-registered (the design has no barber signup). Use the seed accounts, or create a user in the Supabase dashboard with user metadata `{"role": "barber", "full_name": "Name"}` — the signup trigger builds the barber row and default hours automatically. Then fill in specialty/address/phone in the `barbers` table (or extend Settings).

## Database schema

```
auth.users ──1:1── profiles (role: customer | barber)
                      │
                      └──1:1 (when role=barber)── barbers ──1:N── services
                                                     │──1:N── working_hours (one per weekday, 0=Mon…6=Sun)
                                                     │──1:N── time_off
                                                     └──1:N── appointments ──N:1── profiles (customer)
                                                                          └─N:1── services (snapshotted)
```

**Tables**

- `profiles` — mirrors `auth.users` (created by trigger). `role`, `full_name`, `phone`.
- `barbers` — public barber card: `display_name`, `specialty`, `years_experience`, `phone`, `address`, `photo_url`, `sort_order`.
- `services` — per-barber: `name`, `duration_min`, `price`.
- `working_hours` — one row per weekday per barber: `is_open`, `start_time`, `end_time`. Sunday defaults closed.
- `time_off` — vacation date ranges that close whole days.
- `appointments` — `starts_at`/`ends_at`, `status` (`booked`/`completed`/`cancelled`), plus **snapshots** of service name/price/duration and customer name/phone, so the barber's schedule survives later edits.

**Integrity & security**

- Partial unique indexes: a barber slot can't be double-booked; a customer can hold only one active appointment.
- `book_appointment(barber_id, service_id, starts_at)` RPC validates working hours, time off, overlaps and the one-active-booking rule atomically (bookings only happen through it).
- `get_booked_slots(...)` RPC exposes busy times to customers without leaking who booked them.
- RLS everywhere: customers see only their own appointments; barbers manage only their own services/hours/time-off/schedule; only the barber can cancel or complete (customers call, per the design).
- Past appointments auto-complete on next booking attempt, so customers aren't locked forever.

## Project layout

```
App.tsx                     # role-aware navigation state machine (as in the prototype)
src/
  theme/                    # design tokens (1:1 from handoff) + theme context
  lib/                      # supabase client, types, date/slot math
  api/                      # all Supabase queries and RPC calls
  components/               # glass UI kit, icons, barber photo placeholder
  screens/
    AuthScreen.tsx
    customer/               # BarberSelect, ServiceSelect, Calendar, Confirmed, Settings
    barber/                 # Schedule, Settings
supabase/
  migrations/0001_init.sql  # schema + RLS + RPCs + triggers
  seed.sql                  # demo barbers/services from the design
```

## Design notes (deviations from the HTML prototype)

- The glass "backdrop blur" is approximated with the handoff's translucent fills, borders and shadows — React Native has no backdrop-filter. Drop in `expo-blur` per-surface later if real blur is wanted.
- The prototype's Customer/Barber toggle above the phone frame was prototype-only; role now comes from the signed-in account.
- The "demo: mark appointment as completed" link was demo-only and is not shipped; past appointments auto-complete instead.
- A "Sign out" link was added to Settings (the prototype had no way to leave a session).

## Still needed to go to production

- **Supabase project keys** (`.env`) — see above.
- **Apple & Google OAuth**: enable providers in Supabase, add the `district45://` redirect, and wire `signInWithOAuth` (buttons currently explain they're not configured). Apple sign-in also needs an Apple Developer account + capability.
- **Barber photos**: upload real photos (Supabase Storage works well) and set `barbers.photo_url` — the striped placeholder shows until then.
- **App icons / splash**: replace the default Expo assets in `assets/` with District 45 branding.
- **Store accounts**: Apple Developer + Google Play accounts, then `eas build` / `eas submit` (EAS project setup).
- **Timezone**: times are computed in the device's timezone; fine for a single-city shop, revisit if barbers and customers can be in different timezones.
