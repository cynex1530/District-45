import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { updateBarberPhone, updateProfilePhone } from '../../api';
import { MoonIcon, SunIcon } from '../../components/icons';
import { GlassInput, GlassView, PrimaryButton, SectionLabel, SegmentedTabs } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../state/AuthContext';
import { useTheme } from '../../theme/ThemeContext';

export function AppearanceSection() {
  const { theme, themeName, setThemeName } = useTheme();
  return (
    <View style={{ marginBottom: 26 }}>
      <SectionLabel>Appearance</SectionLabel>
      <SegmentedTabs
        options={[
          { key: 'light', label: 'Light', icon: (c) => <SunIcon color={c} /> },
          { key: 'dark', label: 'Dark', icon: (c) => <MoonIcon color={c} /> },
        ]}
        value={themeName}
        onChange={(k) => setThemeName(k as 'light' | 'dark')}
      />
    </View>
  );
}

export function AccountSection() {
  const { theme } = useTheme();
  const { session, profile, authProvider, refreshProfile, signOut } = useAuth();
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updated, setUpdated] = useState(false);
  const [busy, setBusy] = useState(false);

  const canChangePassword = authProvider === 'email' || authProvider === null;
  const ssoLabel = authProvider === 'apple' ? 'Apple' : 'Google';

  const savePhone = async () => {
    if (!profile) return;
    try {
      await updateProfilePhone(profile.id, phone.trim());
      if (profile.role === 'barber') await updateBarberPhone(profile.id, phone.trim());
      await refreshProfile();
    } catch {
      Alert.alert('Could not save', 'Phone number was not updated. Try again.');
    }
  };

  const passwordValid =
    newPassword.length > 3 && newPassword === confirmNewPassword && currentPassword.length > 0;

  const updatePassword = async () => {
    if (!session?.user.email) return;
    setBusy(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      });
      if (verifyError) throw new Error('Current password is incorrect.');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setUpdated(true);
      setTimeout(() => setUpdated(false), 2200);
    } catch (e) {
      Alert.alert('Password not updated', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <SectionLabel>Account</SectionLabel>
      <GlassView radius={16} style={{ padding: 16, marginBottom: 10 }}>
        <GlassInput
          label="Phone number"
          variant="surface"
          value={phone}
          onChangeText={setPhone}
          onEndEditing={savePhone}
          placeholder="+1 555 000 0000"
          keyboardType="phone-pad"
        />
        <View style={{ height: 16 }} />
        <Text
          style={{
            fontSize: 12.5,
            fontWeight: '600',
            color: theme.textMuted,
            marginBottom: 6,
          }}
        >
          Password
        </Text>
        {canChangePassword ? (
          <View style={{ gap: 8 }}>
            <GlassInput
              variant="surface"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              secureTextEntry
            />
            <GlassInput
              variant="surface"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              secureTextEntry
            />
            <GlassInput
              variant="surface"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              placeholder="Confirm new password"
              secureTextEntry
            />
            <PrimaryButton
              small
              label={updated ? 'Password updated ✓' : busy ? 'Updating…' : 'Update password'}
              disabled={!passwordValid || busy}
              onPress={updatePassword}
              style={{ marginTop: 2 }}
            />
          </View>
        ) : (
          <Text style={{ fontSize: 12.5, color: theme.textFaint, lineHeight: 19 }}>
            Password is managed by {ssoLabel}. Sign in with {ssoLabel} to change it.
          </Text>
        )}
      </GlassView>

      <Pressable onPress={signOut} style={{ alignItems: 'center', padding: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textFaint }}>Sign out</Text>
      </Pressable>
    </View>
  );
}
