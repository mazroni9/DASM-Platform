export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  dealer_id?: number;
  dealer?: {
    id: number;
    company_name: string;
    commercial_registry: string;
    description?: string;
    verified: boolean;
  };
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
} 