import {
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { isSupabaseConfigured } from './src/lib/supabase';
import { Appointment, Barber, Service } from './src/lib/types';
import { AuthScreen } from './src/screens/AuthScreen';
import { BarberScheduleScreen } from './src/screens/barber/BarberScheduleScreen';
import { BarberSettingsScreen } from './src/screens/barber/BarberSettingsScreen';
import { BarberSelectScreen } from './src/screens/customer/BarberSelectScreen';
import { CalendarScreen } from './src/screens/customer/CalendarScreen';
import { ConfirmedScreen } from './src/screens/customer/ConfirmedScreen';
import { CustomerSettingsScreen } from './src/screens/customer/CustomerSettingsScreen';
import { ServiceSelectScreen } from './src/screens/customer/ServiceSelectScreen';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { FONT_HEADING } from './src/theme/tokens';

type CustomerScreen = 'home' | 'service' | 'calendar' | 'settings';
type BarberScreen = 'schedule' | 'settings';

function CustomerFlow() {
  const { activeAppointment, setActiveAppointment } = useAuth();
  const [screen, setScreen] = useState<CustomerScreen>('home');
  const [barber, setBarber] = useState<Barber | null>(null);
  const [service, setService] = useState<Service | null>(null);

  // An active appointment locks the customer to the Confirmed screen.
  if (activeAppointment) {
    return <ConfirmedScreen appointment={activeAppointment} />;
  }

  if (screen === 'settings') {
    return <CustomerSettingsScreen onBack={() => setScreen('home')} />;
  }
  if (screen === 'service' && barber) {
    return (
      <ServiceSelectScreen
        barber={barber}
        onBack={() => {
          setService(null);
          setScreen('home');
        }}
        onContinue={(sv) => {
          setService(sv);
          setScreen('calendar');
        }}
      />
    );
  }
  if (screen === 'calendar' && barber && service) {
    return (
      <CalendarScreen
        barber={barber}
        service={service}
        onBack={() => setScreen('service')}
        onBooked={(appt: Appointment) => {
          setActiveAppointment(appt);
          setScreen('home');
          setBarber(null);
          setService(null);
        }}
      />
    );
  }
  return (
    <BarberSelectScreen
      onSelectBarber={(b) => {
        setBarber(b);
        setService(null);
        setScreen('service');
      }}
      onOpenSettings={() => setScreen('settings')}
    />
  );
}

function BarberFlow() {
  const { barber } = useAuth();
  const [screen, setScreen] = useState<BarberScreen>('schedule');

  if (!barber) return <CenteredSpinner />;
  if (screen === 'settings') {
    return <BarberSettingsScreen barber={barber} onBack={() => setScreen('schedule')} />;
  }
  return <BarberScheduleScreen barber={barber} onOpenSettings={() => setScreen('settings')} />;
}

function CenteredSpinner() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={theme.textMuted} />
    </View>
  );
}

function ConfigNotice() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontFamily: FONT_HEADING, fontSize: 22, color: theme.text }}>
        DISTRICT 45.
      </Text>
      <Text style={{ fontSize: 14, color: theme.textMuted, marginTop: 14, lineHeight: 21 }}>
        Supabase isn't configured yet. Copy .env.example to .env, fill in
        EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart the dev
        server. See README.md for the full setup.
      </Text>
    </View>
  );
}

function Root() {
  const { theme } = useTheme();
  const { session, profile, loading } = useAuth();

  let content: React.ReactNode;
  if (!isSupabaseConfigured) {
    content = <ConfigNotice />;
  } else if (loading) {
    content = <CenteredSpinner />;
  } else if (!session || !profile) {
    content = <AuthScreen />;
  } else if (profile.role === 'barber') {
    content = <BarberFlow />;
  } else {
    content = <CustomerFlow />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        {content}
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
