import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { BackButton, ChildHeader, DemoNote, Screen } from './components';
import { notices } from './demo';
import { useFamily } from './session';
import { ui } from './theme';

export function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { child } = useFamily();
  const notice = notices.find(item => item.id === id && child && item.children.includes(child.id));
  return <Screen><BackButton /><ChildHeader />
    {notice ? <><Text accessibilityRole="header" style={ui.title}>{notice.title}</Text><Text style={[ui.secondary, { marginTop: 16, marginBottom: 32 }]}>{notice.date} · {notice.audience}</Text><Text style={ui.text}>{notice.body}</Text></> : <><Text style={ui.title}>Aviso no disponible</Text><Text style={[ui.secondary, { marginTop: 16 }]}>Este aviso no corresponde al alumno seleccionado o ya no está disponible. Vuelve a Avisos para consultar los demás.</Text></>}
    <DemoNote />
  </Screen>;
}
