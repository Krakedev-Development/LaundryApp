import { LoginForm } from "../../features/auth/ui/LoginForm";
import { useApp } from "../../store/AppProvider";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
import { authService } from "../../services/auth/authService";

export function LoginScreen() {
  const { execute } = useApp();
  const navigation = useLaundryNavigation();
  return (
    <LoginForm
      initialEmail="maria.torres@gmail.com"
      demoLabel="Cliente demo"
      onLogin={async (email, hash, password) => {
        const response = await authService.login({ email, password });
        execute((repo) =>
          repo.authenticateFromApi(response.user, hash, "APPROVED"),
        );
      }}
      onDemo={() => execute((repo) => repo.demoLogin())}
      onRegister={() => navigation.navigate("RegisterStep1")}
    />
  );
}
