'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, RefreshCw } from 'lucide-react';

interface SpeechToTextProps {
  onTranscriptionChange: (text: string) => void;
  isActive: boolean;
}

export default function SpeechToText({ onTranscriptionChange, isActive }: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentText, setCurrentText] = useState('');
  const [isSupportedBrowser, setIsSupportedBrowser] = useState(true);
  
  // مرجع للتعرف على الصوت
  const recognitionRef = useRef<any>(null);
  
  // التحقق من دعم المتصفح لواجهة Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupportedBrowser(false);
      setError('متصفحك لا يدعم تحويل الصوت إلى نص');
      return;
    }
    
    // إنشاء كائن للتعرف على الصوت
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ar-SA'; // تحديد اللغة العربية
    
    // معالجة نتائج التعرف على الصوت
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // دمج النص النهائي والنص المؤقت
      const transcriptText = finalTranscript || interimTranscript;
      
      // تحديث النص الحالي
      setCurrentText(transcriptText);
      
      // إرسال النص إلى المكون الأب
      if (transcriptText.trim()) {
        onTranscriptionChange(transcriptText);
      }
    };
    
    // معالجة الأخطاء
    recognition.onerror = (event: any) => {
      console.error('خطأ في التعرف على الصوت:', event.error);
      setError(`خطأ: ${event.error}`);
      setIsListening(false);
    };
    
    // معالجة انتهاء جلسة التعرف
    recognition.onend = () => {
      // إعادة تشغيل التعرف إذا كان التشغيل مفعل
      if (isListening) {
        recognition.start();
      } else {
        setIsListening(false);
      }
    };
    
    // حفظ مرجع التعرف على الصوت
    recognitionRef.current = recognition;
    
    // إيقاف التعرف عند إزالة المكون
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscriptionChange, isListening]);
  
  // تبديل حالة الاستماع
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // تجربة بدء التعرف على الصوت
      try {
        recognitionRef.current.start();
        setError(null);
      } catch (err) {
        console.error('خطأ في بدء التعرف على الصوت:', err);
        setError('خطأ في بدء تسجيل الصوت');
      }
    }
    
    setIsListening(!isListening);
  };
  
  // مسح النص الحالي
  const clearText = () => {
    setCurrentText('');
    onTranscriptionChange('');
  };
  
  // التعطيل إذا كان المزاد غير نشط
  useEffect(() => {
    if (!isActive && isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [isActive, isListening]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-blue-600 text-white">
        <h2 className="text-xl font-bold">تحويل الصوت إلى نص</h2>
      </div>
      
      <div className="p-4">
        {!isSupportedBrowser ? (
          <div className="p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded mb-4">
            {error}
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
                <button
                  onClick={toggleListening}
                  disabled={!isActive}
                  className={`p-3 rounded-full ${
                    isListening 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : isActive 
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  aria-label={isListening ? 'إيقاف التسجيل' : 'بدء التسجيل'}
                >
                  {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>
                
                <button
                  onClick={clearText}
                  disabled={!currentText}
                  className={`p-3 rounded-full ${
                    currentText
                      ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  aria-label="مسح النص"
                >
                  <RefreshCw className="h-6 w-6" />
                </button>
              </div>
              
              <div className="relative">
                <div className="border border-gray-300 rounded-lg p-3 min-h-[100px] bg-gray-50">
                  {currentText || <span className="text-gray-400">النص المحول من الصوت سيظهر هنا...</span>}
                </div>
                
                {isListening && (
                  <div className="absolute bottom-2 right-2 flex space-x-1 rtl:space-x-reverse">
                    <span className="h-2 w-2 bg-red-600 rounded-full animate-bounce"></span>
                    <span className="h-2 w-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="h-2 w-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                )}
              </div>
              
              {isListening && (
                <p className="text-xs text-gray-500 text-center">
                  يتم تسجيل الصوت وتحويله... انقر على زر الميكروفون للإيقاف
                </p>
              )}
              
              {!isActive && (
                <p className="text-xs text-yellow-500 text-center">
                  يجب أن يكون المزاد نشطاً لتفعيل تحويل الصوت إلى نص
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 