import { useRouter } from "expo-router";
import { Button, EmptyState, Page } from "../components/ui";
export default function NotFound() {
  const router = useRouter();
  return (
    <Page>
      <EmptyState
        title="No encontramos esta página"
        text="Vuelve al inicio para continuar."
        action={
          <Button
            title="Volver al inicio"
            onPress={() => router.replace("/")}
          />
        }
      />
    </Page>
  );
}
