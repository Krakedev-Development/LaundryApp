import type { AppData } from "../../domain/models";
import { DEMO_FACILITIES, demoCoordinate } from "./demo";
export function migrateAppGeoData(data: AppData) {
  const old = (p: { lat: number; lng: number }) => p.lat < -10 && p.lng < -70;
  data.facilities.forEach((f) => {
    if (old(f.coordinates)) {
      const demo = DEMO_FACILITIES.find((d) => d.id === f.id);
      if (demo) Object.assign(f, demo);
    }
  });
  data.customers.forEach((c, i) =>
    c.addresses.forEach((a, j) => {
      if (old(a.coordinates)) {
        a.coordinates = demoCoordinate(i + j, "FAC-02");
        a.fullAddress = "Av. Samborondón, sector central, Ecuador";
        a.persistence = "demo";
      }
    }),
  );
  data.orders.forEach((o, i) =>
    [o.pickup, o.delivery].forEach((schedule, j) => {
      if (old(schedule.address.coordinates)) {
        schedule.address.coordinates = demoCoordinate(i + j, o.facilityId);
        schedule.address.fullAddress = "Av. Samborondón, Ecuador";
        schedule.address.persistence = "demo";
      }
    }),
  );
  data.drivers.forEach((d, i) => {
    if (old(d.location)) {
      d.location = demoCoordinate(i, d.facilityId);
      d.locationSimulated = true;
    }
    d.locationUpdatedAt ??= new Date().toISOString();
  });
}
