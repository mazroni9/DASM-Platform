"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ShieldCheck, CreditCard, Loader2 } from "lucide-react";

// Extend the Window interface to include Moyasar
declare global {
  interface Window {
    Moyasar?: {
      init: (config: MoyasarConfig) => void;
    };
  }
}

interface MoyasarConfig {
  element: string;
  amount: number;
  currency: string;
  description: string;
  publishable_api_key: string;
  callback_url: string;
  supported_networks: string[];
  methods: string[];
  on_completed?: (payment: unknown) => void;
  on_failure?: (error: unknown) => void;
}

interface MoyasarWidgetProps {
  totalAmount: number;
  auctionId: string | number;
  settlementId: string | number;
  callbackUrl?: string;
  description?: string;
}
export default function MoyasarWidget({
  totalAmount,
  auctionId,
  settlementId,
  callbackUrl,
  description,
}: MoyasarWidgetProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  // Unique ID for the form container to handle re-mounting
  const formId = useRef(`mysr-form-${Date.now()}`);

  // Convert amount to Halalas (smallest currency unit - multiply by 100)
  const amountInHalalas = Math.round(totalAmount * 100);

  // Build callback URL with settlement info
  const effectiveCallbackUrl =
    callbackUrl ||
    `${typeof window !== "undefined" ? window.location.origin : ""}/api/payment/callback/moyasar?settlement_id=${settlementId}`;
    
  // Check if Moyasar script is already loaded on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.Moyasar) {
      setIsScriptLoaded(true);
    }
  }, []);

  // Initialize Moyasar once the script is loaded
  useEffect(() => {
    if (
      isScriptLoaded &&
      !isInitialized &&
      window.Moyasar &&
      widgetContainerRef.current
    ) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        try {
          // Clear any previous form content
          if (widgetContainerRef.current) {
            widgetContainerRef.current.innerHTML = "";
          }

          window.Moyasar.init({
            element: `#${formId.current}`,
            amount: amountInHalalas,
            currency: "SAR",
            description: description || `Auction Service Fees #${auctionId}`,
            publishable_api_key:
              process.env.NEXT_PUBLIC_MOYASAR_KEY ||
              "pk_test_bxFciAH9vKLjHFwuNaCvB32RrtQNEautni7LBMsy",
            callback_url: effectiveCallbackUrl,
            supported_networks: ["visa", "mastercard", "mada"],
            methods: ["creditcard", "stcpay"],
          });
          setIsInitialized(true);
        } catch (error) {
          console.error("Error initializing Moyasar:", error);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [
    isScriptLoaded,
    isInitialized,
    amountInHalalas,
    auctionId,
    effectiveCallbackUrl,
    description,
  ]);

  const handleScriptLoad = () => {
    setIsScriptLoaded(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Moyasar CSS */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.3/dist/moyasar.css"
      />

      {/* Moyasar Script */}
      <Script
        src="https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.3/dist/moyasar.umd.min.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />

      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-bold text-lg text-slate-800">
          بيانات البطاقة البنكية
        </h2>
        <div className="flex gap-2 items-center">
          {/* Payment Network Icons */}
          <div className="flex gap-1">
            <img
              src="/assets/images/Mada-01.svg"
              alt="Mada"
              className="h-6 w-auto"
            />
            <img
              src="/assets/images/Visa-01.svg"
              alt="Visa"
              className="h-6 w-auto"
            />
            <img
              src="/assets/images/Mastercard-01.svg"
              alt="Mastercard"
              className="h-6 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Moyasar Widget Container */}
      <div className="p-6 md:p-8">
        {!isScriptLoaded && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">جاري تحميل نموذج الدفع...</p>
          </div>
        )}

        {/* Moyasar Form Container */}
        <div
          id={formId.current}
          ref={widgetContainerRef}
          className={`${!isScriptLoaded ? "hidden" : ""}`}
          dir="ltr"
        />

        {/* Security Note */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-center text-xs text-slate-400 flex justify-center items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            معالجة آمنة ومشفرة بواسطة <strong>Moyasar</strong>
          </p>
        </div>
      </div>

      {/* Custom Styles for Moyasar Form */}
      <style jsx global>{`
        /* Moyasar Form Customization for RTL Layout */
        .mysr-form {
          font-family: inherit;
        }

        .mysr-form .mysr-form-input {
          border-radius: 0.5rem;
          border-color: #cbd5e1;
          padding: 0.75rem 1rem;
        }

        .mysr-form .mysr-form-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .mysr-form .mysr-form-label {
          font-weight: 500;
          color: #334155;
          margin-bottom: 0.25rem;
        }

        .mysr-form button[type="submit"] {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-radius: 0.75rem;
          padding: 1rem;
          font-weight: 700;
          font-size: 1rem;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
          transition: all 0.2s ease;
        }

        .mysr-form button[type="submit"]:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
        }

        .mysr-form button[type="submit"]:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .mysr-form .mysr-network-icons {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .mysr-form .mysr-network-icons img {
          height: 1.5rem;
          width: auto;
        }
      `}</style>
    </div>
  );
}
