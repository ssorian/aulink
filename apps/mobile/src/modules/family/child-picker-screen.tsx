import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { children } from './demo';
import { attendanceLabels, attendanceState } from './attendance';
import { BackButton, DemoNote, Icon, Screen } from './components';
import { useFamily } from './session';
import { palette, ui } from './theme';
import { GlassBackdrop } from './glass';
import { useHydrated } from '@/hooks/use-hydrated';

export function ChildPickerScreen() {
  const ready = useHydrated();
  const { change } = useLocalSearchParams<{ change?: string }>();
  const { child: selected, select } = useFamily();
  const changing = change === '1' && !!selected;
  function openChild(id: string) {
    select(id);
    if (changing && router.canGoBack()) router.back();
    else router.replace('/home');
  }
  return <Screen>
    {changing ? <BackButton /> : <Text style={styles.brand}>aulink<Text style={{ color: palette.green }}>.</Text></Text>}
    <View style={styles.intro}>
      <Text accessibilityRole="header" style={[ui.title, styles.heading]}>{changing ? 'Cambiar hijo' : 'Tus hijos'}</Text>
    </View>
    <View style={{ gap: 12 }}>
      {children.map(child => {
        const status = attendanceLabels[attendanceState(child.today)];
        return <Pressable key={child.id} accessibilityRole="button" accessibilityLabel={`Ver a ${child.name}, ${status.label}`} accessibilityState={{ selected: selected?.id === child.id, disabled: !ready }} disabled={!ready} onPress={() => openChild(child.id)} style={({ pressed }) => [styles.child, pressed && ui.pressed]}>
          <GlassBackdrop />
          <View style={[ui.avatar, { backgroundColor: child.color, width: 56, height: 56 }]}><Text style={ui.initials}>{child.initials}</Text></View>
          <View style={ui.grow}><Text style={[ui.text, { fontWeight: '600' }]}>{child.name}</Text><Text style={ui.secondary}>{child.group}</Text><View style={[ui.row, { gap: 6, marginTop: 8 }]}><View style={[styles.dot, { backgroundColor: palette[status.tone] }]} /><Text style={[ui.secondary, { color: palette[status.tone] }]}>{status.label}</Text></View></View>
          <Icon name="right" size={20} />
        </Pressable>;
      })}
    </View>
    <View style={styles.foot}>
      {!changing && <Pressable accessibilityRole="button" disabled={!ready} accessibilityState={{ disabled: !ready }} onPress={() => router.push('/reader')} style={({ pressed }) => [styles.reader, pressed && ui.pressed]}>
        <Text style={[ui.text, { textAlign: 'center' }]}>Modo lector de asistencia</Text>
      </Pressable>}
      <DemoNote />
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  brand: { color: palette.text, fontSize: 29, fontWeight: '700', letterSpacing: -1 },
  intro: { marginTop: 52, marginBottom: 36 },
  heading: { fontSize: 44, lineHeight: 50, letterSpacing: -1 },
  child: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14, borderRadius: 16, overflow: 'hidden' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  foot: { marginTop: 'auto', paddingTop: 38 },
  reader: { minHeight: 48, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: palette.line },
});
