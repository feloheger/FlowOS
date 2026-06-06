import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider, useAppContext } from './src/AppContext';

function AppInner() {
  const { colors, themeId } = useAppContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();
  }, []);

  // Re-animate when theme changes
  useEffect(() => {
    fadeAnim.setValue(0.7);
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
  }, [themeId]);

  return (
    <>
      <StatusBar style={themeId === 'light' ? 'dark' : 'light'} />
      <Animated.View style={[styles.root, { opacity: fadeAnim, backgroundColor: colors.bg }]}>
        <AppNavigator />
      </Animated.View>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProvider>
          <AppInner />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
