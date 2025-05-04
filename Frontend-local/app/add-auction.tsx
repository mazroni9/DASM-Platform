
'use client';

import React, { useState } from 'react';

export default function AddAuction() {
  const [formData, setFormData] = useState({
    carName: '',
    make: '',
    model: '',
    year: '',
    vinNumber: '',
    mileage: '',
    color: '',
    fuelType: '',
    condition: '',
    minSellerPrice: '',
    maxSellerPrice: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [pdf, setPdf] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdf(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    console.log('Images:', images);
    console.log('PDF:', pdf);
    alert('تم إرسال البيانات بنجاح (نموذج تجريبي)');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-lg mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">إضافة سيارة للمزاد</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(formData).map((key) => (
          <div key={key} className="flex flex-col">
            <label className="text-sm font-semibold mb-1">{key}</label>
            <input
              type="text"
              name={key}
              value={(formData as any)[key]}
              onChange={handleChange}
              className="border rounded px-3 py-2"
              required
            />
          </div>
        ))}

        <div className="col-span-2">
          <label className="block text-sm font-semibold mb-1">صور السيارة (يمكن رفع أكثر من صورة):</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="block w-full text-sm border p-2"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-semibold mb-1">تقرير فحص السيارة (PDF):</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handlePdfChange}
            className="block w-full text-sm border p-2"
          />
        </div>

        <div className="col-span-2 flex justify-center mt-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700">
            إرسال البيانات
          </button>
        </div>
      </form>
    </div>
  );
}
