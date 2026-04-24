import { create } from 'zustand';
import { OrderStatus } from '../data/mockData';

interface OrderStatusState {
  overrides: Record<string, OrderStatus>;
  setStatus: (orderId: string, status: OrderStatus) => void;
  clearStatus: (orderId: string) => void;
}

export const useOrderStatusStore = create<OrderStatusState>((set) => ({
  overrides: {},
  setStatus: (orderId, status) =>
    set((state) => ({
      overrides: {
        ...state.overrides,
        [orderId]: status,
      },
    })),
  clearStatus: (orderId) =>
    set((state) => {
      const next = { ...state.overrides };
      delete next[orderId];
      return { overrides: next };
    }),
}));

