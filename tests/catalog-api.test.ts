import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  extras,
  facilities,
  fallbackFacilities,
  garments,
  plans,
  promos,
  resetCatalogToFallback,
  rewards,
  services,
} from "../src/domain/catalog";
import {
  calculatePricing,
  LaundryRepository,
  slotRange} from "../src/domain/repository";
import { initializeSeededState as initializeState } from "./fixtures/seedState";
import {
  ADMIN_REQUIRED,
  adminConfigured,
  approveClientKyc,
} from "./support/backendKyc";
import { authService, clearAuthSession } from "../src/services/auth/authService";
import {
  fetchExtras,
  fetchFacilities,
  fetchGarments,
  fetchMemberships,
  fetchPromotions,
  fetchRewards,
  fetchServices,
  syncFullCatalog,
} from "../src/services/catalog/catalogService";

test("catalogService fetches public catalog and Guayaquil facilities without requiring an active JWT session", async () => {
  await clearAuthSession();
  assert.equal(fallbackFacilities.length, 0, "El producto no trae sedes de ejemplo");

  try {
    const synced = await syncFullCatalog(null);

    assert.ok(
      synced.garments.some((g) => /Chaqueta de Cuero/i.test(g.name)),
      "Public garments should include Chaqueta de Cuero from backend",
    );
    assert.ok(synced.services.length >= 3);
    assert.ok(synced.extras.length >= 4);
    assert.ok(synced.memberships.length >= 3);
    assert.ok(
      synced.facilities.some((f) => /Guayaquil/i.test(f.name) || /Guayaquil/i.test(f.address)),
      "Public facilities should include Guayaquil branches from backend",
    );
    assert.ok(
      synced.promos.some((p) => p.code === "BIENVENIDO"),
      "Public promotions should include BIENVENIDO from backend",
    );
    assert.ok(
      synced.rewards.some((r) => /Bolsa Ecológica/i.test(r.title)),
      "Public rewards should include official rewards from backend",
    );

    assert.equal(garments[0].id, synced.garments[0].id);
    assert.equal(facilities[0].id, synced.facilities[0].id);
    assert.equal(promos[0].code, synced.promos[0].code);
    assert.equal(rewards[0].id, synced.rewards[0].id);
  } finally {
    resetCatalogToFallback();
  }
});

test("catalogService fetches real garments, services, extras, memberships and Guayaquil facilities with authenticated session and creates order", { skip: !adminConfigured && ADMIN_REQUIRED }, async () => {
  const now = new Date("2026-10-07T12:00:00Z");
  const uniqueEmail = `catalogo.api.${Date.now()}@laundryfresh.com`;
  const repo = new LaundryRepository(initializeState(now), now);

  try {
    await repo.registerWithApi(
      "Camila",
      "Catálogo",
      uniqueEmail,
      "0991122334",
      "ClaveSegura123",
      "hash-cat-1",
    );
    await approveClientKyc(uniqueEmail);
    repo.setKycStatus("APPROVED");

    const [
      loadedGarments,
      loadedServices,
      loadedExtras,
      loadedPlans,
      loadedFacilities,
      loadedPromos,
      loadedRewards,
    ] = await Promise.all([
      fetchGarments(),
      fetchServices(),
      fetchExtras(),
      fetchMemberships(),
      fetchFacilities(),
      fetchPromotions(),
      fetchRewards(),
    ]);

    assert.ok(loadedGarments.length > 0, "Should return backend garments");
    assert.ok(
      loadedGarments.some((g) => /Camisa/i.test(g.name) && g.basePrice === 2.5),
    );
    assert.equal(garments[0].id, loadedGarments[0].id);

    assert.ok(loadedServices.length > 0, "Should return backend services");
    assert.ok(loadedServices.some((s) => s.extraPrice > 0));
    assert.equal(services[0].id, loadedServices[0].id);

    assert.ok(loadedExtras.length > 0, "Should return backend extras");
    assert.equal(extras[0].id, loadedExtras[0].id);

    assert.ok(loadedPlans.length > 0, "Should return backend memberships");
    assert.ok(loadedPlans.some((p) => /Premium/i.test(p.name)));
    assert.equal(plans[0].id, loadedPlans[0].id);

    assert.ok(loadedFacilities.length > 0, "Should return backend facilities");
    assert.ok(
      loadedFacilities.some(
        (f) => /Guayaquil/i.test(f.name) || /Guayaquil/i.test(f.address),
      ),
    );
    assert.equal(facilities[0].id, loadedFacilities[0].id);

    assert.ok(loadedPromos.length > 0, "Should return backend promotions");
    assert.ok(loadedRewards.length > 0, "Should return backend rewards");

    const g = loadedGarments[0];
    const s = loadedServices[0];
    const ex = loadedExtras[0];
    const branch = loadedFacilities[0];

    const unitPrice = Number((g.basePrice + s.extraPrice).toFixed(2));
    const pricing = calculatePricing(
      [
        {
          id: g.id,
          garmentType: g.name,
          quantity: 2,
          serviceType: s.name,
          unitPrice,
          notes: "",
          iconName: g.iconKey,
        },
      ],
      [ex.id],
      "FIXED",
      "Básico",
    );
    assert.equal(pricing.itemsSubtotal, Number((unitPrice * 2).toFixed(2)));
    assert.equal(pricing.extrasTotal, ex.price);

    repo.addWalletCredit(100);
    const inSlot = repo.state.timeSlots.find(
      (slot) =>
        slot.context === "DRIVER_PICKUP" &&
        slot.active &&
        slot.reservedCount < slot.capacity,
    )!;
    const outSlot = repo.state.timeSlots.find(
      (slot) =>
        slot.context === "FACILITY_PICKUP" &&
        slot.active &&
        slot.reservedCount < slot.capacity &&
        slot.date > inSlot.date,
    )!;

    const order = repo.createOrder({
      items: [
        {
          id: g.id,
          garmentType: g.name,
          quantity: 2,
          serviceType: s.name,
          unitPrice,
          notes: "",
          iconName: g.iconKey,
        },
      ],
      extraIds: [ex.id],
      inbound: {
        method: "DRIVER",
        addressId: "addr-g1",
        addressFull: "Av. Francisco de Orellana, Guayaquil",
        scheduledDate: inSlot.date,
        timeSlotId: inSlot.id,
        timeSlotText: slotRange(inSlot),
        status: "SCHEDULED",
        latitude: -2.1894,
        longitude: -79.8891,
      },
      outbound: {
        method: "CUSTOMER",
        facilityId: branch.id,
        facilityName: branch.name,
        addressFull: branch.address,
        scheduledDate: outSlot.date,
        timeSlotId: outSlot.id,
        timeSlotText: slotRange(outSlot),
        status: "SCHEDULED",
        latitude: branch.latitude,
        longitude: branch.longitude,
      },
      pricingModel: "FIXED",
      paymentMethod: "Billetera",
      notes: "Retiro en sucursal Guayaquil",
    });

    assert.equal(order.facilityName, branch.name);
    assert.equal(order.delivery.addressFull, branch.address);
  } finally {
    resetCatalogToFallback();
    await authService.logout();
  }
});
