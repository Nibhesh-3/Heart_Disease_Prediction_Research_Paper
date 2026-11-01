import { Redirect } from "expo-router";

export default function Index() {
  // After auth, go to the tabs group home
  return <Redirect href="/(tabs)/home" />;
}

