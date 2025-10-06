// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import ProtectedRoute from "@/components/ProtectedRoute";
import Providers from "./providers";
import Navbar from "@/components/shared/Navbar";
import { LoadingProvider } from "@/contexts/LoadingContext";
import ClientProviders from "@/components/ClientProviders";
import GlobalLoader from "@/components/GlobalLoader";

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
    <html lang="ar" dir="rtl" className={lamaSans.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${lamaSans.className} min-h-screen bg-slate-950`}>
        <LoadingProvider>
          <Providers>
            <ProtectedRoute>
              <ClientProviders>
                <Navbar />
                <main>{children}</main>
              </ClientProviders>
            </ProtectedRoute>
            <GlobalLoader />
          </Providers>
        </LoadingProvider>
      </body>
    </html>
  );
}