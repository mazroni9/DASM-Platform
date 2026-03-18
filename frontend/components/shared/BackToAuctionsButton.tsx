'use client';

import LoadingLink from "@/components/LoadingLink";
import { ChevronLeft } from 'lucide-react';

type BackToAuctionsButtonProps = {
  className?: string;
  href?: string;
  text?: string;
};

export default function BackToAuctionsButton({ 
  className = '',
  href = '/auctions/auctions-2car',
  text = 'العودة لقطاع السيارات'
}: BackToAuctionsButtonProps) {
  return (
    <LoadingLink 
      href={href} 
      className={`inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 rounded-full border border-blue-200 hover:border-blue-300 bg-white hover:bg-blue-50 rtl:flex-row-reverse ${className}`}
    >
      <ChevronLeft className="h-4 w-4 rtl:ml-1 ltr:mr-1" />
      <span>{text}</span>
    </LoadingLink>
  );
} 