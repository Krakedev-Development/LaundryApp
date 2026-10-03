import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

// Native uses SecureStore. The web demo persists only credential hashes;
// its simulated session and KYC evidence references live for the tab's lifetime.
export const secure = {
  async get(key: string) {
    return Platform.OS === "web"
      ? typeof sessionStorage === "undefined"
        ? null
        : key.startsWith("password-")
          ? localStorage.getItem(key)
          : sessionStorage.getItem(key)
      : SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === "web")
      (key.startsWith("password-") ? localStorage : sessionStorage).setItem(
        key,
        value,
      );
    else await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (Platform.OS === "web")
      (key.startsWith("password-") ? localStorage : sessionStorage).removeItem(
        key,
      );
    else await SecureStore.deleteItemAsync(key);
  },
};
export const passwordHash = (id: string, password: string) =>
  Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `laundry-demo:${id}:${password}`,
  );
