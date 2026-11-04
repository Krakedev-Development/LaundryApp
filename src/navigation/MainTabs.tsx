import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { MainTabBar } from "../components/NavigationBar";
import { colors } from "../components/ui";
import { BenefitsScreen, ClientProfileScreen } from "../screens/AccountScreens";
import {
  ClientHomeScreen,
  ClientOrdersScreen,
} from "../screens/ClientOrderScreens";
import type { ClientTabRoutes } from "./routes";
const ClientTabs = createBottomTabNavigator<ClientTabRoutes>();
const options = {
  headerShown: false,
  animation: "none" as const,
  sceneStyle: { backgroundColor: colors.background },
};
function ClientBar(props: BottomTabBarProps) {
  return <MainTabBar {...props} />;
}
export function ClientMainTabs() {
  return (
    <ClientTabs.Navigator
      initialRouteName="ClientHome"
      backBehavior="firstRoute"
      screenOptions={options}
      tabBar={ClientBar}
    >
      <ClientTabs.Screen name="ClientHome" component={ClientHomeScreen} />
      <ClientTabs.Screen name="ClientOrders" component={ClientOrdersScreen} />
      <ClientTabs.Screen name="ClientBenefits" component={BenefitsScreen} />
      <ClientTabs.Screen name="ClientProfile" component={ClientProfileScreen} />
    </ClientTabs.Navigator>
  );
}
