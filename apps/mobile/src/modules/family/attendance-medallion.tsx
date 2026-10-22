import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { useMedallionMotion } from './medallion-motion';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { attendanceIndicators, attendanceLabels, attendanceState, type AttendanceRecord } from './attendance';
import { Icon } from './components';
import { palette } from './theme';

const tones = {
  green: { surface: '#F7FBEF', foreground: '#426625' },
  yellow: { surface: '#FFFBEE', foreground: '#775500' },
  red: { surface: '#FFF4F5', foreground: '#9C3349' },
  muted: { surface: '#FCF9FF', foreground: '#5D4876' },
} as const;
const shape = require('@/assets/images/attendance-shape.svg');

/** A graphic surface, not an interactive card; text remains native and scalable. */
export function AttendanceMedallion({ record }: { record: AttendanceRecord }) {
  const { backStyle, middleStyle } = useMedallionMotion();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 24, 410);
  const status = attendanceLabels[attendanceState(record)];
  const indicators = attendanceIndicators(record);
  const tone = tones[status.tone];
  const fontSize = status.title.length > 18 ? (width < 360 ? 28 : 34) : (width < 360 ? 36 : 44);

  return <View style={[styles.medallion, { width: size, minHeight: size * 1.08 }]}>
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <Animated.View testID="attendance-back-layer" style={[StyleSheet.absoluteFill, styles.backLayer, backStyle]}>
        <Image source={shape} contentFit="fill" tintColor={palette.text}
          style={StyleSheet.absoluteFill} accessible={false} />
      </Animated.View>
      <Animated.View testID="attendance-middle-layer" style={[StyleSheet.absoluteFill, styles.middleLayer, middleStyle]}>
        <Image source={shape} contentFit="fill" tintColor={palette.text}
          style={StyleSheet.absoluteFill} accessible={false} />
      </Animated.View>
      <Image testID="attendance-front-layer" source={shape} contentFit="fill" tintColor={tone.surface}
        style={StyleSheet.absoluteFill} accessible={false} />
    </View>
    <View style={styles.content}>
      <Icon name={status.icon} size={46} color={tone.foreground} />
      <Text accessibilityRole="header" accessibilityLiveRegion="polite"
        style={[styles.title, { fontSize, lineHeight: Math.ceil(fontSize * 1.13) }]}>
        {status.title}
      </Text>
      {indicators.primary && <Text style={[styles.event, { color: tone.foreground }]}>
        {indicators.primary}
      </Text>}
      {indicators.pendingExit && <View style={styles.pending}>
        <Icon name="clock" size={15} color={styles.pendingText.color} />
        <Text style={styles.pendingText}>{indicators.pendingExit}</Text>
      </View>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  medallion: { alignSelf: 'center', justifyContent: 'center', alignItems: 'center', paddingVertical: 58 },
  backLayer: { opacity: 0.10 },
  middleLayer: { opacity: 0.17 },
  content: { width: '75%', alignItems: 'center', gap: 18 },
  title: { color: palette.ink, fontWeight: '600', letterSpacing: -0.8, textAlign: 'center' },
  event: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  pending: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, maxWidth: '100%' },
  pendingText: { color: '#6D6079', fontSize: 13, lineHeight: 19, textAlign: 'center', flexShrink: 1 },
});
