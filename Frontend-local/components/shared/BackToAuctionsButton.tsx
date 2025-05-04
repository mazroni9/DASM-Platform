'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type BackToAuctionsButtonProps = {
  className?: string;
  href?: string;
  text?: string;
};

export default function BackToAuctionsButton({ 
  className = '',
  href = '/auctions/auctions-quality',
  text = 'العودة إلى السوق النوعي'
}: BackToAuctionsButtonProps) {
  return (
    <Link 
      href={href} 
      className={`inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 rtl:flex-row-reverse ${className}`}
    >
      <ChevronRight className="h-4 w-4 ltr:mr-1 rtl:ml-1 rtl:rotate-180" />
      <span>{text}</span>
    </Link>
  );
} 