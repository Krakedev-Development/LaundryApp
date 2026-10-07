import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { MainTabBar } from "../components/NavigationBar";
import { colors } from "../components/ui";
import {
  BenefitsScreen,
  ClientProfileScreen,
  DriverProfileScreen,
} from "../screens/AccountScreens";
import {
  ClientHomeScreen,
  ClientOrdersScreen,
} from "../screens/ClientOrderScreens";
import {
  DriverHistoryScreen,
  DriverRouteScreen,
  DriverServicesScreen,
} from "../screens/DriverScreens";
import type { ClientTabRoutes, DriverTabRoutes } from "./routes";

const ClientTabs = createBottomTabNavigator<ClientTabRoutes>();
const DriverTabs = createBottomTabNavigator<DriverTabRoutes>();
const options = {
  headerShown: false,
  animation: "none" as const,
  sceneStyle: { backgroundColor: colors.background },
};
function ClientBar(props: BottomTabBarProps) {
  return <MainTabBar {...props} role="CLIENT" />;
}
function DriverBar(props: BottomTabBarProps) {
  return <MainTabBar {...props} role="DRIVER" />;
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
export function DriverMainTabs() {
  return (
    <DriverTabs.Navigator
      initialRouteName="DriverRoute"
      backBehavior="firstRoute"
      screenOptions={options}
      tabBar={DriverBar}
    >
      <DriverTabs.Screen name="DriverRoute" component={DriverRouteScreen} />
      <DriverTabs.Screen
        name="DriverServices"
        component={DriverServicesScreen}
      />
      <DriverTabs.Screen name="DriverHistory" component={DriverHistoryScreen} />
      <DriverTabs.Screen name="DriverProfile" component={DriverProfileScreen} />
    </DriverTabs.Navigator>
  );
}
