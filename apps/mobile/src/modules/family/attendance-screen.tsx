import { Text, View } from 'react-native';
import { attendanceLabels, attendanceState, formatDay } from './attendance';
import { BackButton, ChildHeader, DemoNote, Screen } from './components';
import { historyFor } from './demo';
import { useFamily } from './session';
import { palette, ui } from './theme';

export function AttendanceScreen() {
  const { child } = useFamily();
  if (!child) return null;
  return <Screen><BackButton /><ChildHeader />
    <Text accessibilityRole="header" style={ui.title}>Asistencias</Text>
    <Text style={[ui.secondary, { marginTop: 8, marginBottom: 10 }]}>Octubre 2026</Text>
    {historyFor(child).map(record => {
      const status = attendanceLabels[attendanceState(record)];
      return <View key={record.date} style={ui.listRow}>
        <View style={[ui.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}><Text style={[ui.text, { fontWeight: '600' }]}>{formatDay(record.date)}</Text><Text style={[ui.secondary, { color: palette[status.tone] }]}>{status.label}</Text></View>
        {record.late && <Text style={[ui.secondary, { color: palette.yellow }]}>Entrada con retardo</Text>}
        {(record.entry || record.exit) && <Text style={ui.secondary}>{record.entry ? `Entrada ${record.entry} h` : 'Sin entrada'}{ '   ·   ' }{record.exit ? `Salida ${record.exit} h` : 'Sin salida'}</Text>}
      </View>;
    })}
    <DemoNote />
  </Screen>;
}
