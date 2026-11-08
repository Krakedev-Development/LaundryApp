import { LoginForm } from "../../features/auth/ui/LoginForm";
import { useApp } from "../../store/AppProvider";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
import { authService } from "../../services/auth/authService";
import { syncFullCatalog } from "../../services/catalog/catalogService";

export function LoginScreen() {
  const { execute } = useApp();
  const navigation = useLaundryNavigation();
  return (
    <LoginForm
      initialEmail="cliente@laundry.com"
      demoLabel="Cliente demo"
      onLogin={async (email, hash, password) => {
        const response = await authService.login({ email, password });
        await syncFullCatalog(response.tokens.accessToken);
        execute((repo) =>
          repo.authenticateFromApi(response.user, hash, "APPROVED"),
        );
      }}
      onDemo={() => {
        execute((repo) => repo.demoLogin());
        void syncFullCatalog(null);
      }}
      onRegister={() => navigation.navigate("RegisterStep1")}
    />
  );
}
