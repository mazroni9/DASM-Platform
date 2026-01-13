export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  DEALER = "dealer",
  MODERATOR = "moderator",
  VENUE_OWNER = "venue_owner",
  INVESTOR = "investor",
  USER = "user",
}

export const UserRoleHelpers = {
  getLabel: (role: UserRole): string => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "Super Administrator";
      case UserRole.ADMIN:
        return "Administrator";
      case UserRole.DEALER:
        return "Dealer";
      case UserRole.MODERATOR:
        return "Moderator";
      case UserRole.VENUE_OWNER:
        return "Venue Owner";
      case UserRole.INVESTOR:
        return "Investor";
      case UserRole.USER:
        return "User";
      default:
        return "Unknown";
    }
  },

  getLabelAr: (role: UserRole): string => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "مدير النظام الرئيسي";
      case UserRole.ADMIN:
        return "مدير النظام";
      case UserRole.DEALER:
        return "تاجر";
      case UserRole.MODERATOR:
        return "مشرف";
      case UserRole.VENUE_OWNER:
        return "مالك المعرض";
      case UserRole.INVESTOR:
        return "مستثمر";
      case UserRole.USER:
        return "مستخدم";
      default:
        return "غير معروف";
    }
  },

  getColor: (role: UserRole): string => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "red";
      case UserRole.ADMIN:
        return "red";
      case UserRole.DEALER:
        return "blue";
      case UserRole.MODERATOR:
        return "green";
      case UserRole.VENUE_OWNER:
        return "purple";
      case UserRole.INVESTOR:
        return "yellow";
      case UserRole.USER:
        return "gray";
      default:
        return "gray";
    }
  },

  isAdmin: (role: UserRole): boolean => {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  },

  canManageAuctions: (role: UserRole): boolean => {
    return [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.MODERATOR,
      UserRole.VENUE_OWNER,
    ].includes(role);
  },

  canManageUsers: (role: UserRole): boolean => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR].includes(
      role
    );
  },

  canManageVenues: (role: UserRole): boolean => {
    return [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.VENUE_OWNER,
    ].includes(role);
  },

  canAccessInvestments: (role: UserRole): boolean => {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTOR].includes(
      role
    );
  },

  getAllRoles: (): UserRole[] => {
    return Object.values(UserRole);
  },
};

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  type: UserRole;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  status?: "pending" | "active" | "rejected";
}

export interface Car {
  auctions: any;
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  odometer: number;
  condition: string;
  evaluation_price: number;
  auction_status: string;
  status?: string;
  color?: string;
  engine?: string;
  transmission?: string;
  description?: string;
  images?: string[];
  user_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Auction {
  id: number;
  car_id: number;
  start_time: string;
  end_time: string;
  starting_price: number;
  status: string;
  created_at: string;
  updated_at: string;
}
