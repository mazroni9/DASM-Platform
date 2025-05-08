'use client';

import Link from 'next/link';

interface PromotionalBannerProps {
  title: string;
  description: string;
  linkUrl: string;
  linkText: string;
  currentPageUrl: string; // Used for the 'from' query parameter
  bgColor?: string;
  textColor?: string;
}

export default function PromotionalBanner({
  title,
  description,
  linkUrl,
  linkText,
  currentPageUrl,
  bgColor = 'bg-orange-50',
  textColor = 'text-gray-800'
}: PromotionalBannerProps) {
  // Add the referrer parameter to the URL
  const linkWithReferrer = `${linkUrl}?from=${encodeURIComponent(currentPageUrl)}`;
  
  return (
    <div className={`${bgColor} py-10 my-8 rounded-xl`}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className={`text-2xl font-bold mb-4 ${textColor}`}>{title}</h2>
          <p className={`${textColor} opacity-80 mb-6`}>
            {description}
          </p>
          <Link 
            href={linkWithReferrer}
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
          >
            {linkText}
          </Link>
        </div>
      </div>
    </div>
  );
} 