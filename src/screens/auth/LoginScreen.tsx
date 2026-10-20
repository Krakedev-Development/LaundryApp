import { LoginForm } from "../../features/auth/ui/LoginForm";
import { useApp } from "../../store/AppProvider";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
export function LoginScreen() {
  const { execute } = useApp();
  const navigation = useLaundryNavigation();
  return (
    <LoginForm
      initialEmail="maria.torres@gmail.com"
      demoLabel="Cliente demo"
      onLogin={(email, hash) => execute((repo) => repo.login(email, hash))}
      onDemo={() => execute((repo) => repo.demoLogin())}
      onRegister={() => navigation.navigate("RegisterStep1")}
    />
  );
}
