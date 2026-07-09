import React from 'react';
import {
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme/tokens';
import { BackChevron } from './icons';

/**
 * Glass shadow approximating the handoff's soft drop + inset highlight
 * (backdrop blur is not available in RN core; fills/borders match 1:1).
 */
export function glassShadow(theme: Theme, size: 'sm' | 'md' | 'lg' = 'md'): ViewStyle {
  const radius = size === 'sm' ? 8 : size === 'lg' ? 32 : 24;
  const height = size === 'sm' ? 2 : size === 'lg' ? 12 : 8;
  return {
    shadowColor: theme.name === 'dark' ? '#000' : '#3c372d',
    shadowOpacity: theme.name === 'dark' ? 0.28 : 0.1,
    shadowRadius: radius / 2,
    shadowOffset: { width: 0, height },
    elevation: size === 'sm' ? 2 : size === 'lg' ? 8 : 5,
  };
}

interface GlassViewProps {
  strong?: boolean;
  radius?: number;
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function GlassView({ strong, radius = 16, shadow = 'md', style, children }: GlassViewProps) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: strong ? theme.glassBgStrong : theme.glassBg,
          borderWidth: 1,
          borderColor: theme.glassBorder,
          borderRadius: radius,
        },
        shadow !== 'none' ? glassShadow(theme, shadow) : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}

export function PrimaryButton({ label, onPress, disabled, style, small }: PrimaryButtonProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          padding: small ? 12 : 15,
          borderRadius: small ? 11 : 13,
          backgroundColor: disabled ? theme.disabledBg : theme.accentBg,
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: small ? 14 : 15,
          fontWeight: '700',
          color: disabled ? theme.disabledText : theme.accentText,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface CircleButtonProps {
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function CircleButton({ onPress, size = 38, style, children }: CircleButtonProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.glassBgStrong,
          borderWidth: 1,
          borderColor: theme.glassBorder,
          alignItems: 'center',
          justifyContent: 'center',
        },
        glassShadow(theme, 'sm'),
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function BackButton({ onPress, size = 36 }: { onPress: () => void; size?: number }) {
  const { theme } = useTheme();
  return (
    <CircleButton onPress={onPress} size={size}>
      <BackChevron color={theme.text} />
    </CircleButton>
  );
}

interface GlassInputProps extends TextInputProps {
  label?: string;
  /** 'glass' = auth-style field, 'surface' = settings-panel field */
  variant?: 'glass' | 'surface';
}

export function GlassInput({ label, variant = 'glass', style, ...props }: GlassInputProps) {
  const { theme } = useTheme();
  return (
    <View>
      {label ? (
        <Text
          style={{
            fontSize: 12.5,
            fontWeight: '600',
            color: theme.textMuted,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={theme.textFaint}
        {...props}
        style={[
          variant === 'glass'
            ? {
                paddingVertical: 13,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.glassBorder,
                backgroundColor: theme.glassBg,
                fontSize: 14.5,
                color: theme.text,
              }
            : {
                paddingVertical: 11,
                paddingHorizontal: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme.glassBorder,
                backgroundColor: theme.surface2,
                fontSize: 14,
                color: theme.text,
              },
          style,
        ]}
      />
    </View>
  );
}

export function SectionLabel({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: 12,
          fontWeight: '700',
          color: theme.textFaint,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 10,
        },
        style as object,
      ]}
    >
      {children}
    </Text>
  );
}

export function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      style={{
        width: 40,
        height: 24,
        borderRadius: 999,
        backgroundColor: on ? theme.accentBg : theme.surface2,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: on ? theme.accentText : theme.textFaint,
          marginLeft: on ? 19 : 3,
        }}
      />
    </Pressable>
  );
}

export interface SegmentedOption {
  key: string;
  label: string;
  icon?: (color: string) => React.ReactNode;
}

interface SegmentedTabsProps {
  options: SegmentedOption[];
  value: string;
  onChange: (key: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedTabs({ options, value, onChange, style }: SegmentedTabsProps) {
  const { theme } = useTheme();
  return (
    <GlassView radius={14} style={[{ flexDirection: 'row', padding: 4 }, style]}>
      {options.map((opt) => {
        const active = opt.key === value;
        const color = active ? theme.accentText : theme.textMuted;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              borderRadius: 11,
              backgroundColor: active ? theme.accentBg : 'transparent',
            }}
          >
            {opt.icon ? opt.icon(color) : null}
            <Text style={{ fontSize: 13.5, fontWeight: '700', color }}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </GlassView>
  );
}
