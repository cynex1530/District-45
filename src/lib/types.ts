export type UserRole = 'customer' | 'barber';
export type AppointmentStatus = 'booked' | 'completed' | 'cancelled';
export type AuthProvider = 'email' | 'apple' | 'google';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string;
}

export interface Barber {
  id: string;
  display_name: string;
  specialty: string;
  years_experience: number;
  phone: string;
  address: string;
  photo_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Service {
  id: string;
  barber_id: string;
  name: string;
  duration_min: number;
  price: number;
  sort_order: number;
  is_active: boolean;
}

// Weekday convention app-wide: 0 = Monday … 6 = Sunday (Mon-first week strip).
export interface WorkingHours {
  id: string;
  barber_id: string;
  weekday: number;
  is_open: boolean;
  start_time: string; // 'HH:MM:SS'
  end_time: string;
}

export interface TimeOff {
  id: string;
  barber_id: string;
  start_date: string; // 'YYYY-MM-DD'
  end_date: string;
}

export interface Appointment {
  id: string;
  barber_id: string;
  customer_id: string;
  service_id: string | null;
  service_name: string;
  price: number;
  duration_min: number;
  starts_at: string; // ISO timestamptz
  ends_at: string;
  status: AppointmentStatus;
  customer_name: string;
  customer_phone: string;
}

export interface BookedSlot {
  starts_at: string;
  ends_at: string;
}
