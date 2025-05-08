"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    avatar?: string;
}

interface LoginResponse {
    access_token: string;
    user: User;
}

interface ProfileResponse {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
}

interface RefreshResponse {
    access_token: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for token in localStorage on mount
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            setToken(storedToken);
            // Set default Authorization header
            axios.defaults.headers.common["Authorization"] =
                `Bearer ${storedToken}`;
            // Fetch user profile
            fetchUserProfile();
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get<ProfileResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`
            );
            setUser(response.data);
        } catch (error) {
            // If token is invalid, clear everything
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common["Authorization"];
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await axios.post<LoginResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/login`,
                {
                    email,
                    password,
                }
            );

            const { access_token, user } = response.data;

            // Store token
            localStorage.setItem("token", access_token);
            setToken(access_token);

            // Set default Authorization header
            axios.defaults.headers.common["Authorization"] =
                `Bearer ${access_token}`;

            // Set user
            setUser(user);

            console.log("User: ", user);
            console.log("user isadmin: ", user.role === "admin");

            // Redirect based on role
            if (user.role === "admin") {
                // router.push("/admin/dashboard"); 
            } else if (user.role === "dealer") {
                // router.push("/dealer/dashboard");
            } else {
                // router.push('/dashboard');
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Login failed");
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/logout`);
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // Clear everything regardless of API call success
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common["Authorization"];
            router.push("/auth/login");
        }
    };

    const refreshToken = async () => {
        try {
            const response = await axios.post<RefreshResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/refresh`
            );
            const { access_token } = response.data;

            localStorage.setItem("token", access_token);
            setToken(access_token);
            axios.defaults.headers.common["Authorization"] =
                `Bearer ${access_token}`;
        } catch (error) {
            // If refresh fails, logout
            await logout();
        }
    };

    return (
        <AuthContext.Provider
            value={{ user, token, isLoading, login, logout, refreshToken }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
