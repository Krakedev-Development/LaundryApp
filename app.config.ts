import { ConfigContext, ExpoConfig } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => {
  const mapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  return {
    ...config,
    name: config.name ?? "Laundry Clean & Fresh",
    slug: config.slug ?? "laundry-clean-fresh",
    extra: { ...config.extra, androidMapsConfigured: !!mapsKey },
    plugins: [
      ...(config.plugins ?? []),
      ...(mapsKey
        ? [
            ["react-native-maps", { androidGoogleMapsApiKey: mapsKey }] as [
              string,
              Record<string, string>,
            ],
          ]
        : []),
    ],
  };
};
