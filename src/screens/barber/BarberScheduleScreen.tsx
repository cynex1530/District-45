import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { fetchBarberSchedule } from '../../api';
import { BarberPhoto } from '../../components/BarberPhoto';
import { GearIcon, PhoneIcon } from '../../components/icons';
import { CircleButton, glassShadow } from '../../components/ui';
import { formatTime, toDateKey } from '../../lib/dates';
import { Appointment, Barber } from '../../lib/types';
import { useTheme } from '../../theme/ThemeContext';
import { FONT_HEADING } from '../../theme/tokens';

interface Props {
  barber: Barber;
  onOpenSettings: () => void;
}

interface DayGroup {
  key: string;
  label: string;
  appointments: Appointment[];
}

function groupByDay(appointments: Appointment[]): DayGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toDateKey(tomorrow);

  const groups = new Map<string, DayGroup>();
  for (const appt of appointments) {
    const d = new Date(appt.starts_at);
    const key = toDateKey(d);
    if (!groups.has(key)) {
      const label =
        key === todayKey
          ? 'Today'
          : key === tomorrowKey
            ? 'Tomorrow'
            : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      groups.set(key, { key, label, appointments: [] });
    }
    groups.get(key)!.appointments.push(appt);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function BarberScheduleScreen({ barber, onOpenSettings }: Props) {
  const { theme } = useTheme();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 21);
    try {
      setAppointments(await fetchBarberSchedule(barber.id, from, to));
    } catch {
      setAppointments([]);
    }
  }, [barber.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const groups = appointments ? groupByDay(appointments) : [];

  return (
    <View style={{ flex: 1, paddingTop: 58 }}>
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <BarberPhoto photoUrl={barber.photo_url} width={44} height={44} radius={22} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONT_HEADING, fontSize: 18, color: theme.text }}>
            {barber.display_name}
          </Text>
          <Text style={{ fontSize: 12.5, color: theme.textMuted }}>
            Today's & upcoming schedule
          </Text>
        </View>
        <CircleButton onPress={onOpenSettings}>
          <GearIcon color={theme.text} />
        </CircleButton>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 24, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.textMuted} />
        }
      >
        {!appointments ? (
          <ActivityIndicator color={theme.textMuted} style={{ marginTop: 30 }} />
        ) : groups.length === 0 ? (
          <Text
            style={{
              paddingVertical: 30,
              textAlign: 'center',
              fontSize: 13,
              color: theme.textFaint,
            }}
          >
            No appointments in the next 3 weeks.
          </Text>
        ) : (
          groups.map((group) => (
            <View key={group.key} style={{ marginBottom: 22 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: theme.textFaint,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                {group.label}
              </Text>
              <View style={{ gap: 8 }}>
                {group.appointments.map((a) => (
                  <View
                    key={a.id}
                    style={[
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 16,
                        backgroundColor: theme.glassBg,
                        borderWidth: 1,
                        borderColor: theme.glassBorder,
                      },
                      glassShadow(theme, 'md'),
                    ]}
                  >
                    <Text
                      style={{
                        width: 56,
                        fontWeight: '700',
                        fontSize: 13,
                        color: theme.text,
                      }}
                    >
                      {formatTime(new Date(a.starts_at))}
                    </Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontWeight: '700', fontSize: 14.5, color: theme.text }}>
                        {a.customer_name || 'Customer'}
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>
                        {a.service_name}
                      </Text>
                    </View>
                    {a.customer_phone ? (
                      <Pressable
                        onPress={() => Linking.openURL(`tel:${a.customer_phone}`)}
                        style={[
                          {
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: theme.glassBgStrong,
                            borderWidth: 1,
                            borderColor: theme.glassBorder,
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                          glassShadow(theme, 'sm'),
                        ]}
                      >
                        <PhoneIcon color={theme.text} width={13} height={13} />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
