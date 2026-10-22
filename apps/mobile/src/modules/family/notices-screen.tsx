import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { ChildHeader, DemoNote, Icon, Screen } from './components';
import { notices } from './demo';
import { useFamily } from './session';
import { ui } from './theme';

export function NoticesScreen() {
  const { child } = useFamily();
  if (!child) return null;
  const items = notices.filter(notice => notice.children.includes(child.id));
  return <Screen><ChildHeader /><Text accessibilityRole="header" style={[ui.title, { marginBottom: 18 }]}>Avisos</Text>
    {items.map(notice => <Pressable key={notice.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/notice/[id]', params: { id: notice.id } })} style={({ pressed }) => [ui.listRow, { gap: 14 }, pressed && ui.pressed]}>
      <View style={[ui.row, { justifyContent: 'space-between' }]}><Text style={[ui.secondary, ui.badge]}>{notice.category}</Text><Text style={ui.secondary}>{notice.date}</Text></View>
      <View style={ui.row}><Text style={[ui.text, ui.grow, { fontSize: 22, lineHeight: 30, fontWeight: '600' }]}>{notice.title}</Text><Icon name="right" size={20} /></View>
      <Text style={ui.secondary}>{notice.audience}</Text>
    </Pressable>)}
    {!items.length && <Text style={[ui.text, { marginTop: 40 }]}>No hay avisos para este alumno.</Text>}
    <DemoNote />
  </Screen>;
}
