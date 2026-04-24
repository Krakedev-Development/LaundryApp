import { create } from 'zustand';

export interface BillingData {
  name: string;
  idDoc: string;
  email: string;
  phone: string;
  address: string;
}

const empty: BillingData = {
  name: '',
  idDoc: '',
  email: '',
  phone: '',
  address: '',
};

interface BillingState extends BillingData {
  setAll: (data: BillingData) => void;
}

export const useBillingStore = create<BillingState>((set) => ({
  ...empty,
  setAll: (data) => set({ ...data }),
}));
