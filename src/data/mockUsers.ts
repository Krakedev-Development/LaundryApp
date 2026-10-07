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
      customerId:'c1',
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
      driverId:'d1',
      status: 'approved',
    },
  },
];

MOCK_USERS.push(
  {email:'cliente@demo.laundry',password:'123456',user:{id:'DEMO-CLIENT',name:'María Torres Alarcón',email:'cliente@demo.laundry',role:'client',status:'approved',customerId:'CUST-001'}},
  {email:'chofer@demo.laundry',password:'123456',user:{id:'DEMO-DRIVER',name:'Diego Valdivia',email:'chofer@demo.laundry',role:'driver',status:'approved',driverId:'DRV-105'}},
  {email:'supervisor@demo.laundry',password:'123456',user:{id:'DEMO-SUPERVISOR',name:'Elena Rostova',email:'supervisor@demo.laundry',role:'supervisor',status:'approved',facilityId:'FAC-02'}},
);
