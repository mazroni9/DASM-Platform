"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

// Simple wrapper context around the Zustand store
const AuthContext = createContext<ReturnType<typeof useAuthStore> | undefined>(
    undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const authStore = useAuthStore();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Initialize auth state from localStorage on mount
        const token = localStorage.getItem("token");

        if (token && !authStore.isLoggedIn) {
            // Set authorization header for axios
            const axios = require("axios").default;
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

            // Try to refresh the token to validate it and get user data
            authStore.refreshToken().catch(() => {
                // If refresh fails, token is invalid, redirect to login
                router.push("/auth/login");
            });
        }

        setInitialized(true);
    }, []);

    if (!initialized) {
        return null; // Or a loading spinner
    }

    return (
        <AuthContext.Provider value={authStore}>
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
