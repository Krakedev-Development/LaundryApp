import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { User } from "../types";

export function isMobileUser(value: unknown): value is User {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<User>;
  return (
    (user.role === "client" || user.role === "driver") &&
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    ["pending", "approved", "rejected"].includes(user.status ?? "")
  );
}
function mobileSession(value: unknown): {
  user: User | null;
  token: string | null;
} {
  const session = (value ?? {}) as Partial<AuthState>;
  const user = isMobileUser(session.user) ? session.user : null;
  return {
    user,
    token: user && typeof session.token === "string" ? session.token : null,
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      setUser: (user, token) => {
        if (!isMobileUser(user))
          throw Error(
            "Administrador y Supervisor acceden únicamente desde LaundryWeb.",
          );
        set({ user, token });
      },

      logout: () => set({ user: null, token: null }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "laundry_session",
      version: 1,
      migrate: (persisted) => mobileSession(persisted),
      merge: (persisted, current) => ({
        ...current,
        ...mobileSession(persisted),
      }),
      storage: createJSONStorage(() =>
        Platform.OS === "web"
          ? AsyncStorage
          : {
              getItem: SecureStore.getItemAsync,
              setItem: SecureStore.setItemAsync,
              removeItem: SecureStore.deleteItemAsync,
            },
      ),
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
