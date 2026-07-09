import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { fetchServices } from '../../api';
import { BarberPhoto } from '../../components/BarberPhoto';
import { BackButton, PrimaryButton, glassShadow } from '../../components/ui';
import { Barber, Service } from '../../lib/types';
import { useTheme } from '../../theme/ThemeContext';
import { FONT_HEADING } from '../../theme/tokens';

interface Props {
  barber: Barber;
  onBack: () => void;
  onContinue: (service: Service) => void;
}

export function ServiceSelectScreen({ barber, onBack, onContinue }: Props) {
  const { theme } = useTheme();
  const [services, setServices] = useState<Service[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchServices(barber.id)
      .then(setServices)
      .catch(() => setServices([]));
  }, [barber.id]);

  const selected = services?.find((s) => s.id === selectedId) ?? null;

  return (
    <View style={{ flex: 1, paddingTop: 58 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 24,
          paddingBottom: 14,
        }}
      >
        <BackButton onPress={onBack} />
        <Text style={{ fontFamily: FONT_HEADING, fontSize: 19, color: theme.text }}>
          Choose a service
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <BarberPhoto photoUrl={barber.photo_url} width={38} height={38} radius={19} />
        <View>
          <Text style={{ fontWeight: '700', fontSize: 14, color: theme.text }}>
            {barber.display_name}
          </Text>
          <Text style={{ fontSize: 12, color: theme.textMuted }}>{barber.specialty}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 24, paddingBottom: 20 }}
      >
        {!services ? (
          <ActivityIndicator color={theme.textMuted} style={{ marginTop: 30 }} />
        ) : services.length === 0 ? (
          <Text style={{ fontSize: 13, color: theme.textFaint, textAlign: 'center', marginTop: 30 }}>
            This barber hasn't added services yet.
          </Text>
        ) : (
          services.map((sv) => {
            const isSel = sv.id === selectedId;
            return (
              <Pressable
                key={sv.id}
                onPress={() => setSelectedId(sv.id)}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 16,
                    paddingHorizontal: 18,
                    borderRadius: 16,
                    marginBottom: 10,
                    backgroundColor: isSel ? theme.glassBgStrong : theme.glassBg,
                    borderWidth: isSel ? 1.5 : 1,
                    borderColor: isSel ? theme.accentBg : theme.glassBorder,
                  },
                  glassShadow(theme, 'md'),
                ]}
              >
                <View>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: theme.text }}>
                    {sv.name}
                  </Text>
                  <Text style={{ fontSize: 12.5, color: theme.textMuted, marginTop: 2 }}>
                    {sv.duration_min} min
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: theme.text }}>
                    ${sv.price}
                  </Text>
                  <View
                    style={
                      isSel
                        ? {
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: theme.accentBg,
                          }
                        : {
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 1.5,
                            borderColor: theme.border,
                          }
                    }
                  />
                </View>
              </Pressable>
            );
          })
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
        <PrimaryButton
          label="Continue"
          disabled={!selected}
          onPress={() => selected && onContinue(selected)}
        />
      </View>
    </View>
  );
}
