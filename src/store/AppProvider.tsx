import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState as Lifecycle } from "react-native";
import { resetCatalogToFallback } from "../domain/catalog";
import type { AppState } from "../domain/models";
import {
  clone,
  initializeState,
  LaundryRepository,
  refreshSchedule,
  transact,
} from "../domain/repository";
import {
  authService,
  clearAuthSession,
  getStoredAuthSession,
} from "../services/auth/authService";
import { syncFullCatalog } from "../services/catalog/catalogService";
import { PersistenceQueue } from "./persistence";

interface Context {
  state: AppState;
  ready: boolean;
  error: string | null;
  execute<T>(action: (repo: LaundryRepository) => T): T;
  reset(): void;
  retry(): void;
}
const AppContext = createContext<Context | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initializeState);
  const latest = useRef(state);
  const [ready, setReady] = useState(false),
    [error, setError] = useState<string | null>(null);
  const queue = useRef(new PersistenceQueue(AsyncStorage)).current;
  const mounted = useRef(true);
  const save = (next: AppState) => {
    latest.current = next;
    setState(next);
    void queue
      .save(next)
      .then(() => {
        if (mounted.current) setError(null);
      })
      .catch(() => {
        if (mounted.current)
          setError(
            "No se pudieron guardar los cambios. Reintenta antes de cerrar la app.",
          );
      });
  };
  const load = () => {
    setReady(false);
    setError(null);
    void Promise.all([queue.load(), getStoredAuthSession()])
      .then(async ([saved, authSession]) => {
        if (!mounted.current) return;
        let loaded = saved ?? latest.current;
        if (authSession.user && authSession.accessToken) {
          if (authSession.user.role === "CLIENT") {
            // El estado de verificación puede haber cambiado desde la última sesión.
            const user =
              (await authService.syncProfile()) ?? authSession.user;
            loaded = transact(loaded, (repo) =>
              repo.authenticateFromApi(user),
            ).state;
            await syncFullCatalog(authSession.accessToken);
          } else {
            void clearAuthSession();
          }
        } else {
          void syncFullCatalog(null);
        }
        refreshSchedule(loaded);
        save(loaded);
        setReady(true);
      })
      .catch(() => {
        if (mounted.current)
          setError(
            "No se pudieron cargar los datos locales. Puedes reintentar o restablecerlos.",
          );
      });
  };
  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const listener = Lifecycle.addEventListener("change", (status) => {
      if (status === "active" && ready) {
        const next = clone(latest.current);
        refreshSchedule(next);
        save(next);
      }
    });
    return () => listener.remove();
  }, [ready]);
  const execute = <T,>(action: (repo: LaundryRepository) => T): T => {
    const next = transact(latest.current, action);
    save(next.state);
    return next.result;
  };
  return (
    <AppContext.Provider
      value={{
        state,
        ready,
        error,
        execute,
        reset: () => {
          void clearAuthSession();
          resetCatalogToFallback();
          save(initializeState());
          setReady(true);
        },
        retry: () => {
          if (!ready) load();
          else save(latest.current);
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw Error("AppProvider no está disponible.");
  return context;
}
