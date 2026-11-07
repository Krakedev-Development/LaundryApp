import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  extras,
  facilities,
  garments,
  plans,
  resetCatalogToFallback,
  services,
} from "../src/domain/catalog";
import {
  calculatePricing,
  initializeState,
  LaundryRepository,
  slotRange,
} from "../src/domain/repository";
import { authService } from "../src/services/auth/authService";
import {
  fetchExtras,
  fetchFacilities,
  fetchGarments,
  fetchMemberships,
  fetchServices,
} from "../src/services/catalog/catalogService";

test("catalogService fetches real garments, services, extras, memberships and Guayaquil facilities from backend API", async () => {
  const now = new Date("2026-10-07T12:00:00Z");
  const uniqueEmail = `catalogo.api.${Date.now()}@laundryfresh.com`;
  const repo = new LaundryRepository(initializeState(now), now);

  try {
    await repo.registerWithApi(
      "Camila Catálogo",
      uniqueEmail,
      "0991122334",
      "ClaveSegura123",
      "hash-cat-1",
    );

    const [
      loadedGarments,
      loadedServices,
      loadedExtras,
      loadedPlans,
      loadedFacilities,
    ] = await Promise.all([
      fetchGarments(),
      fetchServices(),
      fetchExtras(),
      fetchMemberships(),
      fetchFacilities(),
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
      loadedFacilities.some((f) => /Guayaquil/i.test(f.name) || /Guayaquil/i.test(f.address)),
    );
    assert.equal(facilities[0].id, loadedFacilities[0].id);

    // Verify pricing and order creation with live backend catalog items
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
