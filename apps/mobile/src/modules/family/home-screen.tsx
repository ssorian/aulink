import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { AttendanceMedallion } from './attendance-medallion';
import { DemoNote, Icon, Screen } from './components';
import { GlassBackdrop } from './glass';
import { useFamily } from './session';
import { palette, ui } from './theme';

export function HomeScreen() {
  const { child } = useFamily();
  const { height } = useWindowDimensions();
  if (!child) return null;

  return <Screen>
    <View style={[ui.row, { justifyContent: 'space-between' }]}>
      <View><Text style={styles.brand}>aulink<Text style={{ color: palette.green }}>.</Text></Text><DemoNote inline /></View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Cambiar hijo. Actual: ${child.name}`}
        onPress={() => router.push('/?change=1')}
        style={({ pressed }) => [styles.selector, pressed && ui.pressed]}>
        <GlassBackdrop />
        <View style={[ui.avatar, styles.compactAvatar, { backgroundColor: child.color }]}>
          <Text style={[ui.initials, { fontSize: 13 }]}>{child.initials}</Text>
        </View>
        <Icon name="down" size={18} />
      </Pressable>
    </View>
    <View style={[styles.status, { minHeight: Math.max(420, height * 0.63) }]}>
      <Text style={[ui.text, styles.childName]}>{child.name}</Text>
      <AttendanceMedallion record={child.today} />
    </View>
    <View style={styles.history}>
      <Text style={[ui.secondary, { textAlign: 'center', marginBottom: 16 }]}>
        22 de octubre · {child.group}
      </Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/attendance')}
        style={({ pressed }) => [ui.button, pressed && ui.pressed]}>
        <GlassBackdrop variant="action" />
        <Icon name="calendar" color={palette.green} size={22} />
        <Text style={ui.buttonText}>Historial de asistencias</Text>
        <Icon name="right" color={palette.green} size={18} />
      </Pressable>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  brand: { color: palette.text, fontSize: 28, fontWeight: '700', letterSpacing: -1 },
  selector: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, minHeight: 52, borderRadius: 16, overflow: 'hidden' },
  compactAvatar: { width: 36, height: 36, borderRadius: 12 },
  status: { justifyContent: 'center', alignItems: 'center', paddingVertical: 24 },
  childName: { marginBottom: 14, textAlign: 'center' },
  history: { marginTop: 'auto' },
});
