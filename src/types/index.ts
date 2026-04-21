export type UserRole = 'client' | 'admin' | 'driver';

export type AccountStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  cedula_photo?: string;
  selfie_photo?: string;
}

export type OrderStatus =
  | 'pending'
  | 'picked_up'
  | 'in_process'
  | 'ready'
  | 'delivering'
  | 'delivered';

export type GarmentType = 'ropa_normal' | 'ropa_delicada' | 'sabanas' | 'edredon';
export type ServiceType = 'lavado' | 'lavado_planchado' | 'solo_planchado';

export interface Order {
  id: string;
  clientId: string;
  driverId?: string;
  status: OrderStatus;
  garmentType: GarmentType;
  serviceType: ServiceType;
  pickupTime: string;
  address: string;
  coordinates: Coordinates;
  createdAt: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DriverLocation {
  driverId: string;
  coordinates: Coordinates;
  updatedAt: string;
}
