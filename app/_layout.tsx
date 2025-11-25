import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'none',
        }}
      >
        <Stack.Screen name="(session)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="exercises"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="tips"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
