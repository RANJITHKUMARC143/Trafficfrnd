import { Stack } from 'expo-router';

export default function EarningsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="history" />
    </Stack>
  );
}