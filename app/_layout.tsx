import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'none',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          statusBarTranslucent: true,
          statusBarStyle: 'dark',
        }}
      />
    </Stack>
  );
}
