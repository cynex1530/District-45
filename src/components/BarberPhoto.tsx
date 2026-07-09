import React from 'react';
import { Image, StyleProp, Text, View, ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

interface BarberPhotoProps {
  photoUrl?: string | null;
  width: number;
  height: number;
  radius?: number;
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Barber photo with the handoff's diagonal-stripe placeholder when no real
 * photo exists yet. Children render on top (gradient overlay, name text).
 */
export function BarberPhoto({
  photoUrl,
  width,
  height,
  radius = 0,
  showLabel,
  style,
  children,
}: BarberPhotoProps) {
  const { theme } = useTheme();
  return (
    <View style={[{ width, height, borderRadius: radius, overflow: 'hidden' }, style]}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={{ width, height }} resizeMode="cover" />
      ) : (
        <>
          <Svg width={width} height={height}>
            <Defs>
              <Pattern
                id="stripes"
                patternUnits="userSpaceOnUse"
                width={28}
                height={28}
                patternTransform="rotate(135)"
              >
                <Rect width={14} height={28} fill={theme.stripeA} />
                <Rect x={14} width={14} height={28} fill={theme.stripeB} />
              </Pattern>
            </Defs>
            <Rect width={width} height={height} fill="url(#stripes)" />
          </Svg>
          {showLabel ? (
            <Text
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                fontSize: 11,
                letterSpacing: 0.2,
                color: theme.textFaint,
                fontFamily: 'monospace',
              }}
            >
              barber photo
            </Text>
          ) : null}
        </>
      )}
      {children}
    </View>
  );
}
