
import "./globals.css";
import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import Providers from "./providers";
import { createInertiaApp } from "@inertiajs/react";

const tajawal = Tajawal({
    subsets: ["arabic", "latin"],
    weight: ["300", "400", "500", "700", "800"],
    variable: "--font-tajawal",
});

export const metadata: Metadata = {
    title: "DASM - منصة المزادات الرقمية للأسواق",
    description: "منصة رقمية للمزادات المباشرة والفورية والصامتة",
};


export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" dir="rtl">
            <head>
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body className={`${tajawal.className} min-h-screen bg-gray-50`}>
                <Providers>
                    <Toaster
                        position="top-center"
                        toastOptions={{
                            duration: 5000,
                            style: {
                                background: "#363636",
                                color: "#fff",
                            },
                        }}
                    />
                    <ProtectedRoute>
                        <div className="min-h-screen bg-gray-50">
                            <main>{children}</main>
                        </div>
                    </ProtectedRoute>
                </Providers>
            </body>
        </html>
    );
}


