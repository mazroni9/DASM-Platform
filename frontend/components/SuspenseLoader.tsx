"use client";

import React from 'react';

export default function SuspenseLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-8">
      <div className="flex flex-col items-center space-y-4">
        {/* Simple spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
        </div>
        
        {/* Loading text */}
        <p className="text-gray-600 text-sm font-medium">جاري التحميل...</p>
      </div>
    </div>
  );
}

