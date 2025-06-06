'use client';

import Link from 'next/link';
import { Stethoscope, Printer, Server } from 'lucide-react';

export default function AuctionsQualityPage() {
  // مزادات المجلد الثالث: auctions-quality
  const auctionsQuality = [
    { 
      name: 'الأجهزة الطبية المستعملة', 
      slug: 'medical', 
      description: 'أجهزة ومعدات طبية مستعملة بحالة جيدة', 
      icon: Stethoscope, 
      color: 'text-teal-600', 
      bgColor: 'bg-teal-50',
      hoverBgColor: 'bg-teal-100'
    },
    { 
      name: 'الآلات المكتبية المستعملة', 
      slug: 'office-equipment', 
      description: 'معدات مكتبية مثل آلات تصوير متوسطة وكبيرة الحجم وأجهزة إلكترونية بأسعار تنافسية', 
      icon: Printer, 
      color: 'text-teal-600', 
      bgColor: 'bg-teal-50',
      hoverBgColor: 'bg-teal-100'
    },
    { 
      name: 'السيرفرات المستعملة', 
      slug: 'used-servers', 
      description: 'سيرفرات وأجهزة تخزين وشبكات بمواصفات جيدة', 
      icon: Server, 
      color: 'text-teal-600', 
      bgColor: 'bg-teal-50',
      hoverBgColor: 'bg-teal-100'
    }
  ];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center mb-8">
        <h1 className="text-3xl font-bold text-teal-700">السوق النوعي</h1>
      </div>
      
      <div className="mb-8 text-center">
        <p className="text-gray-600">استكشف المزادات الخاصة والمتخصصة في مجالات متعددة مثل الأجهزة الطبية والمعدات المكتبية والسيرفرات.</p>
        <div className="mt-4">
          <Link 
            href="/auctions"
            className="inline-flex items-center px-4 py-2 text-teal-600 hover:text-teal-800 font-medium"
          >
            <span className="ml-2">العودة لجميع المزادات</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctionsQuality.map((auction) => {
          const Icon = auction.icon;
          return (
            <Link
              key={auction.slug}
              href={`/auctions/auctions-3quality/${auction.slug}`}
              className={`group flex flex-col items-center border rounded-xl shadow hover:shadow-lg p-8 ${auction.bgColor} hover:${auction.hoverBgColor} transition-all duration-300 h-full transform hover:-translate-y-1`}
            >
              <div className={`p-4 rounded-full ${auction.color} bg-white mb-4`}>
                <Icon size={32} />
              </div>
              <h3 className={`text-2xl font-bold ${auction.color} mb-3 text-center`}>{auction.name}</h3>
              <p className="text-gray-600 text-center mb-6 flex-grow">{auction.description}</p>
              <div className="mt-auto">
                <span className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-full bg-white/80 group-hover:bg-teal-600 text-gray-700 group-hover:text-white transition-colors duration-300`}>
                  اضغط للدخول
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
} 