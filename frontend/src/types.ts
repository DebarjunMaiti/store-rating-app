export type UserRole = 'ADMIN' | 'USER' | 'STORE_OWNER';
export type StoreStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'PENDING_DELETION';

export interface UserStoreRef {
  id: string;
  name: string;
  email: string;
  address: string;
  status?: StoreStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
  address: string;
  role: UserRole;
  createdAt?: string;
  storeRating?: number | null;
  totalRatingsCount?: number;
  ownedStoreName?: string | null;
  stores?: UserStoreRef[];
}

export interface Store {
  id: string;
  name: string;
  email: string;
  address: string;
  status?: StoreStatus;
  overallRating: number;
  totalRatings: number;
  userSubmittedRating?: number | null;
  owner?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt?: string;
}

export interface ReviewerRating {
  id: string;
  rating: number;
  userName: string;
  userEmail: string;
  userAddress?: string;
  submittedAt: string;
  updatedAt?: string;
}

export interface StoreOwnerDashboardData {
  hasStore: boolean;
  message?: string;
  stores: {
    id: string;
    name: string;
    email: string;
    address: string;
    status?: StoreStatus;
    averageRating: number;
    totalRatings: number;
    reviewers: ReviewerRating[];
  }[];
}

export interface AdminStats {
  totalUsers: number;
  totalStores: number;
  pendingStoresCount: number;
  approvedStoresCount: number;
  deletionRequestsCount: number;
  totalRatings: number;
  roleCounts: {
    admin: number;
    user: number;
    storeOwner: number;
  };
}

export interface ValidationErrors {
  [key: string]: string;
}