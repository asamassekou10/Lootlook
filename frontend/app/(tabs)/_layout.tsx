/**
 * Tab Layout - Minimal bottom navigation with Lucide icons
 */

import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Scan, Package, User } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { colors, spacing, iconSize } from "../../src/theme";

interface TabIconProps {
  focused: boolean;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
}

function TabIcon({ focused, Icon }: TabIconProps) {
  return (
    <View style={styles.iconContainer}>
      <Icon
        size={iconSize.md}
        color={focused ? colors.accent.primary : colors.text.tertiary}
        strokeWidth={1.5}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Scan} />,
        }}
      />
      <Tabs.Screen
        name="stash"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Package} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={User} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    backgroundColor: "transparent",
    borderTopWidth: 0.5,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.sm,
    elevation: 0,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
  },
});
