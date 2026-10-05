import { DomainEngine } from "../domain/engine";
import { Session } from "../domain/models";
import { pointsBalance, walletBalance } from "../domain/rules";

/** A scoped repository facade: driver screens receive only this driver's orders and assignments. */
export function repositories(engine: DomainEngine, session: Session) {
  return {
    OrderRepository: {
      list: () => engine.ordersFor(session),
      get: (id: string) => engine.order(session, id),
      create: engine.createOrder.bind(engine, session),
    },
    CustomerRepository: { get: () => engine.customer(session) },
    DriverRepository: {
      assignments: () => engine.assignmentsFor(session),
      route: () => engine.routeFor(session),
    },
    CatalogRepository: {
      list: () =>
        engine.data.catalog.filter((c) => c.active && c.customerSelectable),
      services: () =>
        engine.data.services.filter((s) => s.active && s.customerSelectable),
    },
    PaymentRepository: {
      cards: () =>
        engine.data.cards.filter((c) => c.customerId === session.userId),
    },
    WalletRepository: {
      balance: () => walletBalance(engine.data, session.userId),
      transactions: () =>
        engine.data.walletTransactions.filter(
          (t) =>
            t.walletId ===
            engine.data.customers.find((c) => c.id === session.userId)
              ?.walletId,
        ),
    },
    BenefitsRepository: {
      points: () => pointsBalance(engine.data, session.userId),
      redemptions: () =>
        engine.data.redemptions.filter((r) => r.customerId === session.userId),
    },
    NotificationRepository: {
      list: () =>
        engine.data.notifications.filter((n) => n.userId === session.userId),
    },
  };
}
