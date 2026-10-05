import { operationalStage } from '../../domain/fulfillment';
import {
  MockTrackingProvider,
  demoTrackingRoute,
} from "./MockTrackingProvider";
import { routingService } from "./index";
import { MockDriverLocationPublisher } from "./MockDriverLocationPublisher";
import { geoConfig } from "./geo.config";
import type { AppData } from "../../domain/models";
import type { DriverLocation } from "./geo.types";
export class AppMockTracking {
  private provider = new MockTrackingProvider(geoConfig.trackingIntervalMs);
  private active = new Map<
    string,
    { key: string; controller: AbortController; unsubscribe?: () => void }
  >();
  reconcile(
    data: AppData,
    online: boolean,
    publish: (location: DriverLocation) => void,
  ) {
    const needed = new Set<string>();
    if (online && geoConfig.trackingMode === "mock")
      data.orders
        .filter((o) =>
          [
            "HEADING_TO_PICKUP",
            "OUT_FOR_DELIVERY",
            "HEADING_TO_FACILITY",
          ].includes(operationalStage(o)),
        )
        .forEach((order) => {
          const assignment = data.assignments.find(
            (a) => a.orderId === order.id && a.status === "ACTIVE",
          );
          const driver = data.drivers.find(
            (d) => d.id === assignment?.driverId,
          );
          if (!driver || needed.has(driver.id)) return;
          const target =
            operationalStage(order) === "HEADING_TO_FACILITY"
              ? data.facilities.find((f) => f.id === order.facilityId)
                  ?.coordinates
              : (operationalStage(order) === "OUT_FOR_DELIVERY"
                  ? order.delivery
                  : order.pickup
                ).address.coordinates;
          if (!target) return;
          const id = driver.id,
            key = order.id + ":" + operationalStage(order);
          needed.add(id);
          if (this.active.get(id)?.key === key) return;
          this.stop(id);
          const controller = new AbortController();
          this.active.set(id, { key, controller });
          routingService
            .getRoute(driver.location, target, { signal: controller.signal })
            .catch(() => demoTrackingRoute(driver.location, target))
            .then((route) => {
              if (controller.signal.aborted) return;
              this.provider.start(
                id,
                route ?? demoTrackingRoute(driver.location, target),
              );
              const publisher = new MockDriverLocationPublisher(publish);
              void publisher.start(id);
              const unsubscribe = this.provider.subscribeToDriver(
                id,
                (location) => {
                  void publisher.publish(location);
                },
              );
              const state = this.active.get(id);
              if (state)
                state.unsubscribe = () => {
                  unsubscribe();
                  void publisher.stop();
                };
            });
        });
    this.active.forEach((_, id) => {
      if (!needed.has(id)) this.stop(id);
    });
  }
  private stop(id: string) {
    const state = this.active.get(id);
    state?.controller.abort();
    state?.unsubscribe?.();
    this.provider.stop(id);
    this.active.delete(id);
  }
  dispose() {
    this.active.forEach((_, id) => this.stop(id));
  }
}
