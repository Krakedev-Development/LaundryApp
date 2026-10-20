const { test, expect } = require("@playwright/test");

test("customer detail exposes only customer codes and no plant controls", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole("tab", { name: "Inicio", exact: true })).toBeVisible();
  await page.evaluate(() => {
    const key = "laundry.native-migration.v1";
    const state = JSON.parse(localStorage.getItem(key));
    const order = state.orders.find(order => order.id === "SOL-HS-001");
    order.handoffs.push({
      ...order.handoffs[0],
      id: "internal-transfer",
      type: "DRIVER_TO_FACILITY",
      title: "Transferencia interna de planta",
      status: "ACTIVE",
    });
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await page.getByRole("tab", { name: "Pedidos", exact: true }).click();
  await page.getByRole("button", { name: "Ver detalle de SOL-HS-001", exact: true }).click();
  await expect(page.getByText("Transferencia interna de planta", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Herramientas de planta/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Mostrar código/ })).toHaveCount(1);
});
