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
        is_active?: boolean;
    };
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
    is_active?: boolean;
    status?: "pending" | "active" | "rejected";
}

export interface Car {
<<<<<<< HEAD
=======
    auctions: any;
>>>>>>> DASMadmin
    id: number;
    make: string;
    model: string;
    year: number;
    vin: string;
    odometer: number;
    condition: string;
    evaluation_price: number;
    auction_status: string;
    color?: string;
    engine?: string;
    transmission?: string;
    description?: string;
    images?: string[];
    dealer_id?: number;
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
