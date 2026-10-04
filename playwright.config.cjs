const { defineConfig } = require("@playwright/test");
const staticUi = process.env.EXPO_UI_STATIC === "true";
const baseURL = staticUi ? "http://localhost:8084" : "http://localhost:8083";
module.exports = defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.cjs",
  timeout: 360000,
  workers: 1,
  reporter: "list",
  expect: { timeout: 30000 },
  outputDir: "./test-results",
  use: {
    baseURL,
    viewport: { width: 390, height: 844 },
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    permissions: ["geolocation"],
    geolocation: { latitude: -2.124, longitude: -79.867 },
    screenshot: "only-on-failure",
    headless: true,
    actionTimeout: 20000,
    trace: "retain-on-failure",
  },
  webServer: {
    command: staticUi
      ? "node scripts/serve-ui.cjs dist-geo 8084"
      : "npm run web -- --port 8083",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
