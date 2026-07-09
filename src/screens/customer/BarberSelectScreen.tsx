import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { fetchBarbers } from '../../api';
import { BarberPhoto } from '../../components/BarberPhoto';
import { BackChevron, GearIcon, RightChevron } from '../../components/icons';
import { CircleButton, PrimaryButton } from '../../components/ui';
import { Barber } from '../../lib/types';
import { useTheme } from '../../theme/ThemeContext';
import { FONT_HEADING } from '../../theme/tokens';

const CARD_W = 320;
const CARD_GAP = 16;
const SNAP = CARD_W + CARD_GAP;
const PHOTO_H = 480;

interface Props {
  onSelectBarber: (barber: Barber) => void;
  onOpenSettings: () => void;
}

export function BarberSelectScreen({ onSelectBarber, onOpenSettings }: Props) {
  const { theme } = useTheme();
  const [barbers, setBarbers] = useState<Barber[] | null>(null);
  const [index, setIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<Barber>>(null);

  const sidePad = (Dimensions.get('window').width - CARD_W) / 2;

  useEffect(() => {
    fetchBarbers()
      .then(setBarbers)
      .catch(() => setBarbers([]));
  }, []);

  const scrollTo = (i: number) => {
    if (!barbers) return;
    const clamped = Math.min(barbers.length - 1, Math.max(0, i));
    listRef.current?.scrollToOffset({ offset: clamped * SNAP, animated: true });
    setIndex(clamped);
  };

  return (
    <View style={{ flex: 1, paddingTop: 58 }}>
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <View>
          <Text style={{ fontFamily: FONT_HEADING, fontSize: 21, color: theme.text }}>
            Choose your barber
          </Text>
          <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 3 }}>
            Swipe to browse nearby barbers
          </Text>
        </View>
        <CircleButton onPress={onOpenSettings}>
          <GearIcon color={theme.text} />
        </CircleButton>
      </View>

      {!barbers ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.textMuted} />
        </View>
      ) : barbers.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Text style={{ fontSize: 13, color: theme.textFaint, textAlign: 'center' }}>
            No barbers available yet. Check back soon.
          </Text>
        </View>
      ) : (
        <>
          <View style={{ flex: 1 }}>
            <Animated.FlatList
              ref={listRef}
              data={barbers}
              horizontal
              keyExtractor={(b) => b.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: sidePad, paddingTop: 2 }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                {
                  useNativeDriver: true,
                  listener: (e: { nativeEvent: { contentOffset: { x: number } } }) => {
                    const i = Math.round(e.nativeEvent.contentOffset.x / SNAP);
                    if (i !== index) setIndex(Math.min(barbers.length - 1, Math.max(0, i)));
                  },
                },
              )}
              scrollEventThrottle={16}
              renderItem={({ item, index: i }) => {
                const inputRange = [
                  (i - 2) * SNAP,
                  (i - 1) * SNAP,
                  i * SNAP,
                  (i + 1) * SNAP,
                  (i + 2) * SNAP,
                ];
                const scale = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.88, 0.93, 1, 0.93, 0.88],
                  extrapolate: 'clamp',
                });
                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.3, 0.55, 1, 0.55, 0.3],
                  extrapolate: 'clamp',
                });
                return (
                  <Animated.View
                    style={{
                      width: CARD_W,
                      marginRight: i === barbers.length - 1 ? 0 : CARD_GAP,
                      transform: [{ scale }],
                      opacity,
                    }}
                  >
                    <BarberPhoto
                      photoUrl={item.photo_url}
                      width={CARD_W}
                      height={PHOTO_H}
                      radius={28}
                      showLabel
                    >
                      <Svg
                        width={CARD_W}
                        height={180}
                        style={{ position: 'absolute', left: 0, bottom: 0 }}
                      >
                        <Defs>
                          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor="#141414" stopOpacity={0} />
                            <Stop offset="1" stopColor="#101010" stopOpacity={0.85} />
                          </LinearGradient>
                        </Defs>
                        <Rect width={CARD_W} height={180} fill="url(#fade)" />
                      </Svg>
                      <View style={{ position: 'absolute', left: 22, right: 22, bottom: 20 }}>
                        <Text style={{ fontFamily: FONT_HEADING, fontSize: 23, color: '#fff' }}>
                          {item.display_name}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#d8d8d6', marginTop: 3 }}>
                          {item.specialty} · {item.years_experience} yrs
                        </Text>
                      </View>
                    </BarberPhoto>
                    <PrimaryButton
                      label="Select barber"
                      onPress={() => onSelectBarber(item)}
                      style={{ marginTop: 12, padding: 14, borderRadius: 14 }}
                    />
                  </Animated.View>
                );
              }}
            />
            {index > 0 ? (
              <CircleButton
                onPress={() => scrollTo(index - 1)}
                style={{ position: 'absolute', top: 220, left: 6 }}
              >
                <BackChevron color={theme.text} width={8} height={14} />
              </CircleButton>
            ) : null}
            {index < barbers.length - 1 ? (
              <CircleButton
                onPress={() => scrollTo(index + 1)}
                style={{ position: 'absolute', top: 220, right: 6 }}
              >
                <RightChevron color={theme.text} />
              </CircleButton>
            ) : null}
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
              paddingBottom: 22,
            }}
          >
            {barbers.map((b, i) => (
              <View
                key={b.id}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === index ? theme.accentBg : theme.dotMuted,
                }}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}
