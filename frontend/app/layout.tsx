// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";

import Providers from "./providers";
import Navbar from "@/components/shared/Navbar";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { PusherProvider } from "@/contexts/PusherContext";
import ClientProviders from "@/components/ClientProviders";
import GlobalLoader from "@/components/GlobalLoader";
import AuthModal from "@/components/AuthModal";
import AppChrome from "@/components/AppChrome";

const lamaSans = localFont({
  src: [
    { path: "../public/fonts/lama-sans/LamaSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/lama-sans/LamaSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-lama",
  display: "swap",
});

const almarai = localFont({
  src: [
    { path: "../public/fonts/almarai/Almarai-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/almarai/Almarai-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-almarai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DASM - منصة المزادات الرقمية للأسواق",
  description: "منصة رقمية للمزادات المباشرة والفورية والمتأخرة",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${lamaSans.variable} ${almarai.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>

      <body
        className={`${lamaSans.className} ${almarai.className} min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <LoadingProvider>
          <PusherProvider>
            <Providers>
              <ClientProviders>
                {/* ✅ الهيدر هنا فقط مرة واحدة (هيظهر في dashboards أكيد) */}
                <Navbar />

                {/* ✅ AppChrome بقت للحماية/المودال فقط */}
                <AppChrome authModal={<AuthModal />}>
                  {children}
                </AppChrome>
              </ClientProviders>

              <GlobalLoader />
            </Providers>
          </PusherProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
