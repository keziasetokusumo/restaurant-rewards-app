export interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceIdr: number;
  isPopular?: boolean;
}

export interface ReviewHighlight {
  id: string;
  author: string;
  rating: number;
  text: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  area: string;
  distanceKm: number;
  rating: number;
  priceLevel: 1 | 2 | 3 | 4;
  imageUrl: string;
  isNewToUser: boolean;   // drives discovery surfacing
  rewardRate: number;     // points earned per 1,000 IDR spent
  description: string;
  address: string;
  hours: { weekdays: string; weekends: string };
  tags: string[];
  menuHighlights: MenuItem[];
  reviewCount: number;
  photos: Array<{ id: string; emoji: string; bg: string }>;
  reviewHighlights: ReviewHighlight[];
  lat: number;
  lng: number;
  hasReservations?: boolean;
  whatsappNumber?: string;  // e.g. '6281234567890' — used for WA booking fallback
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  restaurantId?: string;
  expiresAt?: string;
}

export type PaymentMethodType = 'card' | 'bank';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;   // e.g. 'BCA •••• 4421' — never store raw numbers
  last4: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  pointsBalance: number;
  defaultPaymentMethodId?: string;
}

export type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

export interface WalletBalance {
  total: number;
  cashbackEarned: number;
  toppedUp: number;
}

export interface FavouriteSpot {
  restaurantId: string;
  visitCount: number;
  lastVisitedLabel: string;
}

export interface Gastronome {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  city: string;
  pointsBalance: number;
  isFollowing: boolean;
}

export interface UserProfile {
  name: string;
  initials: string;
  avatarColor: string;
  memberSince: string;
  city: string;
  pointsBalance: number;
  wallet: WalletBalance;
  favouriteSpots: FavouriteSpot[];
  followingCount: number;
  followersCount: number;
  totalCheckIns: number;
  uniquePlacesDined: number;
}
