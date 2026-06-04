import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Colors, Typography, Spacing, Radius } from '../theme';

import DashboardScreen from '../screens/DashboardScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import HabitsScreen from '../screens/HabitsScreen';
import AppLimitsScreen from '../screens/AppLimitsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const TABS = [
  { name: 'Dashboard', icon: 'home', label: 'Home' },
  { name: 'Projects', icon: 'folder', label: 'Projects' },
  { name: 'Habits', icon: 'flame', label: 'Habits' },
  { name: 'AppLimits', icon: 'lock-closed', label: 'Limits' },
  { name: 'Settings', icon: 'settings', label: 'Settings' },
];

function CustomTabBar({ state, descriptors, navigation }) {
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

// Swipe wrapper - wraps each screen with swipe gesture
function SwipeWrapper({ children, navigation, currentIndex }) {
  const translateX = useRef(new Animated.Value(0)).current;

  const swipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onEnd((e) => {
      const THRESHOLD = width * 0.3;
      if (e.translationX < -THRESHOLD && currentIndex < TABS.length - 1) {
        // Swipe left → next screen
        Animated.timing(translateX, { toValue: -60, duration: 150, useNativeDriver: true }).start(() => {
          translateX.setValue(0);
          navigation.navigate(TABS[currentIndex + 1].name);
        });
      } else if (e.translationX > THRESHOLD && currentIndex > 0) {
        // Swipe right → previous screen
        Animated.timing(translateX, { toValue: 60, duration: 150, useNativeDriver: true }).start(() => {
          translateX.setValue(0);
          navigation.navigate(TABS[currentIndex - 1].name);
        });
      } else {
        // Snap back
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

// Wrap each screen component with swipe
function withSwipe(Component, index) {
  return function WrappedScreen({ navigation, ...props }) {
    return (
      <SwipeWrapper navigation={navigation} currentIndex={index}>
        <Component navigation={navigation} {...props} />
      </SwipeWrapper>
    );
  };
}

const DashboardWithSwipe = withSwipe(DashboardScreen, 0);
const ProjectsWithSwipe = withSwipe(ProjectsScreen, 1);
const HabitsWithSwipe = withSwipe(HabitsScreen, 2);
const AppLimitsWithSwipe = withSwipe(AppLimitsScreen, 3);
const SettingsWithSwipe = withSwipe(SettingsScreen, 4);

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false, animation: 'shift' }}
      >
        <Tab.Screen name="Dashboard" component={DashboardWithSwipe} />
        <Tab.Screen name="Projects" component={ProjectsWithSwipe} />
        <Tab.Screen name="Habits" component={HabitsWithSwipe} />
        <Tab.Screen name="AppLimits" component={AppLimitsWithSwipe} />
        <Tab.Screen name="Settings" component={SettingsWithSwipe} />
      </Tab.Navigator>
    </NavigationContainer>
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
});
