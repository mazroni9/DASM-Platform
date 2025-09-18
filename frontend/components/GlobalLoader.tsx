"use client";

import React from 'react';
import { useLoading } from '@/contexts/LoadingContext';

export default function GlobalLoader() {
  const { isLoading } = useLoading();

  if (!isLoading) {
    return null;
  }

  // Generate random particle positions
  const particles = [...Array(20)].map((_, i) => ({
    key: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    // Base duration; will scale via inline style with CSS clamp
    duration: 2 + Math.random() * 2
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
        <div className="absolute inset-0 bg-white opacity-0"></div> {/* Overlay opacity 0 */}

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map(p => (
            <div
              key={p.key}
              className="absolute rounded-full opacity-30 animate-pulse 
                         w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] md:w-[4px] md:h-[4px] bg-blue-300"
              style={{
                left: p.left,
                top: p.top,
                animationDelay: p.delay,
                // Scale duration: smaller screens slower, larger screens faster
                animationDuration: `clamp(${p.duration + 1}s, ${p.duration}s, ${p.duration - 0.5}s)`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Main Loader Container */}
      <div className="relative z-10 flex flex-col items-center justify-center 
                      w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 
                      bg-white rounded-full shadow-xl p-6 sm:p-8 md:p-12">
        
        {/* Premium Spinner */}
        <div className="relative mb-4 flex justify-center items-center w-1/2 h-1/2">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-200 to-purple-200 opacity-20 blur-xl animate-pulse"></div>
          
          {/* Main spinner container */}
          <div className="relative w-full h-full">
            <div className="absolute inset-0 rounded-full border-4 border-gray-300 border-opacity-20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-300 border-r-purple-300 animate-spin"></div>
            <div className="absolute inset-[10%] rounded-full border-2 border-transparent border-b-cyan-300 border-l-pink-300 animate-spin" 
                 style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-1/6 h-1/6 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full animate-pulse shadow-lg opacity-60"></div>
            </div>
          </div>
        </div>

        {/* Premium Text */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 sm:w-2 sm:h-2 md:w-2 md:h-2 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full animate-bounce opacity-50"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-700 tracking-wide bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            يتم معالجة الطلب
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-500 font-medium">
            يرجى الانتظار قليلاً
          </p>
        </div>

        {/* Premium Progress Bar */}
        <div className="w-48 sm:w-64 md:w-80 mt-4 sm:mt-6">
          <div className="h-2 bg-gray-200 bg-opacity-30 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="h-full bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 rounded-full animate-pulse relative opacity-50">
              <div className="absolute inset-0 bg-white opacity-15 rounded-full animate-ping"></div>
            </div>
          </div>
        </div>

        {/* Brand/Logo area */}
        <div className="text-center mt-2 sm:mt-4">
          <div className="text-xs sm:text-sm text-gray-400 font-medium tracking-wider">
            DASM Platform
          </div>
        </div>
      </div>
    </div>
  );
}
