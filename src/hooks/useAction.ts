import { useRef, useState } from "react";
import { useToast } from "../components/ui";
export function useAction() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const toast = useToast();
  async function run(action: () => void | Promise<void>, success?: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
      if (success) toast(success);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No pudimos completar esta acción. Reintenta.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { error, busy, run, setError };
}
