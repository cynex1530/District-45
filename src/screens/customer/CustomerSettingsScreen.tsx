import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { BackButton } from '../../components/ui';
import { useTheme } from '../../theme/ThemeContext';
import { FONT_HEADING } from '../../theme/tokens';
import { AccountSection, AppearanceSection } from '../settings/sections';

interface Props {
  onBack: () => void;
}

export function CustomerSettingsScreen({ onBack }: Props) {
  const { theme } = useTheme();
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
      </ScrollView>
    </View>
  );
}
