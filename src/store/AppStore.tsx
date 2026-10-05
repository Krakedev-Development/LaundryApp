import { AppMockTracking } from "../services/geo/AppMockTracking";
import { migrateAppGeoData } from "../services/geo/AppDemoData";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import NetInfo from "@react-native-community/netinfo";
import { AppData, Session } from "../domain/models";
import { DomainEngine } from "../domain/engine";
import { makeSeed } from "../services/seed";
import { secure, passwordHash } from "../services/secure";
import { businessConfig } from "../config/business";

const STORAGE_KEY = "laundry-mvp-v1";
const SESSION_KEY = "laundry-session";
export class AppStore {
  private listeners = new Set<() => void>();
  private saving = Promise.resolve();
  private demoAccountIds = new Set<string>();
  state: {
    data: AppData;
    session: Session | null;
    ready: boolean;
    online: boolean;
    forcedOffline: boolean;
    storageError: string;
  };
  engine: DomainEngine;
  constructor() {
    const data = makeSeed();
    this.demoAccountIds = new Set(
      [...data.customers, ...data.drivers].map((user) => user.id),
    );
    this.state = {
      data,
      session: null,
      ready: false,
      online: true,
      forcedOffline: false,
      storageError: "",
    };
    this.engine = new DomainEngine(
      data,
      (d) => {
        this.state = { ...this.state, data: d };
        this.emit();
        this.persist(d);
      },
      () =>
        Array.from(Crypto.getRandomBytes(20), (b) =>
          b.toString(16).padStart(2, "0"),
        ).join(""),
    );
  }
  subscribe = (callback: () => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };
  snapshot = () => this.state;
  private emit() {
    this.listeners.forEach((l) => l());
  }
  private persist(d: AppData) {
    const payload = JSON.stringify(d);
    this.saving = this.saving.then(async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, payload);
        if (this.state.storageError) {
          this.state = { ...this.state, storageError: "" };
          this.emit();
        }
      } catch {
        this.state = {
          ...this.state,
          storageError:
            "No pudimos guardar los cambios en este dispositivo. Reintenta antes de cerrar.",
        };
        this.emit();
      }
    });
  }
  async hydrate() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const arrays = [
          "customers",
          "drivers",
          "facilities",
          "catalog",
          "services",
          "promotions",
          "rewards",
          "plans",
          "orders",
          "assignments",
          "wallets",
          "walletTransactions",
          "pointsLedger",
          "redemptions",
          "cards",
          "messages",
          "notifications",
          "pendingOperations",
        ];
        if (
          data.version !== 1 ||
          !arrays.every((key) => Array.isArray(data[key])) ||
          !Array.isArray(data.draft?.items) ||
          !Array.isArray(data.draft?.extraIds) ||
          !Number.isFinite(data.sequence)
        )
          throw new Error("Datos guardados incompatibles.");
        migrateAppGeoData(data);
        this.engine.data = data;
        this.engine.initializeWorkflow();
        this.state = { ...this.state, data };
      }
      const raw = await secure.get(SESSION_KEY);
      const session: Session | null = raw ? JSON.parse(raw) : null;
      if (
        session &&
        ["CLIENTE", "CHOFER"].includes(session.role) &&
        (session.role === "CLIENTE"
          ? this.state.data.customers
          : this.state.data.drivers
        ).some((u) => u.id === session.userId)
      )
        this.state = { ...this.state, session };
    } catch {
      this.state = {
        ...this.state,
        storageError:
          "No pudimos restaurar la demo. Se cargaron los datos iniciales.",
      };
    }
    this.state = { ...this.state, ready: true };
    this.emit();
  }
  setOnline(online: boolean) {
    this.state = { ...this.state, online };
    this.emit();
    if (this.connected) this.engine.sync(true);
  }
  get connected() {
    return this.state.online && !this.state.forcedOffline;
  }
  simulateOffline(value: boolean) {
    this.state = { ...this.state, forcedOffline: value };
    this.emit();
    if (this.connected) this.engine.sync(true);
  }
  retrySave() {
    this.persist(this.state.data);
  }
  async resetDemo() {
    await this.logout();
    this.engine.data = makeSeed();
    this.engine.initializeWorkflow();
    this.state = {
      ...this.state,
      data: this.engine.data,
      forcedOffline: false,
    };
    this.persist(this.engine.data);
    this.emit();
  }
  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const c = this.state.data.customers.find(
      (u) => u.email.toLowerCase() === normalized,
    );
    const d = this.state.data.drivers.find(
      (u) => u.email.toLowerCase() === normalized,
    );
    const user = c ?? d;
    if (!user) throw new Error("Correo o contraseña incorrectos.");
    const saved = await secure.get(`password-${user.id}`);
    const expected =
      saved ??
      (this.demoAccountIds.has(user.id)
        ? await passwordHash(
            user.id,
            d?.mustChangePassword
              ? businessConfig.temporaryPassword
              : businessConfig.demoPassword,
          )
        : "");
    if ((await passwordHash(user.id, password)) !== expected)
      throw new Error("Correo o contraseña incorrectos.");
    const session: Session = {
      userId: user.id,
      role: c ? "CLIENTE" : "CHOFER",
    };
    await secure.set(SESSION_KEY, JSON.stringify(session));
    this.state = { ...this.state, session };
    this.emit();
  }
  async logout() {
    await secure.remove(SESSION_KEY);
    this.engine.update((d) => {
      d.draft = {
        items: [],
        extraIds: [],
        promoCode: "",
        paymentMethod: "WALLET",
      };
    });
    this.state = { ...this.state, session: null };
    this.emit();
  }
  async register(name: string, email: string, phone: string, password: string) {
    email = email.trim().toLowerCase();
    if (
      !name.trim() ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      phone.replace(/\D/g, "").length < 7
    )
      throw new Error("Completa un nombre, correo y teléfono válidos.");
    validatePassword(password);
    if (
      [...this.state.data.customers, ...this.state.data.drivers].some(
        (u) => u.email.toLowerCase() === email,
      )
    )
      throw new Error("Este correo ya está registrado.");
    const id = `CUST-${Date.now()}`;
    await secure.set(`password-${id}`, await passwordHash(id, password));
    this.engine.update((d) => {
      d.customers.push({
        id,
        name: name.trim(),
        email,
        phone,
        kycStatus: "NOT_SUBMITTED",
        addresses: [],
        membershipId: "",
        membershipRenewal: "",
        walletId: `wallet-${id}`,
        rewardAccountId: `points-${id}`,
        billingData: {
          name: name.trim(),
          email,
          phone,
          taxId: "",
          address: "",
        },
        notificationPreferences: true,
        previousPurchases: 0,
        previousSpend: 0,
      });
      d.wallets.push({ id: `wallet-${id}`, customerId: id });
    });
    await this.login(email, password);
  }
  async changePassword(current: string, password: string) {
    const s = this.state.session;
    if (!s) throw new Error("Inicia sesión.");
    validatePassword(password);
    const user =
      s.role === "CHOFER"
        ? this.state.data.drivers.find((d) => d.id === s.userId)!
        : this.state.data.customers.find((c) => c.id === s.userId)!;
    const expected =
      (await secure.get(`password-${s.userId}`)) ??
      (await passwordHash(
        s.userId,
        "mustChangePassword" in user && user.mustChangePassword
          ? businessConfig.temporaryPassword
          : businessConfig.demoPassword,
      ));
    if ((await passwordHash(s.userId, current)) !== expected)
      throw new Error("La contraseña actual no es correcta.");
    if (current === password)
      throw new Error("Elige una contraseña diferente a la actual.");
    await secure.set(
      `password-${s.userId}`,
      await passwordHash(s.userId, password),
    );
    if (s.role === "CHOFER")
      this.engine.update((d) => {
        d.drivers.find((v) => v.id === s.userId)!.mustChangePassword = false;
      });
  }
  async submitKyc(documentUri: string, selfieUri: string, docId: string) {
    const s = this.state.session;
    if (!s) throw new Error("Inicia sesión.");
    const c = this.engine.customer(s);
    if (!documentUri || !selfieUri || docId.trim().length < 5)
      throw new Error(
        "Adjunta tu documento, selfie y número de identificación.",
      );
    // Only local evidence references are held securely. Image bytes never enter app data or Git.
    await secure.set(
      `kyc-${c.id}`,
      JSON.stringify({ documentUri, selfieUri, docId }),
    );
    this.engine.update((d) => {
      const user = d.customers.find((v) => v.id === c.id)!;
      user.kycStatus = "PENDING";
      user.kycRejectionReason = undefined;
    });
  }
  reviewKyc(customerId: string, approved: boolean) {
    this.engine.update((d) => {
      const c = d.customers.find((v) => v.id === customerId);
      if (!c || c.kycStatus !== "PENDING") return;
      c.kycStatus = approved ? "APPROVED" : "REJECTED";
      c.kycRejectionReason = approved
        ? undefined
        : "La imagen del documento no es legible. Envía una foto completa y bien iluminada.";
      this.engine.notify(
        d,
        c.id,
        approved ? "KYC_APPROVED" : "KYC_REJECTED",
        approved
          ? "Tu identidad fue aprobada"
          : "Necesitamos nueva información",
        approved ? "Ya puedes solicitar recogidas." : c.kycRejectionReason!,
      );
    });
  }
}
export function validatePassword(password: string) {
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/\d/.test(password)
  )
    throw new Error("Usa 8 caracteres o más, mayúscula, minúscula y número.");
}
const StoreContext = createContext<AppStore | null>(null);
export function AppProvider({ children }: React.PropsWithChildren) {
  const [store] = useState(() => new AppStore());
  useEffect(() => {
    void store.hydrate();
    const unsubscribe = NetInfo.addEventListener((n) =>
      store.setOnline(
        n.isConnected !== false && n.isInternetReachable !== false,
      ),
    );
    return unsubscribe;
  }, [store]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!store.state.ready || !store.connected) return;
      store.engine.update((data) =>
        data.drivers.forEach((driver) => {
          if (
            driver.locationSimulated &&
            driver.operationalStatus !== "OFFLINE"
          )
            driver.locationUpdatedAt = new Date().toISOString();
        }),
      );
      store.engine.plantTick();
      store.engine.dispatch();
    }, 12000);
    return () => clearInterval(timer);
  }, [store]);
  useEffect(() => {
    const tracking = new AppMockTracking();
    const reconcile = () => {
      if (!store.state.ready) return;
      tracking.reconcile(store.state.data, store.connected, (location) =>
        store.engine.update((data) => {
          const driver = data.drivers.find((d) => d.id === location.driverId);
          if (driver) {
            driver.location = location.coordinates;
            driver.locationUpdatedAt = location.updatedAt;
            driver.trackingEtaSeconds = location.etaSeconds;
          }
        }),
      );
    };
    reconcile();
    const unsubscribe = store.subscribe(reconcile);
    return () => {
      unsubscribe();
      tracking.dispose();
    };
  }, [store]);
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}
export function useApp() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("AppProvider is required.");
  const state = useSyncExternalStore(
    store.subscribe,
    store.snapshot,
    store.snapshot,
  );
  return { ...state, store, engine: store.engine, online: store.connected };
}
