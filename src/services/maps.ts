import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
export const nativeMapsEnabled = () =>
  Platform.OS === "ios" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.expoConfig?.extra?.androidMapsConfigured === true;
