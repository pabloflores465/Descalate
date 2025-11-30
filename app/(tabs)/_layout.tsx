import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect, useState } from 'react';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  nameOutline: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
};

function AnimatedTabIcon({ name, nameOutline, color, size, focused }: TabIconProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 5,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: -4,
          friction: 5,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 5,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused]);

  return (
    <View style={styles.iconContainer}>
      <Animated.View
        style={[
          styles.iconBackground,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        }}
      >
        <Ionicons name={focused ? name : nameOutline} size={size} color={color} />
      </Animated.View>
    </View>
  );
}

type TabButtonProps = {
  children: React.ReactNode;
  onPress: () => void;
  onLongPress: () => void;
};

function AnimatedTabButton({ children, onPress, onLongPress }: TabButtonProps) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.85,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
    >
      <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5a8c6a',
        tabBarInactiveTintColor: '#95A5A6',
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarButton: (props) => (
          <AnimatedTabButton
            onPress={props.onPress ?? (() => {})}
            onLongPress={props.onLongPress ?? (() => {})}
          >
            {props.children}
          </AnimatedTabButton>
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="home"
              nameOutline="home-outline"
              color={color}
              size={26}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="stats-chart"
              nameOutline="stats-chart-outline"
              color={color}
              size={26}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="person"
              nameOutline="person-outline"
              color={color}
              size={26}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#f1f8f3',
    borderTopWidth: 0,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    position: 'absolute',
    width: 48,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(90, 140, 106, 0.15)',
  },
});
