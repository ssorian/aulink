import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChildHeader, DemoNote, Icon, Screen } from './components';
import { grades } from './demo';
import { GlassBackdrop } from './glass';
import { evaluationOptions, gradeSummary, type GradeFilter } from './grades';
import { useFamily } from './session';
import { palette, ui } from './theme';

export function GradesScreen() {
  const { child } = useFamily();
  const [filter, setFilter] = useState<GradeFilter>('total');
  if (!child) return null;
  const rows = (grades[child.id] ?? []).map(subject => ({
    subject: subject.subject,
    summary: gradeSummary(subject, filter),
  }));
  const hasPublished = rows.some(row => row.summary.value !== null);
  const evaluationPending = rows.length > 0 && filter !== 'total';
  const selectedLabel = evaluationOptions.find(option => option.id === filter)!.label;

  return <Screen>
    <ChildHeader />
    <Text accessibilityRole="header" style={ui.title}>Calificaciones</Text>
    <Text style={[ui.secondary, styles.cycle]}>Ciclo 2026–2027</Text>
    <Text style={[ui.secondary, styles.filterLabel]}>Evaluación</Text>
    <View style={styles.filters}>
      {evaluationOptions.map(option => {
        const selected = option.id === filter;
        return <Pressable key={option.id} accessibilityRole="button"
          accessibilityLabel={option.label} accessibilityState={{ selected }}
          onPress={() => setFilter(option.id)}
          style={({ pressed }) => [styles.filter, pressed && ui.pressed]}>
          {selected && <GlassBackdrop variant="control" />}
          <Text style={[styles.filterText, selected && styles.selectedText]}>{option.shortLabel}</Text>
        </Pressable>;
      })}
    </View>
    {hasPublished ? <>
      <View style={[ui.row, styles.columns]}>
        <Text style={ui.secondary}>Asignatura</Text>
        <Text style={ui.secondary}>{filter === 'total' ? 'Promedio / 10' : 'Calificación / 10'}</Text>
      </View>
      <View accessibilityLiveRegion="polite">
        {rows.map(({ subject, summary }) => <View key={subject} style={[ui.row, ui.listRow]}>
          <Text style={[ui.text, ui.grow]}>{subject}</Text>
          <View style={styles.score}>
            <Text style={summary.value === null ? ui.secondary : styles.grade}>
              {summary.value === null ? 'Sin publicar' : summary.value.toLocaleString('es-MX', { maximumFractionDigits: 1 })}
            </Text>
            {summary.partial && <Text style={styles.partial}>Parcial · {summary.count}/{summary.expected}</Text>}
          </View>
        </View>)}
      </View>
    </> : <View style={styles.empty} accessibilityLiveRegion="polite">
      <Icon name="grades" size={48} color={palette.muted} />
      <Text accessibilityRole="header" style={[ui.section, styles.emptyTitle]}>
        {evaluationPending ? 'Evaluación sin publicar' : 'Aún no hay calificaciones'}
      </Text>
      <Text style={[ui.secondary, styles.emptyCopy]}>
        {evaluationPending ? selectedLabel : 'La escuela aún no publica calificaciones.'}
      </Text>
    </View>}
    <DemoNote />
  </Screen>;
}

const styles = StyleSheet.create({
  cycle: { marginTop: 8, marginBottom: 22 },
  filterLabel: { marginBottom: 8 },
  filters: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  filter: { flex: 1, minHeight: 48, paddingHorizontal: 8, paddingVertical: 12, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  filterText: { color: palette.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  selectedText: { color: palette.green, fontWeight: '600' },
  columns: { justifyContent: 'space-between', paddingBottom: 12 },
  score: { alignItems: 'flex-end', gap: 3 },
  grade: { color: palette.green, fontSize: 30, lineHeight: 38, fontWeight: '600' },
  partial: { color: palette.yellow, fontSize: 12, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 18 },
  emptyTitle: { textAlign: 'center', marginTop: 0, marginBottom: 0 },
  emptyCopy: { textAlign: 'center' },
});
