import { useIsFocused } from 'expo-router';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';
import {
  cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useReducedMotion,
  useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';

const motionQuery = '(prefers-reduced-motion: reduce)';
function subscribeMotion(notify: () => void) {
  if (Platform.OS !== 'web') return () => {};
  const media = window.matchMedia(motionQuery);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
}
const webSnapshot = () => Platform.OS === 'web' && window.matchMedia(motionQuery).matches;
const serverSnapshot = () => false;

export function useMedallionMotion() {
  const focused = useIsFocused();
  const initialReduced = useReducedMotion();
  const [nativeReduced, setNativeReduced] = useState(initialReduced);
  const [appState, setAppState] = useState(AppState.currentState);
  const webReduced = useSyncExternalStore(subscribeMotion, webSnapshot, serverSnapshot);
  const reduced = Platform.OS === 'web' ? webReduced : nativeReduced;
  const back = useSharedValue(10);
  const middle = useSharedValue(-8);

  useEffect(() => {
    const stateSubscription = AppState.addEventListener('change', setAppState);
    if (Platform.OS === 'web') return () => stateSubscription.remove();
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active) setNativeReduced(value);
    }).catch(() => {});
    const motionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setNativeReduced);
    return () => {
      active = false;
      stateSubscription.remove();
      motionSubscription.remove();
    };
  }, []);

  useEffect(() => {
    cancelAnimation(back);
    cancelAnimation(middle);
    back.set(10);
    middle.set(-8);
    if (focused && appState === 'active' && !reduced) {
      back.set(withRepeat(withTiming(370, { duration: 28000, easing: Easing.linear, reduceMotion: ReduceMotion.System }), -1, false));
      middle.set(withRepeat(withTiming(-368, { duration: 36000, easing: Easing.linear, reduceMotion: ReduceMotion.System }), -1, false));
    }
    return () => { cancelAnimation(back); cancelAnimation(middle); };
  }, [appState, back, focused, middle, reduced]);

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${back.get()}deg` }, { scale: 1.025 }],
  }));
  const middleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${middle.get()}deg` }, { scale: 1.025 }],
  }));
  return { backStyle, middleStyle };
}
