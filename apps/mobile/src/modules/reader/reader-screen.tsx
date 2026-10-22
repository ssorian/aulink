import { useEffect, useReducer, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useIsFocused } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { demoScanResult, readerReducer, revealDiameter } from './state';
import { useHydrated } from '@/hooks/use-hydrated';

const purple = '#4C2D73';
const green = '#C8EF9A';
const red = '#B42339';
const ink = '#263D16';
const symbols = {
  scanner: { ios: 'qrcode.viewfinder', android: 'qr_code_scanner', web: 'qr_code_scanner' },
  success: { ios: 'checkmark', android: 'check', web: 'check' },
  error: { ios: 'xmark', android: 'close', web: 'close' },
} as const;

function Action({ label, onPress, color = '#FFFFFF', outlined = false, disabled = false }: {
  label: string; onPress: () => void; color?: string; outlined?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, outlined && { borderWidth: 1, borderColor: color }, pressed && styles.pressed, disabled && { opacity: 0.5 }]}>
    <Text style={[styles.buttonText, { color }]}>{label}</Text>
  </Pressable>;
}

export function ReaderScreen() {
  const ready = useHydrated();
  const [state, dispatch] = useReducer(readerReducer, 'idle');
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [cameraError, setCameraError] = useState<string>();
  const [requesting, setRequesting] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const focused = useIsFocused();
  const alive = useRef(true);
  const consumed = useRef(false);
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const content = useSharedValue(0);
  const result = state === 'success' || state === 'error';
  const success = state === 'success';
  const diameter = revealDiameter(width, height);
  const foreground = success ? ink : '#FFFFFF';

  useEffect(() => {
    alive.current = true;
    const subscription = AppState.addEventListener('change', next => {
      setActive(next === 'active');
      if (next === 'active') {
        // Refresh grants changed in Settings; never request access automatically.
        void getPermission().catch(() => {
          if (alive.current) setCameraError('No se pudo comprobar el permiso de cámara. Reintenta.');
        });
      }
    });
    return () => { alive.current = false; subscription.remove(); };
  }, [getPermission]);

  useEffect(() => {
    if (!focused) {
      consumed.current = true;
      dispatch({ type: 'reset' });
    }
  }, [focused]);

  useEffect(() => {
    progress.value = 0;
    content.value = 0;
    if (!result) return;
    progress.value = withTiming(1, { duration: reducedMotion ? 0 : 650, easing: Easing.out(Easing.cubic) });
    content.value = withDelay(reducedMotion ? 0 : 350, withTiming(1, { duration: reducedMotion ? 0 : 220 }));
    AccessibilityInfo.announceForAccessibility(success ? 'Asistencia registrada. Demostración.' : 'Reintenta de nuevo.');
  }, [state, result, success, reducedMotion, progress, content]);

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: progress.value }] }));
  const resultStyle = useAnimatedStyle(() => ({ opacity: content.value }));

  function finish(ok: boolean) {
    if (consumed.current || !focused || !active) return;
    consumed.current = true;
    dispatch({ type: 'result', success: ok });
  }

  function scan() {
    consumed.current = false;
    setCameraError(undefined);
    dispatch({ type: 'scan' });
  }

  async function allowCamera() {
    setRequesting(true);
    try { await requestPermission(); }
    catch { if (alive.current) setCameraError('No se pudo acceder a la cámara. Inténtalo de nuevo.'); }
    finally { if (alive.current) setRequesting(false); }
  }

  function reset() {
    consumed.current = true;
    dispatch({ type: 'reset' });
  }

  return <View style={styles.screen}>
    <StatusBar style={success ? 'dark' : 'light'} />
    <SafeAreaView style={styles.safe} pointerEvents={result ? 'none' : 'auto'}
      accessibilityElementsHidden={result} importantForAccessibility={result ? 'no-hide-descendants' : 'auto'}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.center}>
          <Text accessibilityRole="header" style={styles.prompt}>Por favor escanea tu credencial</Text>
          <SymbolView name={symbols.scanner} size={100} tintColor="#FFFFFF" />
        </View>
        <View style={styles.footer}>
          <Action label="Escanear QR con cámara" onPress={scan} outlined disabled={!ready} />
          <Action label="Salir del lector" disabled={!ready} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
        </View>
      </ScrollView>
    </SafeAreaView>

    {result && <View style={StyleSheet.absoluteFill}>
      <Animated.View pointerEvents="none" style={[styles.circle, {
        width: diameter, height: diameter, borderRadius: diameter / 2,
        left: (width - diameter) / 2, top: (height - diameter) / 2,
        backgroundColor: success ? green : red,
      }, circleStyle]} />
      <Animated.View style={[styles.safe, resultStyle]}>
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.center}>
              <SymbolView name={symbols[success ? 'success' : 'error']} size={148} tintColor={foreground} />
              <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[styles.resultTitle, { color: foreground }]}>
                {success ? 'Asistencia registrada' : 'Reintenta de nuevo'}
              </Text>
            </View>
            <View style={styles.footer}>
              <Action label={success ? 'Siguiente' : 'Reintentar'} color={foreground} outlined onPress={success ? reset : scan} />
              {!success && <Action label="Omitir" onPress={reset} />}
              <Text style={[styles.note, { color: foreground }]}>Demostración · No se guardan asistencias</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>}

    <Modal visible={state === 'scanning' && focused} animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={reset}>
      <View style={styles.cameraScreen}>
        {active && permission?.granted && !cameraError && <CameraView style={StyleSheet.absoluteFill} facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => finish(demoScanResult(data))}
          onMountError={() => setCameraError('No se pudo iniciar la cámara. Reintenta o cancela.')} />}
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.cameraHeader}><Text style={styles.cameraTitle}>Escanea un QR</Text><Action label="Cancelar" onPress={reset} /></View>
            <View style={styles.center}>
              {permission?.granted && !cameraError ? <View pointerEvents="none" style={styles.viewfinder}><SymbolView name={symbols.scanner} size={120} tintColor="#FFFFFF" /></View>
                : <View style={styles.permission}>
                  <Text style={styles.permissionText}>{cameraError ?? 'Permite el acceso a la cámara para escanear tu credencial.'}</Text>
                  {!permission?.granted && <Action label={permission?.canAskAgain === false ? 'Abrir ajustes' : 'Permitir cámara'} outlined disabled={requesting || !permission}
                    onPress={() => {
                      if (permission?.canAskAgain !== false) void allowCamera();
                      else if (Platform.OS === 'web') setCameraError('Activa el permiso de cámara en los ajustes de este navegador.');
                      else void Linking.openSettings().catch(() => setCameraError('Abre Ajustes y permite la cámara para Aulink.'));
                    }} />}
                  {cameraError && permission?.granted && <Action label="Reintentar cámara" onPress={() => setCameraError(undefined)} outlined />}
                </View>}
            </View>
            <View style={styles.cameraFooter}>
              <Text style={styles.note}>Desarrollo · Sin registro real{ '\n' }QR de éxito: aulink:asistencia:demo{ '\n' }Cualquier otro QR muestra error.</Text>
              <View style={styles.demoActions}><Action label="Probar éxito" onPress={() => finish(true)} /><Action label="Probar error" onPress={() => finish(false)} /></View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: purple, overflow: 'hidden' },
  safe: { flex: 1 },
  page: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 16, width: '100%', maxWidth: 640, alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 36, paddingVertical: 48 },
  prompt: { color: '#FFFFFF', fontSize: 32, lineHeight: 40, fontWeight: '600', letterSpacing: -0.6, textAlign: 'center', maxWidth: 360 },
  footer: { gap: 8, paddingBottom: 8 },
  button: { minHeight: 48, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, lineHeight: 23, fontWeight: '600', textAlign: 'center' },
  pressed: { backgroundColor: 'rgba(255,255,255,0.12)' },
  circle: { position: 'absolute' },
  resultTitle: { fontSize: 34, lineHeight: 42, fontWeight: '600', letterSpacing: -0.6, textAlign: 'center' },
  note: { color: '#FFFFFF', fontSize: 12, lineHeight: 19, textAlign: 'center', paddingTop: 12 },
  cameraScreen: { flex: 1, backgroundColor: '#18121F' },
  cameraHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', backgroundColor: '#18121F', borderRadius: 16, paddingLeft: 16 },
  cameraTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  cameraFooter: { backgroundColor: '#18121F', padding: 12, borderRadius: 16, gap: 8 },
  demoActions: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  viewfinder: { borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 16, padding: 40 },
  permission: { gap: 24, alignItems: 'center' },
  permissionText: { color: '#FFFFFF', fontSize: 18, lineHeight: 27, textAlign: 'center' },
});
