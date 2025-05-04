// ✅ ملف: app/dashboard/financing/page.tsx

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { BackToDashboard } from '@/components/dashboard/BackToDashboard';

const texts = {
  ar: {
    title: 'طلب تمويل سيارة',
    carType: 'نوع السيارة',
    estimatedPrice: 'السعر التقريبي (ريال)',
    financingRate: 'نسبة التمويل المطلوبة (%)',
    notes: 'ملاحظات إضافية',
    send: 'إرسال الطلب',
    hint: 'سيتم مراجعة طلبك خلال 24 ساعة.',
  },
  en: {
    title: 'Car Financing Request',
    carType: 'Car Type',
    estimatedPrice: 'Estimated Price (SAR)',
    financingRate: 'Requested Financing Rate (%)',
    notes: 'Additional Notes',
    send: 'Send Request',
    hint: 'Your request will be reviewed within 24 hours.',
  },
};

export default function FinancingPage() {
  const [lang] = useState<'ar' | 'en'>('ar');

  const t = texts[lang];

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <BackToDashboard />
      <h1 className="text-2xl font-bold mb-8 text-center">{t.title}</h1>

      <form className="max-w-lg mx-auto space-y-6">
        <div>
          <Label htmlFor="carType">{t.carType}</Label>
          <Input id="carType" placeholder={t.carType} required />
        </div>
        <div>
          <Label htmlFor="estimatedPrice">{t.estimatedPrice}</Label>
          <Input id="estimatedPrice" type="number" placeholder={t.estimatedPrice} required />
        </div>
        <div>
          <Label htmlFor="financingRate">{t.financingRate}</Label>
          <Input id="financingRate" type="number" placeholder={t.financingRate} required />
        </div>
        <div>
          <Label htmlFor="notes">{t.notes}</Label>
          <Textarea id="notes" placeholder={t.notes} rows={4} />
        </div>

        <Button type="submit" className="w-full">{t.send}</Button>

        <p className="text-center text-gray-500 text-sm mt-4">{t.hint}</p>
      </form>
    </main>
  );
}
