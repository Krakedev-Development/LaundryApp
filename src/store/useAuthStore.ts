import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User } from '../types';

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

      setUser: (user, token) => set({ user, token }),

      logout: () => set({ user: null, token: null }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'laundry_session',
      storage: createJSONStorage(() =>
        Platform.OS === 'web'
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
