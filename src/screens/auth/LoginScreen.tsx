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
      onLogin={async (email, hash, password) => {
        const response = await authService.login({ email, password });
        await syncFullCatalog(response.tokens.accessToken);
        // El estado de verificación lo informa el servidor.
        execute((repo) => repo.authenticateFromApi(response.user, hash));
      }}
      onRegister={() => navigation.navigate("RegisterStep1")}
      onForgotPassword={() => navigation.navigate("ForgotPassword")}
    />
  );
}
