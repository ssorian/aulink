import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useHydrated } from '@/hooks/use-hydrated';

/** A single soft sphere shared behind the page and its translucent controls. */
export function StatusOrb({ color }: { color: string }) {
  const dimensions = useWindowDimensions();
  const ready = useHydrated();
  const width = ready ? dimensions.width : 0;
  const height = ready ? dimensions.height : 0;
  const size = Math.min(width * 1.85, 920);
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants" style={styles.field}>
    <Image source={require('@/assets/images/status-orb.png')} resizeMode="contain" accessible={false}
      style={[styles.orb, { tintColor: color, width: size, height: size, left: (width - size) / 2, top: height * 0.43 - size / 2 }]} />
  </View>;
}

const styles = StyleSheet.create({
  field: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  orb: { position: 'absolute', opacity: 0.34 },
});
