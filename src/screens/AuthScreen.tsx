import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme/ThemeContext';
import { FONT_HEADING } from '../theme/tokens';
import { GlassInput, PrimaryButton, SegmentedTabs, glassShadow } from '../components/ui';

export function AuthScreen() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const valid = isRegister
    ? name.trim().length > 1 &&
      email.trim().length > 2 &&
      password.length > 3 &&
      password === confirmPassword
    : email.trim().length > 2 && password.length > 3;

  const submit = async () => {
    setBusy(true);
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim(), role: 'customer' } },
        });
        if (error) throw error;
        if (!data.session) {
          Alert.alert('Check your email', 'Confirm your email address, then log in.');
          setMode('login');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (e) {
      Alert.alert('Sign in failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const ssoNotConfigured = (provider: string) =>
    Alert.alert(
      `${provider} sign-in`,
      `${provider} OAuth isn't configured yet. Enable the provider in your Supabase dashboard and add the app's deep-link redirect.`,
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 58, paddingHorizontal: 24, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 28 }}>
          <Text
            style={{
              fontFamily: FONT_HEADING,
              fontSize: 27,
              letterSpacing: -0.54,
              color: theme.text,
            }}
          >
            DISTRICT 45.
          </Text>
          <Text style={{ fontSize: 14, color: theme.textMuted, marginTop: 5 }}>
            Book your next cut in seconds
          </Text>
        </View>

        <SegmentedTabs
          options={[
            { key: 'login', label: 'Log in' },
            { key: 'register', label: 'Register' },
          ]}
          value={mode}
          onChange={(k) => setMode(k as 'login' | 'register')}
          style={{ marginBottom: 22 }}
        />

        <View style={{ gap: 14 }}>
          {isRegister ? (
            <GlassInput
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="Jordan Smith"
              autoCapitalize="words"
            />
          ) : null}
          <GlassInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <GlassInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          {isRegister ? (
            <GlassInput
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secureTextEntry
            />
          ) : null}
        </View>

        <PrimaryButton
          label={busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          onPress={submit}
          disabled={!valid || busy}
          style={{ marginTop: 22 }}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: 22,
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: theme.divider }} />
          <Text style={{ fontSize: 12, color: theme.textFaint }}>or continue with</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.divider }} />
        </View>

        <View style={{ gap: 10 }}>
          <PrimaryButton
            label="Continue with Apple"
            onPress={() => ssoNotConfigured('Apple')}
            style={{ padding: 13, borderRadius: 12 }}
          />
          <Pressable
            onPress={() => ssoNotConfigured('Google')}
            style={[
              {
                padding: 13,
                borderRadius: 12,
                backgroundColor: theme.glassBg,
                borderWidth: 1,
                borderColor: theme.glassBorder,
                alignItems: 'center',
              },
              glassShadow(theme, 'md'),
            ]}
          >
            <Text style={{ fontSize: 14.5, fontWeight: '700', color: theme.text }}>
              Continue with Google
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
