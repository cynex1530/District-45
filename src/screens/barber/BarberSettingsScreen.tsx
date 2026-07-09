import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  addTimeOff,
  deleteService,
  deleteTimeOff,
  fetchServices,
  fetchTimeOff,
  fetchWorkingHours,
  updateTimeOff,
  updateWorkingHours,
  upsertService,
} from '../../api';
import {
  BackButton,
  GlassView,
  SectionLabel,
  ToggleSwitch,
} from '../../components/ui';
import {
  displayToTime,
  normalizeDateInput,
  timeToDisplay,
} from '../../lib/dates';
import { Barber, Service, TimeOff, WorkingHours } from '../../lib/types';
import { useTheme } from '../../theme/ThemeContext';
import { FONT_HEADING } from '../../theme/tokens';
import { AccountSection, AppearanceSection } from '../settings/sections';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
  barber: Barber;
  onBack: () => void;
}

interface DraftTimeOff {
  id: string; // 'draft-*' until persisted
  start: string;
  end: string;
}

export function BarberSettingsScreen({ barber, onBack }: Props) {
  const { theme } = useTheme();
  const [services, setServices] = useState<Service[] | null>(null);
  const [hours, setHours] = useState<WorkingHours[] | null>(null);
  const [timeOff, setTimeOff] = useState<DraftTimeOff[]>([]);
  const [hourDrafts, setHourDrafts] = useState<Record<number, { start: string; end: string }>>({});
  const [draftCounter, setDraftCounter] = useState(1);

  useEffect(() => {
    Promise.all([
      fetchServices(barber.id),
      fetchWorkingHours(barber.id),
      fetchTimeOff(barber.id),
    ])
      .then(([sv, h, t]) => {
        setServices(sv);
        setHours(h);
        setHourDrafts(
          Object.fromEntries(
            h.map((row) => [
              row.weekday,
              { start: timeToDisplay(row.start_time), end: timeToDisplay(row.end_time) },
            ]),
          ),
        );
        setTimeOff(
          t.map((v: TimeOff) => ({ id: v.id, start: v.start_date, end: v.end_date })),
        );
      })
      .catch(() => {
        setServices([]);
        setHours([]);
      });
  }, [barber.id]);

  // --- services -------------------------------------------------------------
  const patchService = (id: string, patch: Partial<Service>) => {
    setServices((prev) => prev?.map((s) => (s.id === id ? { ...s, ...patch } : s)) ?? prev);
  };

  const saveService = async (id: string) => {
    const sv = services?.find((s) => s.id === id);
    if (!sv) return;
    try {
      await upsertService({
        id: sv.id,
        barber_id: barber.id,
        name: sv.name,
        duration_min: sv.duration_min > 0 ? sv.duration_min : 30,
        price: sv.price >= 0 ? sv.price : 0,
        sort_order: sv.sort_order,
      });
    } catch {
      Alert.alert('Could not save', 'Service was not updated. Try again.');
    }
  };

  const onAddService = async () => {
    try {
      const created = await upsertService({
        barber_id: barber.id,
        name: '',
        duration_min: 30,
        price: 0,
        sort_order: services?.length ?? 0,
      });
      setServices((prev) => [...(prev ?? []), created]);
    } catch {
      Alert.alert('Could not add service', 'Try again.');
    }
  };

  const onRemoveService = async (id: string) => {
    setServices((prev) => prev?.filter((s) => s.id !== id) ?? prev);
    try {
      await deleteService(id);
    } catch {
      Alert.alert('Could not remove service', 'It may have existing bookings.');
    }
  };

  // --- working hours ----------------------------------------------------------
  const onToggleDay = async (row: WorkingHours) => {
    const next = { ...row, is_open: !row.is_open };
    setHours((prev) => prev?.map((h) => (h.weekday === row.weekday ? next : h)) ?? prev);
    try {
      await updateWorkingHours({
        barber_id: barber.id,
        weekday: next.weekday,
        is_open: next.is_open,
        start_time: next.start_time,
        end_time: next.end_time,
      });
    } catch {
      Alert.alert('Could not save', 'Working hours were not updated.');
    }
  };

  const onSaveHourField = async (row: WorkingHours, field: 'start' | 'end') => {
    const draft = hourDrafts[row.weekday];
    if (!draft) return;
    const parsed = displayToTime(field === 'start' ? draft.start : draft.end);
    if (!parsed) {
      // restore last valid value
      setHourDrafts((prev) => ({
        ...prev,
        [row.weekday]: {
          start: timeToDisplay(row.start_time),
          end: timeToDisplay(row.end_time),
        },
      }));
      return;
    }
    const next = {
      ...row,
      start_time: field === 'start' ? parsed : row.start_time,
      end_time: field === 'end' ? parsed : row.end_time,
    };
    if (next.end_time <= next.start_time) {
      Alert.alert('Invalid hours', 'Closing time must be after opening time.');
      setHourDrafts((prev) => ({
        ...prev,
        [row.weekday]: {
          start: timeToDisplay(row.start_time),
          end: timeToDisplay(row.end_time),
        },
      }));
      return;
    }
    setHours((prev) => prev?.map((h) => (h.weekday === row.weekday ? next : h)) ?? prev);
    try {
      await updateWorkingHours({
        barber_id: barber.id,
        weekday: next.weekday,
        is_open: next.is_open,
        start_time: next.start_time,
        end_time: next.end_time,
      });
    } catch {
      Alert.alert('Could not save', 'Working hours were not updated.');
    }
  };

  // --- time off ---------------------------------------------------------------
  const onAddTimeOff = () => {
    setTimeOff((prev) => [...prev, { id: `draft-${draftCounter}`, start: '', end: '' }]);
    setDraftCounter((c) => c + 1);
  };

  const onTimeOffChange = (id: string, field: 'start' | 'end', value: string) => {
    setTimeOff((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const onTimeOffBlur = async (id: string) => {
    const row = timeOff.find((v) => v.id === id);
    if (!row) return;
    const start = normalizeDateInput(row.start);
    const end = normalizeDateInput(row.end);
    if (!start || !end || end < start) return; // wait until both dates are valid
    try {
      if (id.startsWith('draft-')) {
        const created = await addTimeOff(barber.id, start, end);
        setTimeOff((prev) =>
          prev.map((v) =>
            v.id === id ? { id: created.id, start: created.start_date, end: created.end_date } : v,
          ),
        );
      } else {
        await updateTimeOff(id, start, end);
      }
    } catch {
      Alert.alert('Could not save', 'Time off was not saved. Try again.');
    }
  };

  const onRemoveTimeOff = async (id: string) => {
    setTimeOff((prev) => prev.filter((v) => v.id !== id));
    if (!id.startsWith('draft-')) {
      try {
        await deleteTimeOff(id);
      } catch {
        Alert.alert('Could not remove', 'Time off was not removed. Try again.');
      }
    }
  };

  const inputStyle = {
    backgroundColor: theme.surface2,
    borderRadius: 8,
    color: theme.text,
    fontSize: 13,
    textAlign: 'center' as const,
    paddingVertical: 6,
    paddingHorizontal: 2,
  };

  return (
    <View style={{ flex: 1, paddingTop: 58 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 24,
          paddingBottom: 16,
        }}
      >
        <BackButton onPress={onBack} />
        <Text style={{ fontFamily: FONT_HEADING, fontSize: 19, color: theme.text }}>
          Settings
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <AppearanceSection />
        <AccountSection />

        <SectionLabel style={{ marginTop: 26 }}>Services & pricing</SectionLabel>
        {!services ? (
          <ActivityIndicator color={theme.textMuted} />
        ) : (
          services.map((sv) => (
            <GlassView
              key={sv.id}
              radius={14}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                padding: 10,
                marginBottom: 8,
              }}
            >
              <TextInput
                value={sv.name}
                onChangeText={(v) => patchService(sv.id, { name: v })}
                onEndEditing={() => saveService(sv.id)}
                placeholder="Service name"
                placeholderTextColor={theme.textFaint}
                style={{
                  flex: 1,
                  minWidth: 0,
                  color: theme.text,
                  fontSize: 14,
                  fontWeight: '600',
                  paddingVertical: 6,
                  paddingHorizontal: 4,
                }}
              />
              <TextInput
                value={String(sv.duration_min)}
                onChangeText={(v) => patchService(sv.id, { duration_min: parseInt(v, 10) || 0 })}
                onEndEditing={() => saveService(sv.id)}
                keyboardType="number-pad"
                style={[inputStyle, { width: 48 }]}
              />
              <Text style={{ fontSize: 11, color: theme.textFaint }}>min</Text>
              <Text style={{ fontSize: 13, color: theme.textMuted }}>$</Text>
              <TextInput
                value={String(sv.price)}
                onChangeText={(v) => patchService(sv.id, { price: parseFloat(v) || 0 })}
                onEndEditing={() => saveService(sv.id)}
                keyboardType="decimal-pad"
                style={[inputStyle, { width: 48 }]}
              />
              <RemoveButton onPress={() => onRemoveService(sv.id)} />
            </GlassView>
          ))
        )}
        <DashedAddButton label="+ Add service" onPress={onAddService} />

        <SectionLabel style={{ marginTop: 26 }}>Working hours</SectionLabel>
        <View style={{ gap: 6, marginBottom: 26 }}>
          {!hours ? (
            <ActivityIndicator color={theme.textMuted} />
          ) : (
            [...hours]
              .sort((a, b) => a.weekday - b.weekday)
              .map((row) => (
                <GlassView
                  key={row.weekday}
                  radius={14}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text
                    style={{
                      width: 36,
                      fontSize: 13,
                      fontWeight: '700',
                      color: theme.text,
                    }}
                  >
                    {DAY_LABELS[row.weekday]}
                  </Text>
                  <ToggleSwitch on={row.is_open} onToggle={() => onToggleDay(row)} />
                  {row.is_open ? (
                    <>
                      <TextInput
                        value={hourDrafts[row.weekday]?.start ?? ''}
                        onChangeText={(v) =>
                          setHourDrafts((prev) => ({
                            ...prev,
                            [row.weekday]: { ...prev[row.weekday], start: v },
                          }))
                        }
                        onEndEditing={() => onSaveHourField(row, 'start')}
                        style={[inputStyle, { flex: 1, minWidth: 0, fontSize: 12.5 }]}
                      />
                      <Text style={{ fontSize: 11, color: theme.textFaint }}>to</Text>
                      <TextInput
                        value={hourDrafts[row.weekday]?.end ?? ''}
                        onChangeText={(v) =>
                          setHourDrafts((prev) => ({
                            ...prev,
                            [row.weekday]: { ...prev[row.weekday], end: v },
                          }))
                        }
                        onEndEditing={() => onSaveHourField(row, 'end')}
                        style={[inputStyle, { flex: 1, minWidth: 0, fontSize: 12.5 }]}
                      />
                    </>
                  ) : (
                    <Text
                      style={{
                        flex: 1,
                        textAlign: 'right',
                        fontSize: 12.5,
                        color: theme.textFaint,
                      }}
                    >
                      Closed
                    </Text>
                  )}
                </GlassView>
              ))
          )}
        </View>

        <SectionLabel>Time off / vacation</SectionLabel>
        {timeOff.map((v) => (
          <GlassView
            key={v.id}
            radius={14}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
              marginBottom: 8,
            }}
          >
            <TextInput
              value={v.start}
              onChangeText={(t) => onTimeOffChange(v.id, 'start', t)}
              onEndEditing={() => onTimeOffBlur(v.id)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textFaint}
              style={[inputStyle, { flex: 1, minWidth: 0, fontSize: 12.5, textAlign: 'left', paddingHorizontal: 6 }]}
            />
            <Text style={{ fontSize: 11, color: theme.textFaint }}>to</Text>
            <TextInput
              value={v.end}
              onChangeText={(t) => onTimeOffChange(v.id, 'end', t)}
              onEndEditing={() => onTimeOffBlur(v.id)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textFaint}
              style={[inputStyle, { flex: 1, minWidth: 0, fontSize: 12.5, textAlign: 'left', paddingHorizontal: 6 }]}
            />
            <RemoveButton onPress={() => onRemoveTimeOff(v.id)} />
          </GlassView>
        ))}
        {timeOff.length === 0 ? (
          <Text style={{ fontSize: 12.5, color: theme.textFaint, marginBottom: 12 }}>
            No time off scheduled.
          </Text>
        ) : null}
        <DashedAddButton label="+ Add time off" onPress={onAddTimeOff} bottomMargin={16} />

        <Text style={{ fontSize: 11.5, color: theme.textFaint, lineHeight: 17 }}>
          Changes apply to upcoming scheduling.
        </Text>
      </ScrollView>
    </View>
  );
}

function RemoveButton({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: theme.glassBgStrong,
        borderWidth: 1,
        borderColor: theme.glassBorder,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 16 }}>×</Text>
    </Pressable>
  );
}

function DashedAddButton({
  label,
  onPress,
  bottomMargin = 26,
}: {
  label: string;
  onPress: () => void;
  bottomMargin?: number;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.border,
        alignItems: 'center',
        marginBottom: bottomMargin,
      }}
    >
      <Text style={{ fontSize: 13.5, fontWeight: '600', color: theme.textMuted }}>{label}</Text>
    </Pressable>
  );
}
