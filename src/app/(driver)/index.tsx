import { Redirect } from 'expo-router';

export default function DriverIndexRedirect() {
  return <Redirect href="/(driver)/(tabs)" />;
}
