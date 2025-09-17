"use client";

import React from 'react';
import { useLoading } from '@/contexts/LoadingContext';

export default function GlobalLoader() {
  const { isLoading } = useLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
        <div className="absolute inset-0 bg-white bg-opacity-30"></div>
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-300 rounded-full opacity-30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Main Loading Container */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 p-12">
        {/* Premium Spinner */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-r from-blue-200 to-purple-200 opacity-20 blur-xl animate-pulse"></div>
          
          {/* Main spinner container */}
          <div className="relative w-24 h-24">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-300 border-opacity-20"></div>
            
            {/* Rotating gradient arc */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-300 border-r-purple-300 animate-spin"></div>
            
            {/* Inner rotating ring */}
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-cyan-300 border-l-pink-300 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            
            {/* Center pulsing dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full animate-pulse shadow-lg opacity-60"></div>
            </div>
          </div>
        </div>

        {/* Premium Text */}
        <div className="text-center space-y-4">
          {/* Animated dots */}
          <div className="flex items-center justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full animate-bounce opacity-50"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
          
          {/* Main title */}
          <h2 className="text-3xl font-bold text-gray-700 tracking-wide bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          يتم معالجة الطلب
          </h2>
          
          {/* Subtitle */}
          <p className="text-lg text-gray-500 font-medium">
            يرجى الانتظار قليلاً
          </p>
        </div>

        {/* Premium Progress Bar */}
        <div className="w-80 max-w-full">
          <div className="h-2 bg-gray-200 bg-opacity-30 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="h-full bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 rounded-full animate-pulse relative opacity-50">
              <div className="absolute inset-0 bg-white opacity-15 rounded-full animate-ping"></div>
            </div>
          </div>
        </div>

        {/* Brand/Logo area */}
        <div className="text-center">
          <div className="text-sm text-gray-400 font-medium tracking-wider">
            DASM Platform
          </div>
        </div>
      </div>
    </div>
  );
}
