import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { useFamily } from './session';
import { palette, ui } from './theme';
import { FamilyAtmosphere } from './glass';

const symbols = {
  school: { ios: 'building.2', android: 'school', web: 'school' },
  sun: { ios: 'sun.max', android: 'sunny', web: 'sunny' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  absent: { ios: 'person.crop.circle.badge.xmark', android: 'person_off', web: 'person_off' },
  check: { ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  down: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  right: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  home: { ios: 'house', android: 'home', web: 'home' },
  grades: { ios: 'book.closed', android: 'menu_book', web: 'menu_book' },
  notices: { ios: 'bell', android: 'notifications', web: 'notifications' },
} as const;

export function Icon({ name, size = 24, color = palette.text }: { name: keyof typeof symbols; size?: number; color?: string }) {
  return <SymbolView name={symbols[name]} size={size} tintColor={color} />;
}

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={ui.screen}><FamilyAtmosphere /><SafeAreaView style={ui.screen} edges={['top', 'bottom', 'left', 'right']}><ScrollView contentContainerStyle={[ui.content, style]}>{children}</ScrollView></SafeAreaView></View>;
}

export function DemoNote({ inline = false }: { inline?: boolean }) {
  return <Text style={[ui.demo, inline && { marginTop: 2, textAlign: 'left' }]}>Datos de ejemplo</Text>;
}

export function ChildHeader() {
  const { child } = useFamily();
  if (!child) return null;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Cambiar hijo. Actual: ${child.name}`} onPress={() => router.push('/?change=1')} style={({ pressed }) => [ui.header, pressed && ui.pressed]}>
    <View style={[ui.avatar, { backgroundColor: child.color }]}><Text style={ui.initials}>{child.initials}</Text></View>
    <View style={ui.grow}><Text style={[ui.text, { fontWeight: '600' }]}>{child.name}</Text><Text style={ui.secondary}>{child.group}</Text></View>
    <Icon name="down" size={20} />
  </Pressable>;
}

export function BackButton() {
  return <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/home')} style={({ pressed }) => [ui.row, { minHeight: 48, alignSelf: 'flex-start', paddingRight: 16, marginBottom: 20 }, pressed && ui.pressed]}><Icon name="back" size={20} /><Text style={ui.text}>Volver</Text></Pressable>;
}
