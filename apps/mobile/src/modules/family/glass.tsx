import { BlurTargetView, BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { attendanceLabels, attendanceState } from './attendance';
import { useFamily } from './session';
import { StatusOrb } from './status-orb';
import { palette } from './theme';

type GlassVariant = 'control' | 'action' | 'navigation';
const treatments = {
  control: { intensity: 22, tint: palette.glass, rim: 'rgba(255,255,255,0.18)', radius: 16 },
  action: { intensity: 52, tint: palette.glassAccent, rim: 'rgba(255,255,255,0.48)', radius: 18 },
  navigation: { intensity: 68, tint: palette.glassNav, rim: 'rgba(255,255,255,0.36)', radius: 24 },
} as const;

type BlurTarget = NonNullable<ComponentProps<typeof BlurView>['blurTarget']>;
const GlassContext = createContext<{ target?: BlurTarget; reduced: boolean }>({ reduced: false });
const transparencyQuery = '(prefers-reduced-transparency: reduce)';
function subscribeTransparency(notify: () => void) {
  if (Platform.OS !== 'web') return () => {};
  const media = window.matchMedia(transparencyQuery);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
}
const webSnapshot = () => Platform.OS === 'web' && window.matchMedia(transparencyQuery).matches;
const serverSnapshot = () => false;

/** Opaque scene paint prevents retained navigator screens showing through one another. */
export function FamilyAtmosphere() {
  const { child } = useFamily();
  const accent = child ? palette[attendanceLabels[attendanceState(child.today)].tone] : palette.muted;
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, styles.root]}>
    <StatusOrb color={accent} />
  </View>;
}

/** One background-only target: native blur never samples its own controls or text. */
export function GlassProvider({ children }: { children: ReactNode }) {
  const target = useRef<BlurTarget['current']>(null);
  const [nativeReduced, setNativeReduced] = useState(Platform.OS === 'ios');
  const webReduced = useSyncExternalStore(subscribeTransparency, webSnapshot, serverSnapshot);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled()
      .then(value => { if (active) setNativeReduced(value); })
      .catch(() => { /* Keep the accessible opaque fallback on unavailable APIs. */ });
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setNativeReduced);
    return () => { active = false; subscription.remove(); };
  }, []);

  const reduced = nativeReduced || webReduced;
  return <GlassContext.Provider value={{ target, reduced }}>
    <View style={styles.root}>
      <BlurTargetView ref={target} pointerEvents="none" accessible={false}
        accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}>
        <FamilyAtmosphere />
      </BlurTargetView>
      {children}
    </View>
  </GlassContext.Provider>;
}

/** Optical material only; real controls retain their touch and accessibility semantics. */
export function GlassBackdrop({ variant = 'control' }: { variant?: GlassVariant }) {
  const { target, reduced } = useContext(GlassContext);
  const treatment = treatments[variant];
  const nativeGlass = Platform.OS === 'ios' && !reduced
    && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  const webFrost = { backdropFilter: `blur(${treatment.intensity / 2}px) saturate(125%)` } as ViewStyle;

  return <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
    {reduced ? <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.surface }]} />
      : nativeGlass ? <GlassView style={StyleSheet.absoluteFill}
        glassEffectStyle={variant === 'navigation' ? 'regular' : 'clear'}
        tintColor={treatment.tint} colorScheme="dark" />
      : Platform.OS === 'web' ? <View style={[StyleSheet.absoluteFill, webFrost, { backgroundColor: treatment.tint }]} />
      : <><BlurView style={StyleSheet.absoluteFill} intensity={treatment.intensity} tint="dark"
          blurTarget={target} blurMethod="dimezisBlurViewSdk31Plus" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: treatment.tint }]} /></>}
    <View style={[StyleSheet.absoluteFill, {
      borderRadius: treatment.radius,
      borderWidth: 1,
      borderColor: palette.glassStroke,
      borderTopColor: reduced ? palette.glassStroke : treatment.rim,
      borderBottomColor: 'rgba(255,255,255,0.04)',
    }]} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
});
