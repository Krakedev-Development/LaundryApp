import { SearchField, useSearch } from "../../components/presentation";
import { OrderList } from "../../components/OrderList";
import { useState } from "react";
import { Page } from "../../components/Page";
import { Button } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { visibleOrders } from "../../domain/repository";
import {
  modeLabels,
  statusLabels,
  terminalStatuses,
  type Mode,
} from "../../domain/models";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
import { ordersStyles } from "../../components/OrdersPresentation";
import { OrdersHeader } from "../../widgets/client-orders/OrdersHeader";
import { OrderModeFilter } from "../../features/orders/ui/OrderModeFilter";

export function ClientOrdersScreen() {
  const navigation = useLaundryNavigation(),
    { state } = useApp();
  const [history, setHistory] = useState(false),
    [mode, setMode] = useState<Mode | "ALL">("ALL"),
    [search, setSearch] = useState(""),
    [filters, setFilters] = useState(false);
  const query = useSearch(search);
  const orders = visibleOrders(state).filter(
    (o) =>
      terminalStatuses.includes(o.status) === history &&
      (mode === "ALL" || o.fulfillmentPlan.mode === mode) &&
      (
        o.id +
        " " +
        modeLabels[o.fulfillmentPlan.mode] +
        " " +
        statusLabels[o.status]
      )
        .toLocaleLowerCase()
        .includes(query),
  );
  return (
    <Page scroll={false}>
      <OrdersHeader history={history} onHistoryChange={setHistory} />
      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="Buscar solicitudes"
      />
      <Button
        label={mode === "ALL" ? "Filtrar modalidad" : modeLabels[mode]}
        icon="options-outline"
        secondary
        style={ordersStyles.filter}
        textStyle={ordersStyles.filterText}
        onPress={() => setFilters(true)}
      />
      <OrderList
        orders={orders}
        appearance="orders"
        onDetail={(o) =>
          navigation.navigate("ClientOrderDetail", { orderId: o.id })
        }
        onTrack={(o) =>
          navigation.navigate("ClientTracking", { orderId: o.id })
        }
        onClear={() => {
          setSearch("");
          setMode("ALL");
        }}
      />
      <OrderModeFilter
        mode={mode}
        visible={filters}
        onChange={setMode}
        onClose={() => setFilters(false)}
      />
    </Page>
  );
}
