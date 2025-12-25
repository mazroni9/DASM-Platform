"use client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SubscriptionPlanFilters({ 
  searchTerm, 
  setSearchTerm, 
  userTypeFilter, 
  setUserTypeFilter, 
  activeFilter, 
  setActiveFilter 
}) {
  const userTypes = {
    bidder: 'مزايد',
    dealer: 'تاجر',
    auctioneer: 'مزاد',
    moderator: 'منسق',
    admin: 'مدير',
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border flex flex-col md:flex-row gap-4">
      <div className="relative flex-grow">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input
          type="text"
          placeholder="بحث باسم الخطة"
          className="pr-10 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        <select
          value={userTypeFilter}
          onChange={(e) => setUserTypeFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">كل أنواع المستخدمين</option>
          {Object.entries(userTypes).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">كل الحالات</option>
          <option value="active">مفعلة</option>
          <option value="inactive">معطلة</option>
        </select>
      </div>
    </div>
  );
}
