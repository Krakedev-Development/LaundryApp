import { User } from '../types';

export const MOCK_USERS: { email: string; password: string; user: User }[] = [
  {
    email: 'cliente@test.com',
    password: '123456',
    user: {
      id: '1',
      name: 'Juan Cliente',
      email: 'cliente@test.com',
      role: 'client',
      status: 'approved',
      cedula_photo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=60',
      selfie_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=60',
    },
  },
  {
    email: 'admin@test.com',
    password: '123456',
    user: {
      id: '2',
      name: 'María Admin',
      email: 'admin@test.com',
      role: 'admin',
      status: 'approved',
    },
  },
  {
    email: 'chofer@test.com',
    password: '123456',
    user: {
      id: '3',
      name: 'Carlos Chofer',
      email: 'chofer@test.com',
      role: 'driver',
      status: 'approved',
    },
  },
];
