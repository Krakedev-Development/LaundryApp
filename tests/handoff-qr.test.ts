import { strict as assert } from "node:assert";
import { test } from "node:test";
import { handoffQrValue } from "../src/services/orders/handoffQr";

// La app del chofer lee el QR con el formato LDH1:<solicitud>:<tipo>:<token>
// (LaundryDriver/src/features/driver/model/custody.ts). Si cambia aquí, debe cambiar allá.
test("el QR de custodia lleva la solicitud, la etapa y el token en el formato que lee el chofer", () => {
  const value = handoffQrValue("9d0a8700-d1c1-4f74-b2ef-73db0e9fd844", "CUSTOMER_TO_DRIVER", "AbCdEfGhIjKlMnOpQrStUvWxYz012345");
  assert.equal(value, "LDH1:9d0a8700-d1c1-4f74-b2ef-73db0e9fd844:CUSTOMER_TO_DRIVER:AbCdEfGhIjKlMnOpQrStUvWxYz012345");
  assert.match(value, /^LDH1:([^:]+):([A-Z_]+):(.{16,128})$/);
});
