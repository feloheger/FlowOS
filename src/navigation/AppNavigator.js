import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { loadSubscription } from '../data/storage';
import { hasUsagePermission, hasOverlayPermission, startBlockerService } from '../native/AppBlocker';

import DashboardScreen from '../screens/DashboardScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import HabitsScreen from '../screens/HabitsScreen';
import AppLimitsScreen from '../screens/AppLimitsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import PaywallScreen, { LockedScreen } from '../screens/PaywallScreen';
import PermissionSetupScreen from '../screens/PermissionSetupScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const TABS = [
  { name: 'Dashboard', icon: 'home', label: 'Home', pro: false },
  { name: 'Projects', icon: 'folder', label: 'Projects', pro: true },
  { name: 'Habits', icon: 'flame', label: 'Habits', pro: false },
  { name: 'AppLimits', icon: 'lock-closed', label: 'Limits', pro: false },
  { name: 'Settings', icon: 'settings', label: 'Settings', pro: false },
];

function SwipeWrapper({ children, navigation, currentIndex, hasSubscription }) {
  const translateX = useRef(new Animated.Value(0)).current;

  const swipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onEnd((e) => {
      const THRESHOLD = width * 0.3;
      if (e.translationX < -THRESHOLD && currentIndex < TABS.length - 1) {
        Animated.timing(translateX, { toValue: -60, duration: 150, useNativeDriver: true }).start(() => {
          translateX.setValue(0);
          navigation.navigate(TABS[currentIndex + 1].name);
        });
      } else if (e.translationX > THRESHOLD && currentIndex > 0) {
        Animated.timing(translateX, { toValue: 60, duration: 150, useNativeDriver: true }).start(() => {
          translateX.setValue(0);
          navigation.navigate(TABS[currentIndex - 1].name);
        });
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 30 }).start();
      }
    });

  return (
    <GestureDetector gesture={swipe}>
      <Animated.View style={[{ flex: 1 }, { transform: [{ translateX }] }]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

function ProGatedScreen({ Component, tabName, index, navigation, hasSubscription, onShowPaywall }) {
  if (!hasSubscription) {
    return (
      <SwipeWrapper navigation={navigation} currentIndex={index}>
        <LockedScreen tabName={tabName} onUnlock={onShowPaywall} />
      </SwipeWrapper>
    );
  }
  return (
    <SwipeWrapper navigation={navigation} currentIndex={index}>
      <Component navigation={navigation} />
    </SwipeWrapper>
  );
}

function CustomTabBar({ state, descriptors, navigation, hasSubscription }) {
  return (
    <View style={styles.tabBarWrapper}>
      <BlurView intensity={40} tint="dark" style={styles.tabBar}>
        <View style={styles.tabBarInner}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const tab = TABS.find(t => t.name === route.name);
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => { if (!isFocused) navigation.navigate(route.name); }}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
                  <Ionicons
                    name={isFocused ? tab.icon : `${tab.icon}-outline`}
                    size={22}
                    color={isFocused ? Colors.accent : Colors.textMuted}
                  />
                  {tab.pro && !hasSubscription && (
                    <View style={styles.proBadge}>
                      <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

function withSwipe(Component, index) {
  return function WrappedScreen({ navigation, ...props }) {
    return (
      <SwipeWrapper navigation={navigation} currentIndex={index}>
        <Component navigation={navigation} {...props} />
      </SwipeWrapper>
    );
  };
}

export default function AppNavigator() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  // null = noch nicht gecheckt, false = Permissions fehlen, true = alles OK
  const [permissionsReady, setPermissionsReady] = useState(null);

  useEffect(() => {
    loadSubscription().then(sub => setHasSubscription(sub?.active || false));

    // Permissions checken beim Start
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const [usage, overlay] = await Promise.all([
        hasUsagePermission(),
        hasOverlayPermission(),
      ]);
      if (usage && overlay) {
        // Alles OK — Blocker-Service starten
        await startBlockerService();
        setPermissionsReady(true);
      } else {
        // Permissions fehlen — Setup-Screen anzeigen
        setPermissionsReady(false);
      }
    } catch (e) {
      // Natives Modul nicht verfügbar (z.B. in Expo Go) — einfach weitermachen
      setPermissionsReady(true);
    }
  };

  // Noch am laden
  if (permissionsReady === null) return null;

  // Permissions fehlen → Setup-Screen zeigen
  if (permissionsReady === false) {
    return (
      <PermissionSetupScreen
        onComplete={() => setPermissionsReady(true)}
      />
    );
  }

  const DashboardWrapped = withSwipe(DashboardScreen, 0);
  const HabitsWrapped = withSwipe(HabitsScreen, 2);
  const AppLimitsWrapped = withSwipe(AppLimitsScreen, 3);
  const SettingsWrapped = withSwipe(SettingsScreen, 4);

  const ProjectsWrapped = ({ navigation }) => (
    <ProGatedScreen
      Component={ProjectsScreen}
      tabName="Projects"
      index={1}
      navigation={navigation}
      hasSubscription={hasSubscription}
      onShowPaywall={() => setShowPaywall(true)}
    />
  );

  return (
    <>
      <NavigationContainer>
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} hasSubscription={hasSubscription} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Dashboard" component={DashboardWrapped} />
          <Tab.Screen name="Projects" component={ProjectsWrapped} />
          <Tab.Screen name="Habits" component={HabitsWrapped} />
          <Tab.Screen name="AppLimits" component={AppLimitsWrapped} />
          <Tab.Screen name="Settings" component={SettingsWrapped} />
        </Tab.Navigator>
      </NavigationContainer>

      <PaywallScreen
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onActivate={() => {
          setHasSubscription(true);
          setShowPaywall(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: { position: 'absolute', bottom: 24, left: 16, right: 16 },
  tabBar: { borderRadius: Radius.xxl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  tabBarInner: { flexDirection: 'row', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, backgroundColor: Colors.bgCard + 'CC' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 6, gap: 3 },
  tabIconWrap: { width: 40, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  tabIconWrapActive: { backgroundColor: Colors.accentSoft },
  tabLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: Typography.medium },
  tabLabelActive: { color: Colors.accent, fontWeight: Typography.semibold },
  proBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: Colors.warning, borderRadius: 4, paddingHorizontal: 3, paddingVertical: 1 },
  proBadgeText: { fontSize: 7, fontWeight: Typography.heavy, color: '#000', letterSpacing: 0.3 },
});
