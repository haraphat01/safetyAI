import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import AuthGuard from '@/components/AuthGuard';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="safety-tips"
          options={{
            title: 'Safety Tips',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="shield.lefthalf.filled" color={color} />,
            href: null,
          }}
        />
        <Tabs.Screen
          name="ai-assistant"
          options={{
            title: 'AI Assistant',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="sparkles" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.circle.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="safety-zones"
          options={{
            title: 'Safety Zones',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="location.fill" color={color} />,
            href: null,
          }}
        />
        <Tabs.Screen
          name="follow-me"
          options={{
            title: 'Follow Me',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="location.circle.fill" color={color} />,
            href: null,
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
