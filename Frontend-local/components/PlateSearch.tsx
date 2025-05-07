/**
 * 🧩 PlateSearch
 * 📁 المسار: Frontend-local/components/PlateSearch.tsx
 *
 * ✅ الوظيفة:
 * - البحث عن لوحات المركبات في المزادات
 */

'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface PlateSearchProps {
  onSearch?: (searchTerm: string) => void;
}

export default function PlateSearch({ onSearch = () => {} }: PlateSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md mx-auto">
      <input
        type="text"
        placeholder="ابحث عن رقم اللوحة..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full py-2 px-4 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button 
        type="submit"
        className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
      >
        <Search size={20} />
      </button>
    </form>
  );
} 