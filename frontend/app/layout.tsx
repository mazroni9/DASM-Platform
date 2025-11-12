// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
// Removed ProtectedRoute - authentication now handled by middleware.ts
// Client-side role-based redirects handled at page level where needed
import Providers from "./providers";
import Navbar from "@/components/shared/Navbar";
import { LoadingProvider } from "@/contexts/LoadingContext";
import ClientProviders from "@/components/ClientProviders";
import GlobalLoader from "@/components/GlobalLoader";
import AuthModal from "@/components/AuthModal";

const lamaSans = localFont({
  src: [
    { path: "../public/fonts/lama-sans/LamaSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/lama-sans/LamaSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-lama",
  display: "swap",
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
    <html lang="ar" dir="rtl" className={lamaSans.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${lamaSans.className} min-h-screen`}>
        <LoadingProvider>
          <Providers>
            <ClientProviders>
              <Navbar />
              <main>{children}</main>
              <AuthModal />
            </ClientProviders>
            <GlobalLoader />
          </Providers>
        </LoadingProvider>
      </body>
    </html>
  );
}