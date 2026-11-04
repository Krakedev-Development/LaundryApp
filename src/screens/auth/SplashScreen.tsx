import { Text } from "react-native";
import { Page, Logo } from "../../components/Page";
import { Body, Button, Card, ui } from "../../components/ui";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";

export function SplashScreen() {
  const navigation = useLaundryNavigation();
  return (
    <Page>
      <Card>
        <Logo />
        <Text style={ui.title}>Tu ropa limpia, sin complicaciones.</Text>
        <Body>Lavado, cuidado y entrega con Laundry Clean & Fresh.</Body>
        <Button label="Comenzar" onPress={() => navigation.replace("Login")} />
      </Card>
    </Page>
  );
}
