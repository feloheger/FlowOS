import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, Radius } from '../theme';

import DashboardScreen from '../screens/DashboardScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import HabitsScreen from '../screens/HabitsScreen';
import AppLimitsScreen from '../screens/AppLimitsScreen';
import GoalsScreen from '../screens/GoalsScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Dashboard', icon: 'home', label: 'Home' },
  { name: 'Projects', icon: 'folder', label: 'Projects' },
  { name: 'Habits', icon: 'flame', label: 'Habits' },
  { name: 'AppLimits', icon: 'lock-closed', label: 'Limits' },
  { name: 'Goals', icon: 'trophy', label: 'Vision' },
];

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBarWrapper}>
      <BlurView intensity={40} tint="dark" style={styles.tabBar}>
        <View style={styles.tabBarInner}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const tab = TABS.find(t => t.name === route.name);

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => {
                  if (!isFocused) navigation.navigate(route.name);
                }}
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

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Projects" component={ProjectsScreen} />
        <Tab.Screen name="Habits" component={HabitsScreen} />
        <Tab.Screen name="AppLimits" component={AppLimitsScreen} />
        <Tab.Screen name="Goals" component={GoalsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  tabBar: {
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.bgCard + 'CC',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    gap: 3,
  },
  tabIconWrap: {
    width: 40,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: Colors.accentSoft,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  tabLabelActive: {
    color: Colors.accent,
    fontWeight: Typography.semibold,
  },
});
