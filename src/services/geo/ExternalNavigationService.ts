import { Linking } from "react-native";
import type { Coordinates } from "./geo.types";
export const navigationOptions = (target: Coordinates) => [
  {
    name: "Google Maps",
    url: `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&travelmode=driving`,
  },
  {
    name: "Apple Maps",
    url: `https://maps.apple.com/?daddr=${target.lat},${target.lng}&dirflg=d`,
  },
  {
    name: "Waze",
    url: `https://waze.com/ul?ll=${target.lat},${target.lng}&navigate=yes`,
  },
];
export const openExternalNavigation = (url: string) => Linking.openURL(url);
