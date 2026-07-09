import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { fetchBarber } from '../../api';
import { BarberPhoto } from '../../components/BarberPhoto';
import { CheckIcon, PhoneIcon } from '../../components/icons';
import { GlassView } from '../../components/ui';
import { formatTime } from '../../lib/dates';
import { Appointment, Barber } from '../../lib/types';
import { useTheme } from '../../theme/ThemeContext';
import { FONT_HEADING } from '../../theme/tokens';

interface Props {
  appointment: Appointment;
}

export function ConfirmedScreen({ appointment }: Props) {
  const { theme } = useTheme();
  const [barber, setBarber] = useState<Barber | null>(null);

  useEffect(() => {
    fetchBarber(appointment.barber_id)
      .then(setBarber)
      .catch(() => {});
  }, [appointment.barber_id]);

  const starts = new Date(appointment.starts_at);
  const dateLabel = starts.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const address = barber?.address ?? '';
  const barberName = barber?.display_name ?? 'your barber';

  const openMaps = () =>
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
    );
  const openWaze = () =>
    Linking.openURL(`https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`);
  const callBarber = () => barber?.phone && Linking.openURL(`tel:${barber.phone}`);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: 58, alignItems: 'center', paddingBottom: 40 }}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: theme.accentBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 10,
          marginBottom: 16,
        }}
      >
        <CheckIcon color={theme.accentText} />
      </View>
      <Text style={{ fontFamily: FONT_HEADING, fontSize: 20, color: theme.text }}>
        You're booked
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: theme.textMuted,
          marginTop: 5,
          textAlign: 'center',
          paddingHorizontal: 34,
        }}
      >
        Your appointment is locked in. See you soon.
      </Text>

      <View style={{ marginTop: 22, width: '100%', paddingHorizontal: 24 }}>
        <GlassView strong radius={20} shadow="lg" style={{ padding: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.divider,
              marginBottom: 14,
            }}
          >
            <BarberPhoto photoUrl={barber?.photo_url} width={44} height={44} radius={22} />
            <View>
              <Text style={{ fontWeight: '700', fontSize: 15, color: theme.text }}>
                {barberName}
              </Text>
              <Text style={{ fontSize: 12.5, color: theme.textMuted }}>
                {appointment.service_name}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: 14.5,
              fontWeight: '700',
              color: theme.text,
              marginBottom: 8,
            }}
          >
            {dateLabel} · {formatTime(starts)}
          </Text>
          <Text style={{ fontSize: 13, color: theme.textMuted }}>{address}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Pressable
              onPress={openMaps}
              style={{
                flex: 1,
                alignItems: 'center',
                padding: 12,
                borderRadius: 12,
                backgroundColor: theme.accentBg,
              }}
            >
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.accentText }}>
                Open in Maps
              </Text>
            </Pressable>
            <Pressable
              onPress={openWaze}
              style={{
                flex: 1,
                alignItems: 'center',
                padding: 12,
                borderRadius: 12,
                backgroundColor: theme.surface2,
              }}
            >
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.text }}>
                Open in Waze
              </Text>
            </Pressable>
          </View>
        </GlassView>

        <GlassView radius={16} style={{ marginTop: 16, padding: 16 }}>
          <Text style={{ fontSize: 12.5, color: theme.textMuted, lineHeight: 19 }}>
            Need to cancel or reschedule? Only your barber can do that — give them a call.
          </Text>
          <Pressable
            onPress={callBarber}
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 13,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: theme.text,
            }}
          >
            <PhoneIcon color={theme.text} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>
              Call {barberName} to cancel
            </Text>
          </Pressable>
        </GlassView>
      </View>
    </ScrollView>
  );
}
