export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface TruckLocation {
  truckId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface TruckPublic {
  id: string;
  name: string;
  cuisineType: string;
  isLive: boolean;
  lastLat: number | null;
  lastLng: number | null;
}

export interface HotspotCluster {
  lat: number;
  lng: number;
  count: number;
}

export interface TransactionInput {
  itemName: string;
  price: number;
  lat: number;
  lng: number;
  truckId: string;
}

export type SubscriptionTier = "basic" | "pro" | "enterprise";

export interface TruckWithSubscription extends TruckPublic {
  subscription: {
    tier: SubscriptionTier;
    priceUsd: number;
  } | null;
}
