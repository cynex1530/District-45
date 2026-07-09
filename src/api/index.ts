import { supabase } from '../lib/supabase';
import {
  Appointment,
  Barber,
  BookedSlot,
  Profile,
  Service,
  TimeOff,
  WorkingHours,
} from '../lib/types';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfilePhone(userId: string, phone: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ phone }).eq('id', userId);
  if (error) throw error;
}

export async function fetchBarbers(): Promise<Barber[]> {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchBarber(barberId: string): Promise<Barber | null> {
  const { data, error } = await supabase
    .from('barbers')
    .select('*')
    .eq('id', barberId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateBarberPhone(barberId: string, phone: string): Promise<void> {
  const { error } = await supabase.from('barbers').update({ phone }).eq('id', barberId);
  if (error) throw error;
}

export async function fetchServices(barberId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('barber_id', barberId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function upsertService(
  service: Partial<Service> & { barber_id: string },
): Promise<Service> {
  const { data, error } = await supabase.from('services').upsert(service).select().single();
  if (error) throw error;
  return data;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchWorkingHours(barberId: string): Promise<WorkingHours[]> {
  const { data, error } = await supabase
    .from('working_hours')
    .select('*')
    .eq('barber_id', barberId)
    .order('weekday');
  if (error) throw error;
  return data ?? [];
}

export async function updateWorkingHours(
  row: Pick<WorkingHours, 'barber_id' | 'weekday' | 'is_open' | 'start_time' | 'end_time'>,
): Promise<void> {
  const { error } = await supabase
    .from('working_hours')
    .upsert(row, { onConflict: 'barber_id,weekday' });
  if (error) throw error;
}

export async function fetchTimeOff(barberId: string): Promise<TimeOff[]> {
  const { data, error } = await supabase
    .from('time_off')
    .select('*')
    .eq('barber_id', barberId)
    .order('start_date');
  if (error) throw error;
  return data ?? [];
}

export async function addTimeOff(
  barberId: string,
  startDate: string,
  endDate: string,
): Promise<TimeOff> {
  const { data, error } = await supabase
    .from('time_off')
    .insert({ barber_id: barberId, start_date: startDate, end_date: endDate })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTimeOff(
  id: string,
  startDate: string,
  endDate: string,
): Promise<void> {
  const { error } = await supabase
    .from('time_off')
    .update({ start_date: startDate, end_date: endDate })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTimeOff(id: string): Promise<void> {
  const { error } = await supabase.from('time_off').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchBookedSlots(
  barberId: string,
  from: Date,
  to: Date,
): Promise<BookedSlot[]> {
  const { data, error } = await supabase.rpc('get_booked_slots', {
    p_barber_id: barberId,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) throw error;
  return data ?? [];
}

export async function bookAppointment(
  barberId: string,
  serviceId: string,
  startsAt: Date,
): Promise<Appointment> {
  const { data, error } = await supabase.rpc('book_appointment', {
    p_barber_id: barberId,
    p_service_id: serviceId,
    p_starts_at: startsAt.toISOString(),
  });
  if (error) throw error;
  return data as Appointment;
}

/** The customer's single active appointment, if any (drives the locked screen). */
export async function fetchActiveAppointment(customerId: string): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('customer_id', customerId)
    .eq('status', 'booked')
    .gte('ends_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchBarberSchedule(
  barberId: string,
  from: Date,
  to: Date,
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('barber_id', barberId)
    .eq('status', 'booked')
    .gte('starts_at', from.toISOString())
    .lt('starts_at', to.toISOString())
    .order('starts_at');
  if (error) throw error;
  return data ?? [];
}
