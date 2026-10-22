import { StyleSheet } from 'react-native';

export const palette = {
  background: '#4C2D73',
  surface: '#5B3983',
  raised: '#684592',
  line: '#81619E',
  text: '#FFFFFF',
  muted: '#E0D4EE',
  green: '#C8EF9A',
  yellow: '#FFDA86',
  red: '#FFB4BB',
  ink: '#34204B',
  glass: 'rgba(255, 255, 255, 0.025)',
  glassStroke: 'rgba(255, 255, 255, 0.10)',
  glassAccent: 'rgba(255, 255, 255, 0.085)',
  glassNav: 'rgba(255, 255, 255, 0.045)',
} as const;

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 18, paddingBottom: 28, width: '100%', maxWidth: 640, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1, minWidth: 0 },
  title: { color: palette.text, fontSize: 32, fontWeight: '600', lineHeight: 40, letterSpacing: -0.6 },
  text: { color: palette.text, fontSize: 17, lineHeight: 25 },
  secondary: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  demo: { color: palette.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 64, marginBottom: 20 },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  initials: { color: palette.ink, fontSize: 16, fontWeight: '600' },
  button: { minHeight: 58, borderRadius: 18, overflow: 'hidden', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  buttonText: { color: palette.text, fontSize: 16, fontWeight: '600', lineHeight: 24, flexShrink: 1, textAlign: 'center' },
  pressed: { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
  listRow: { paddingVertical: 22, borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  section: { color: palette.text, fontSize: 22, lineHeight: 30, fontWeight: '600', marginTop: 26, marginBottom: 12 },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: palette.glass, borderWidth: 1, borderColor: palette.glassStroke },
});
