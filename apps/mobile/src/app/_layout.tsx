import '@/global.css';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FamilyProvider } from '@/modules/family/session';
import { palette } from '@/modules/family/theme';
import { GlassProvider } from '@/modules/family/glass';

export default function RootLayout() {
  return (
    <FamilyProvider>
      <ThemeProvider value={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: 'transparent', card: 'transparent', text: palette.text, primary: palette.green, border: palette.line } }}>
        <GlassProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
        </GlassProvider>
      </ThemeProvider>
    </FamilyProvider>
  );
}
