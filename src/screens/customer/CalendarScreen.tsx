import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  bookAppointment,
  fetchBookedSlots,
  fetchTimeOff,
  fetchWorkingHours,
} from '../../api';
import { BackChevron, RightChevron } from '../../components/icons';
import { BackButton, CircleButton, PrimaryButton, glassShadow } from '../../components/ui';
import {
  CalendarDay,
  Slot,
  buildCalendarDays,
  buildSlots,
  formatDateLabel,
} from '../../lib/dates';
import { Appointment, Barber, BookedSlot, Service, TimeOff, WorkingHours } from '../../lib/types';
import { useTheme } from '../../theme/ThemeContext';
import { FONT_HEADING } from '../../theme/tokens';

const WEEK_LABELS = ['This week', 'Next week', 'In 2 weeks'];

interface Props {
  barber: Barber;
  service: Service;
  onBack: () => void;
  onBooked: (appointment: Appointment) => void;
}

export function CalendarScreen({ barber, service, onBack, onBooked }: Props) {
  const { theme } = useTheme();
  const [hours, setHours] = useState<WorkingHours[] | null>(null);
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [booked, setBooked] = useState<BookedSlot[]>([]);
  const [weekIndex, setWeekIndex] = useState(0);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [booking, setBooking] = useState(false);
  const weekScrollRef = useRef<ScrollView>(null);
  const pageWidth = Dimensions.get('window').width;

  useEffect(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 21);
    Promise.all([
      fetchWorkingHours(barber.id),
      fetchTimeOff(barber.id),
      fetchBookedSlots(barber.id, from, to),
    ])
      .then(([h, t, b]) => {
        setHours(h);
        setTimeOff(t);
        setBooked(b);
      })
      .catch(() => setHours([]));
  }, [barber.id]);

  const days = useMemo(
    () => (hours ? buildCalendarDays(hours, timeOff) : []),
    [hours, timeOff],
  );
  const weeks = useMemo(
    () => [days.slice(0, 7), days.slice(7, 14), days.slice(14, 21)],
    [days],
  );
  const selectedDay: CalendarDay | null =
    days.find((d) => d.key === selectedDayKey) ?? null;

  const slots = useMemo(
    () =>
      selectedDay && hours
        ? buildSlots(selectedDay, hours, booked, service.duration_min)
        : [],
    [selectedDay, hours, booked, service.duration_min],
  );

  const scrollWeekTo = (idx: number) => {
    const clamped = Math.min(2, Math.max(0, idx));
    weekScrollRef.current?.scrollTo({ x: clamped * pageWidth, animated: true });
    setWeekIndex(clamped);
  };

  const onWeekScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (idx !== weekIndex) setWeekIndex(Math.min(2, Math.max(0, idx)));
  };

  const confirm = async () => {
    if (!selectedSlot || !selectedDay) return;
    setBooking(true);
    try {
      const appt = await bookAppointment(barber.id, service.id, selectedSlot.startsAt);
      onBooked(appt);
    } catch (e) {
      Alert.alert(
        'Could not book',
        e instanceof Error ? e.message : 'That slot may have just been taken.',
      );
      // refresh booked slots so a stale slot disappears
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(to.getDate() + 21);
      fetchBookedSlots(barber.id, from, to).then(setBooked).catch(() => {});
      setSelectedSlot(null);
    } finally {
      setBooking(false);
    }
  };

  const canConfirm = !!(selectedDay && selectedSlot);

  return (
    <View style={{ flex: 1, paddingTop: 58 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 24,
          paddingBottom: 12,
        }}
      >
        <BackButton onPress={onBack} />
        <View>
          <Text style={{ fontFamily: FONT_HEADING, fontSize: 18, color: theme.text }}>
            Pick a time
          </Text>
          <Text style={{ fontSize: 12, color: theme.textMuted }}>
            {barber.display_name} · {service.name}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 24,
          paddingTop: 6,
          paddingBottom: 10,
        }}
      >
        <CircleButton
          onPress={() => scrollWeekTo(weekIndex - 1)}
          size={30}
          style={{ opacity: weekIndex === 0 ? 0.3 : 1 }}
        >
          <BackChevron color={theme.text} width={7} height={12} />
        </CircleButton>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 12.5,
            fontWeight: '700',
            color: theme.text,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {WEEK_LABELS[weekIndex]}
        </Text>
        <CircleButton
          onPress={() => scrollWeekTo(weekIndex + 1)}
          size={30}
          style={{ opacity: weekIndex === 2 ? 0.3 : 1 }}
        >
          <RightChevron color={theme.text} width={7} height={12} />
        </CircleButton>
      </View>

      {!hours ? (
        <ActivityIndicator color={theme.textMuted} style={{ marginVertical: 30 }} />
      ) : (
        <ScrollView
          ref={weekScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onWeekScroll}
        >
          {weeks.map((week, wi) => (
            <View
              key={wi}
              style={{
                width: pageWidth,
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 6,
                paddingTop: 2,
                paddingBottom: 6,
                paddingHorizontal: 24,
              }}
            >
              {week.map((day) => {
                const isSel = day.key === selectedDayKey;
                const bg = isSel
                  ? theme.accentBg
                  : day.closed
                    ? theme.closedBg
                    : theme.glassBg;
                const borderColor = isSel
                  ? theme.accentBg
                  : day.closed
                    ? theme.closedBorder
                    : theme.glassBorder;
                const colorMain = isSel
                  ? theme.accentText
                  : day.closed
                    ? theme.closedText
                    : theme.text;
                const colorSub = isSel
                  ? theme.accentText
                  : day.closed
                    ? theme.closedTextSub
                    : theme.textMuted;
                return (
                  <Pressable
                    key={day.key}
                    disabled={day.closed}
                    onPress={() => {
                      setSelectedDayKey(day.key);
                      setSelectedSlot(null);
                    }}
                    style={[
                      {
                        width: 44,
                        height: 62,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        backgroundColor: bg,
                        borderWidth: isSel ? 1.5 : 1,
                        borderColor,
                      },
                      !day.closed && !isSel ? glassShadow(theme, 'md') : null,
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontWeight: '700',
                        color: colorSub,
                        textTransform: 'uppercase',
                        letterSpacing: 0.3,
                        opacity: isSel ? 0.65 : 1,
                      }}
                    >
                      {day.weekday}
                    </Text>
                    <Text style={{ fontSize: 16.5, fontWeight: '700', color: colorMain }}>
                      {day.dayNum}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
          paddingTop: 8,
          paddingBottom: 14,
        }}
      >
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === weekIndex ? theme.accentBg : theme.dotMuted,
            }}
          />
        ))}
      </View>

      <ScrollView
        style={{ flex: 1, borderTopWidth: 1, borderTopColor: theme.divider }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 12 }}
      >
        <Text
          style={{
            fontSize: 12.5,
            fontWeight: '700',
            color: theme.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginTop: 14,
            marginBottom: 12,
          }}
        >
          {selectedDay ? formatDateLabel(selectedDay) : 'Available times'}
        </Text>

        {selectedDay?.closed ? (
          <EmptyNotice text="Closed this day — pick another date above." boxed />
        ) : selectedDay && slots.length === 0 ? (
          <EmptyNotice text="Fully booked — pick another date above." boxed />
        ) : !selectedDay ? (
          <EmptyNotice text="Pick a date above to see open times." />
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              paddingBottom: 10,
            }}
          >
            {slots.map((slot) => {
              const isSel = selectedSlot?.label === slot.label;
              return (
                <Pressable
                  key={slot.label}
                  onPress={() => setSelectedSlot(slot)}
                  style={{
                    width: '31.5%',
                    paddingVertical: 13,
                    borderRadius: 14,
                    alignItems: 'center',
                    backgroundColor: isSel ? theme.accentBg : theme.glassBg,
                    borderWidth: isSel ? 0 : 1,
                    borderColor: theme.glassBorder,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: '700',
                      color: isSel ? theme.accentText : theme.text,
                    }}
                  >
                    {slot.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View
        style={{
          paddingTop: 14,
          paddingHorizontal: 24,
          paddingBottom: 28,
          borderTopWidth: 1,
          borderTopColor: theme.divider,
        }}
      >
        {canConfirm && selectedDay ? (
          <Text style={{ fontSize: 12.5, color: theme.textMuted, marginBottom: 10 }}>
            {barber.display_name} · {service.name} · {selectedDay.weekday}{' '}
            {selectedDay.dayNum} · {selectedSlot?.label}
          </Text>
        ) : null}
        <PrimaryButton
          label={booking ? 'Booking…' : 'Confirm appointment'}
          disabled={!canConfirm || booking}
          onPress={confirm}
        />
      </View>
    </View>
  );
}

function EmptyNotice({ text, boxed }: { text: string; boxed?: boolean }) {
  const { theme } = useTheme();
  return (
    <View
      style={
        boxed
          ? {
              padding: 20,
              backgroundColor: theme.glassBg,
              borderWidth: 1,
              borderColor: theme.glassBorder,
              borderRadius: 14,
            }
          : { padding: 20 }
      }
    >
      <Text style={{ fontSize: 13, color: theme.textFaint, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}
