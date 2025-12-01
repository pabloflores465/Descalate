import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="auth"
        options={{
          title: 'Auth',
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Register',
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          title: 'Onboarding',
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="complete-profile"
        options={{
          title: 'Complete Profile',
        }}
      />
      <Stack.Screen
        name="tutorial"
        options={{
          title: 'Tutorial',
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
