'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Server, Play, Square, RefreshCw } from 'lucide-react';

interface OBSControllerProps {
  className?: string;
}

export default function OBSController({ className }: OBSControllerProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentVenue, setCurrentVenue] = useState('');
  const [sceneList, setSceneList] = useState<string[]>([]);
  const [currentScene, setCurrentScene] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // جلب حالة الاتصال الحالية عند تحميل المكون
  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  // جلب حالة الاتصال بـ OBS
  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch('/api/obs?action=status');
      const data = await response.json();
      
      if (response.ok) {
        setIsConnected(data.connected);
        setIsStreaming(data.streaming);
        setCurrentVenue(data.currentVenue);
        setSceneList(data.sceneList || []);
      } else {
        setError(data.error || 'حدث خطأ في جلب حالة الاتصال');
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم');
      console.error(err);
    }
  };

  // الاتصال بـ OBS
  const connectToOBS = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/obs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'connect' }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsConnected(true);
        setSceneList(data.sceneList || []);
        showSuccessMessage(data.message || 'تم الاتصال بنجاح');
      } else {
        setError(data.error || 'فشل الاتصال بـ OBS');
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // قطع الاتصال بـ OBS
  const disconnectFromOBS = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/obs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsConnected(false);
        setIsStreaming(false);
        setCurrentVenue('');
        setSceneList([]);
        showSuccessMessage(data.message || 'تم قطع الاتصال بنجاح');
      } else {
        setError(data.error || 'فشل قطع الاتصال بـ OBS');
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // بدء البث المباشر
  const startStreaming = async () => {
    if (!currentVenue) {
      setError('يرجى اختيار معرض قبل بدء البث');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/obs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'startStreaming' }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsStreaming(true);
        showSuccessMessage(data.message || 'تم بدء البث بنجاح');
      } else {
        setError(data.error || 'فشل بدء البث');
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // إيقاف البث المباشر
  const stopStreaming = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/obs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'stopStreaming' }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsStreaming(false);
        showSuccessMessage(data.message || 'تم إيقاف البث بنجاح');
      } else {
        setError(data.error || 'فشل إيقاف البث');
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // تغيير المشهد الحالي
  const switchScene = async (sceneName: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/obs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'switchScene', sceneName }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCurrentScene(sceneName);
        showSuccessMessage(data.message || `تم التبديل إلى المشهد: ${sceneName}`);
      } else {
        setError(data.error || 'فشل تغيير المشهد');
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // اختيار معرض للبث
  const selectVenue = async (venueId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/obs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'setVenue', venueId }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCurrentVenue(venueId);
        showSuccessMessage(data.message || `تم تحديد المعرض: ${venueId}`);
      } else {
        setError(data.error || 'فشل تحديد المعرض');
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // عرض رسالة نجاح مؤقتة
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <h2 className="text-xl font-bold mb-4">التحكم في OBS</h2>
      
      {/* عرض الأخطاء إن وجدت */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4 flex items-start">
          <AlertCircle className="text-red-500 mt-0.5 ml-2 flex-shrink-0 h-5 w-5" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {/* عرض رسالة النجاح إن وجدت */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-md mb-4">
          <p className="text-green-600 text-sm">{successMessage}</p>
        </div>
      )}
      
      {/* حالة الاتصال */}
      <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-md">
        <div className="flex items-center">
          <Server className={`h-5 w-5 ${isConnected ? 'text-green-500' : 'text-gray-400'} mr-2`} />
          <span className="text-sm font-medium">
            {isConnected ? 'متصل بـ OBS Studio' : 'غير متصل'}
          </span>
        </div>
        
        <button
          onClick={isConnected ? disconnectFromOBS : connectToOBS}
          disabled={isLoading}
          className={`px-3 py-1.5 rounded-md text-sm ${
            isConnected 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : isConnected ? (
            'قطع الاتصال'
          ) : (
            'الاتصال'
          )}
        </button>
      </div>
      
      {/* التحكم في البث */}
      {isConnected && (
        <div className="mb-6">
          <h3 className="text-md font-medium mb-2">التحكم في البث</h3>
          
          {/* اختيار المعرض */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المعرض الحالي
            </label>
            <select
              value={currentVenue}
              onChange={(e) => selectVenue(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isLoading || isStreaming}
            >
              <option value="">اختر معرض...</option>
              <option value="dasm-1">معرض dasm-1 - الدمام</option>
              <option value="dasm-2">معرض dasm-2 - الدمام</option>
              <option value="dasm-5">معرض dasm-5 - الدمام</option>
              <option value="dasm-11">معرض dasm-11 - الرياض</option>
              <option value="dasm-20">معرض dasm-20 - الرياض</option>
            </select>
          </div>
          
          {/* أزرار التحكم في البث */}
          <div className="flex space-x-3 rtl:space-x-reverse">
            <button
              onClick={startStreaming}
              disabled={isLoading || isStreaming || !currentVenue}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4 mr-2" />
              بدء البث
            </button>
            
            <button
              onClick={stopStreaming}
              disabled={isLoading || !isStreaming}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="h-4 w-4 mr-2" />
              إيقاف البث
            </button>
          </div>
        </div>
      )}
      
      {/* التحكم في المشاهد */}
      {isConnected && sceneList.length > 0 && (
        <div>
          <h3 className="text-md font-medium mb-2">المشاهد</h3>
          <div className="grid grid-cols-2 gap-2">
            {sceneList.map((scene) => (
              <button
                key={scene}
                onClick={() => switchScene(scene)}
                className={`p-2 text-sm rounded-md ${
                  currentScene === scene
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {scene}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 