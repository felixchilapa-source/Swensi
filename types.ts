
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
  SO_TICKING = 'SO_TICKING',
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
  earnings?: number;
  memberSince: number;
  rating: number;
  language: string;
  trustScore: number; 
  isVerified: boolean;
  hospitalityCashflow?: number;
  avatarUrl?: string;
  // KYC Fields
  licenseNumber?: string;
  homeAddress?: string;
  kycSubmittedAt?: number;
  // Trust Indicators
  cancellationRate?: number;
  onTimeRate?: number;
  completedMissions?: number;
  isPremium?: boolean;
}

export interface Booking {
  id: string;
  customerId: string;
  providerId?: string;
  lodgeId?: string;
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
  isTrustedTransportOnly?: boolean;
  trackingHistory: Location[];
  isShoppingOrder?: boolean;
  shoppingItems?: ShoppingItem[];
  shopOwnerPhone?: string;
  roomNumber?: string;
  receiptId?: string;
  cancellationReason?: string;
  // Support for Booking for Others
  recipientName?: string;
  recipientPhone?: string;
  // Performance snapshots
  customerTrustSnapshot?: number;
  providerTrustSnapshot?: number;
}