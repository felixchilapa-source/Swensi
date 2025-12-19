export enum Role {
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
  SHOP_OWNER = 'SHOP_OWNER',
  LODGE = 'LODGE'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  WAITING_FOR_SHOP_PICKUP = 'WAITING_FOR_SHOP_PICKUP',
  SO_TICKING = 'SO_TICKING',
  TP_CONFIRMING_ITEMS = 'TP_CONFIRMING_ITEMS',
  PAYMENT_TO_SO_PENDING = 'PAYMENT_TO_SO_PENDING',
  GOODS_IN_TRANSIT = 'GOODS_IN_TRANSIT',
  ON_TRIP = 'ON_TRIP',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ROOM_ASSIGNED = 'ROOM_ASSIGNED'
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  isAvailable: boolean;
}

export interface TripStop {
  id: string;
  startTime?: number;
  endTime?: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  waitTimeCharge: number;
}

export interface SystemLog {
  id: string;
  timestamp: number;
  action: string;
  actorId: string;
  actorPhone: string;
  targetId?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface User {
  id: string;
  phone: string;
  role: Role;
  name: string;
  isActive: boolean;
  location?: Location;
  balance: number; 
  plan?: 'BASIC' | 'PREMIUM';
  subscriptionExpiry?: number;
  memberSince: number;
  rating: number;
  category?: string;
  earnings?: number;
  worksDone?: number;
  language: string;
  trustScore: number; 
  cancellationRate: number; 
  isVerified: boolean;
  isHospitalityPartner?: boolean;
  hospitalityCashflow?: number; 
  lodgeReceptionPhone?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  providerId?: string;
  category: string;
  description: string;
  status: BookingStatus;
  location: Location;
  destination?: Location;
  createdAt: number;
  scheduledAt?: number; 
  customerPhone: string;
  price: number;
  commission: number; 
  isPaid: boolean;
  roomNumber?: string;
  receiptId?: string;
  checkInDate?: number;
  checkOutDate?: number;
  lodgeId?: string;
  isTrustedTransportOnly?: boolean;
  activeStop?: TripStop;
  stopHistory: TripStop[];
  pendingDestination?: Location;
  etaMinutes?: number;
  isShoppingOrder?: boolean;
  shoppingItems?: ShoppingItem[];
  shopOwnerPhone?: string;
  soPaid?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'BOOKING_REQUEST' | 'STATUS_UPDATE' | 'ADMIN_ALERT' | 'PAYMENT_REQUEST';
  timestamp: number;
  read: boolean;
}