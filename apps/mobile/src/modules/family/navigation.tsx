import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './components';
import { RequireChild } from './session';
import { palette } from './theme';
import { GlassBackdrop } from './glass';

export default function StudentTabs() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);
  return <RequireChild><Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: palette.green,
    tabBarInactiveTintColor: palette.muted,
    tabBarBackground: () => <GlassBackdrop variant="navigation" />,
    tabBarStyle: { backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0, borderRadius: 24, overflow: 'hidden', marginHorizontal: 16, marginBottom: 12, paddingTop: 10, paddingBottom: bottom, height: 68 + bottom },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 4 },
    sceneStyle: { backgroundColor: 'transparent' },
  }}>
    <Tabs.Screen name="grades" options={{ title: 'Calificaciones', tabBarIcon: ({ focused }) => <Icon name="grades" color={focused ? palette.green : palette.muted} /> }} />
    <Tabs.Screen name="home" options={{ title: 'Inicio', tabBarIcon: ({ focused }) => <Icon name="home" color={focused ? palette.green : palette.muted} /> }} />
    <Tabs.Screen name="notices" options={{ title: 'Avisos', tabBarIcon: ({ focused }) => <Icon name="notices" color={focused ? palette.green : palette.muted} /> }} />
  </Tabs></RequireChild>;
}
