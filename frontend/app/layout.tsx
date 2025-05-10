import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "./contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "DASM Platform",
    description: "Digital Auction System Management Platform",
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
            <body className={inter.className}>
                <AuthProvider>
                    <div className="min-h-screen bg-gray-50">
                        <main>{children}</main>
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
