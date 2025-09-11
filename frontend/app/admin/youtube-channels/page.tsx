'use client';

import React, { useState, useEffect } from 'react';
import LoadingLink from "@/components/LoadingLink";

const MAIN_CHANNEL_ID = 'UCxiLyu5z-T0FanDNotwTJcg';

export default function YoutubeChannelManagementPage() {
  const [channelId, setChannelId] = useState(MAIN_CHANNEL_ID);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSuccessMessage(null);
      setError(null);
      
      // التحقق من تنسيق معرّف القناة
      if (!channelId.startsWith('UC') || channelId.length !== 24) {
        setError('تنسيق معرّف القناة غير صحيح. يجب أن يبدأ بـ UC ويتكون من 24 حرفًا');
        return;
      }
      
      // هنا في الإنتاج: إرسال طلب API لتحديث معرف القناة في قاعدة البيانات
      // محاكاة لنجاح العملية
      setSuccessMessage('تم حفظ معرف قناة البث بنجاح');
      
      // تحديث جميع المعارض (في الإنتاج)
    } catch (err) {
      setError('حدث خطأ أثناء حفظ معرف القناة');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 rtl">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">إدارة قناة البث المباشر</h1>
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <p className="mb-4">
            قم بإدارة قناة اليوتيوب الرئيسية التي سيتم عرضها في جميع المعارض. معرّف القناة هو الرمز الذي يبدأ بـ UC ويتكون من 24 حرفًا.
          </p>
          <p className="mb-4">
            يمكنك العثور على معرّف القناة بالذهاب إلى صفحة القناة على يوتيوب والنقر على &quot;حول&quot; ثم &quot;مشاركة القناة&quot; وستجد المعرّف في عنوان URL.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">قناة البث المباشر الرئيسية</h2>
          
          <div className="mb-4">
            <label htmlFor="channel-id" className="block text-sm font-medium text-gray-700 mb-1">
              معرّف قناة يوتيوب
            </label>
            <input
              type="text"
              id="channel-id"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل معرّف القناة"
              dir="ltr"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              حفظ التغييرات
            </button>
            
            {channelId && (
              <a 
                href={`https://www.youtube.com/channel/${channelId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
              >
                <span className="ml-1">فتح القناة في يوتيوب</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
        
        <div className="mt-8">
          <LoadingLink
            href="/"
            className="text-blue-600 hover:text-blue-800"
          >
            العودة إلى الصفحة الرئيسية
          </LoadingLink>
        </div>
      </div>
    </div>
  );
} 