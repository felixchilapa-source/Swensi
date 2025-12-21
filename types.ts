
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

export interface SavedNode {
  id: string;
  name: string;
  icon: string;
  loc: Location;
}

export interface Feedback {
  id: string;
  userId: string;
  userPhone: string;
  targetProviderId?: string;
  bookingId?: string;
  rating: number;
  comment: string;
  timestamp: number;
  isRead: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  isAvailable: boolean;
}

export interface CouncilOrder {
  id: string;
  bookingId: string;
  customerPhone: string;
  levyAmount: number;
  type: 'TRANSPORT_LEVY' | 'TRADE_PERMIT' | 'BORDER_CLEARANCE';
  status: 'ISSUED' | 'PAID' | 'VERIFIED';
  issuedAt: number;
  metadata?: {
    category: string;
    description: string;
  };
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
  lastActive: number;
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
  savedNodes?: SavedNode[];
  subscriptionExpiry?: number;
  licenseNumber?: string;
  homeAddress?: string;
  kycSubmittedAt?: number;
  cancellationRate?: number;
  onTimeRate?: number;
  completedMissions?: number;
  isPremium?: boolean;
  availableRooms?: number; // Added for Hospitality inventory management
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
  councilOrderId?: string;
  cancellationReason?: string;
  recipientName?: string;
  recipientPhone?: string;
  customerTrustSnapshot?: number;
  providerTrustSnapshot?: number;
}
