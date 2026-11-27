import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  garments,
  plans,
  resetCatalogToFallback,
  syncCatalogState,
} from "../src/domain/catalog";
import {
  calculatePricing,
  currentCustomer,
  initializeState,
  LaundryRepository,
} from "../src/domain/repository";
import { mapBackendOrderToDomain } from "../src/services/orders/orderService";

const client = (over: object = {}) => ({
  id: "u-1",
  email: "ana@correo.test",
  name: "Ana Pérez",
  phone: "0991234567",
  role: "CLIENT",
  status: "ACTIVE",
  kycStatus: "APPROVED" as const,
  ...over,
});

test("un cliente nuevo no tiene membresía hasta elegir un plan", () => {
  const repo = new LaundryRepository(initializeState());
  repo.authenticateFromApi(client({ membershipPlan: null }), "hash");
  assert.equal(currentCustomer(repo.state).membershipTier, "");
  assert.equal(currentCustomer(repo.state).membershipPlanId, null);
});

test("la membresía la informa el servidor y se actualiza al iniciar sesión", () => {
  const repo = new LaundryRepository(initializeState());
  repo.authenticateFromApi(
    client({ membershipPlan: { id: "p-1", name: "Premium" } }),
    "hash",
  );
  assert.equal(currentCustomer(repo.state).membershipTier, "Premium");
  assert.equal(currentCustomer(repo.state).membershipPlanId, "p-1");
  repo.authenticateFromApi(client({ membershipPlan: null }), "hash");
  assert.equal(currentCustomer(repo.state).membershipTier, "");
  assert.equal(currentCustomer(repo.state).membershipPlanId, null);
});

test("el descuento de membresía coincide por planId aunque se renombre el plan en la web", () => {
  try {
    syncCatalogState({
      garments: [
        {
          id: "g-1",
          name: "Camisa",
          category: "Prendas superiores",
          basePrice: 10,
          estimatedHours: 24,
          iconKey: "shirt-outline",
        },
      ],
      plans: [
        {
          id: "plan-1",
          name: "Oro Renombrado",
          priceMonthly: 15,
          weeklyPickups: null,
          garmentDiscountPercent: 20,
          benefits: ["Envíos ilimitados"],
        },
      ],
    });
    const repo = new LaundryRepository(initializeState());
    repo.authenticateFromApi(
      client({ membershipPlan: { id: "plan-1", name: "Oro Original" } }),
      "hash",
    );
    const c = currentCustomer(repo.state);
    const pricing = calculatePricing(
      [
        {
          id: garments[0].id,
          garmentType: garments[0].name,
          quantity: 2,
          serviceType: "Lavado",
          unitPrice: 10,
          notes: "",
          iconName: "shirt-outline",
        },
      ],
      [],
      "FIXED",
      c.membershipPlanId || c.membershipTier,
    );
    assert.equal(pricing.membershipBenefitDiscount, 4);
    assert.equal(plans[0].weeklyPickups, null);

    repo.changeMembershipPlan(null);
    assert.equal(currentCustomer(repo.state).membershipPlanId, null);
    assert.equal(currentCustomer(repo.state).membershipTier, "");
    assert.equal(currentCustomer(repo.state).membershipStatus, "CANCELLED");
  } finally {
    resetCatalogToFallback();
  }
});

test("mapBackendOrderToDomain usa nombres reales de prendas, servicios, extras y sede", () => {
  const mapped = mapBackendOrderToDomain({
    id: "ord-uuid-1",
    number: 12,
    status: "CONFIRMED",
    mode: "HOME_HOME",
    facilityId: "fac-1",
    facility: { id: "fac-1", name: "Sede Urdesa" },
    paymentStatus: "PAID",
    pricingStatus: "CALCULATED",
    total: "12.50",
    version: 1,
    createdAt: "2026-11-27T00:00:00Z",
    items: [
      {
        id: "it-1",
        garmentId: "g-1",
        serviceId: "s-1",
        quantity: 2,
        unitPrice: "5.00",
        garment: { id: "g-1", name: "Camisa de Lino", icon: "shirt" },
        service: { id: "s-1", name: "Lavado Delicado" },
      },
    ],
    extras: [
      {
        id: "ex-1",
        extraId: "e-1",
        price: "1.50",
        extra: { id: "e-1", name: "Perfume Textil" },
      },
    ],
  });
  assert.equal(mapped.facilityName, "Sede Urdesa");
  assert.equal(mapped.items[0].garmentType, "Camisa de Lino");
  assert.equal(mapped.items[0].serviceType, "Lavado Delicado");
  assert.equal(mapped.extras[0].name, "Perfume Textil");
});
