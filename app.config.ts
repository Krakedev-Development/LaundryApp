import { ConfigContext, ExpoConfig } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "Laundry Clean & Fresh",
  slug: config.slug ?? "laundry-clean-fresh",
  ios: { ...config.ios, bundleIdentifier: "com.laundryfresh.app" },
  plugins: [...(config.plugins ?? []), "@rnmapbox/maps"],
});
