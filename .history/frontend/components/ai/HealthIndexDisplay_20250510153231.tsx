'use client';

import React, { useEffect, useState } from 'react';
import { 
  Car,
  Activity, 
  AlertCircle, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Tool,
  Zap
} from 'lucide-react';
import { CarHealthReport } from '@/lib/ai/services/carAnalysisService';

interface HealthIndexDisplayProps {
  carId: number;
  initialReport?: CarHealthReport;
  showDetails?: boolean;
  isLoading?: boolean;
  onAnalysisComplete?: (report: CarHealthReport) => void;
}

/**
 * مكون عرض مؤشر صحة السيارة
 * يعرض تقريرًا مرئيًا عن حالة السيارة وصحتها
 */
export default function HealthIndexDisplay({ 
  carId, 
  initialReport, 
  showDetails = true,
  isLoading: externalLoading = false,
  onAnalysisComplete
}: HealthIndexDisplayProps) {
  const [report, setReport] = useState<CarHealthReport | null>(initialReport || null);
  const [isLoading, setIsLoading] = useState<boolean>(externalLoading || !initialReport);
  const [error, setError] = useState<string | null>(null);

  // تحميل تقرير الصحة عند عدم توفره
  useEffect(() => {
    async function loadHealthReport() {
      if (!initialReport && !externalLoading) {
        try {
          setIsLoading(true);
          setError(null);

          // محاكاة طلب API - سيتم استبداله بالطلب الحقيقي عند التكامل
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // بيانات تجريبية
          const mockReport: CarHealthReport = {
            carId,
            overallHealthScore: 85,
            healthIndex: {
              exterior: 90,
              engine: 85,
              interior: 88,
              suspension: 80,
              electronics: 83
            },
            estimatedLifeExpectancy: {
              years: 7,
              kilometers: 120000
            },
            detectedIssues: [
              {
                component: 'هيكل السيارة',
                issue: 'خدوش سطحية',
                severity: 'low',
                estimatedRepairCost: 500
              },
              {
                component: 'نظام التعليق',
                issue: 'تآكل في المساعدات الخلفية',
                severity: 'medium',
                estimatedRepairCost: 1200
              }
            ],
            recommendedChecks: [
              'فحص حالة الإطارات',
              'فحص نظام التعليق الخلفي',
              'فحص وضع محاذاة العجلات'
            ],
            confidenceScore: 0.87
          };
          
          setReport(mockReport);
          
          if (onAnalysisComplete) {
            onAnalysisComplete(mockReport);
          }
        } catch (err) {
          setError('حدث خطأ أثناء تحليل حالة السيارة');
          console.error('Failed to fetch health report:', err);
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    loadHealthReport();
  }, [carId, initialReport, externalLoading, onAnalysisComplete]);

  // عرض حالة التحميل
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-40 bg-gray-200 rounded mr-3"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded mb-3 w-full"></div>
        <div className="h-32 bg-gray-200 rounded mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  // عرض حالة الخطأ
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-red-200">
        <div className="flex items-center text-red-500 mb-2">
          <AlertCircle className="h-5 w-5 ml-2" />
          <h3 className="font-semibold">خطأ في التحليل</h3>
        </div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  // عرض حالة عدم وجود تقرير
  if (!report) {
    return null;
  }

  // تحديد لون مؤشر الصحة الإجمالي
  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-teal-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  // تحديد فئة حالة السيارة
  const getConditionCategory = (score: number) => {
    if (score >= 85) return 'ممتازة';
    if (score >= 70) return 'جيدة';
    if (score >= 50) return 'متوسطة';
    return 'ضعيفة';
  };

  // تحديد لون شريط التقدم
  const getProgressColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-teal-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // مؤشر شدة المشكلة
  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    const styles = {
      low: 'bg-yellow-100 text-yellow-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية'
    };
    
    return (
      <span className={`${styles[severity]} text-xs px-2 py-0.5 rounded-full`}>
        {labels[severity]}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* رأس المكون */}
      <div className="p-4 bg-blue-50 border-b border-blue-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-blue-500 ml-2" />
            <h3 className="text-lg font-semibold text-gray-800">تحليل حالة السيارة</h3>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 ml-1">دقة التحليل</span>
            <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {Math.round(report.confidenceScore * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* مؤشر الصحة الإجمالي */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">الحالة العامة للسيارة</div>
            <div className="flex items-center">
              <span className={`text-3xl font-bold ${getHealthColor(report.overallHealthScore)}`}>
                {report.overallHealthScore}
              </span>
              <span className="text-lg text-gray-400 mr-1">/100</span>
              <span className="mr-2 text-sm font-medium text-gray-600">
                ({getConditionCategory(report.overallHealthScore)})
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-sm text-gray-500 mb-1">العمر المتوقع المتبقي</div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 ml-1" />
              <span className="font-semibold">{report.estimatedLifeExpectancy.years} سنوات</span>
              <span className="mx-1 text-gray-400">|</span>
              <span className="font-semibold">{report.estimatedLifeExpectancy.kilometers.toLocaleString()} كم</span>
            </div>
          </div>
        </div>

        {/* مؤشرات الحالة التفصيلية */}
        {showDetails && (
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>الهيكل الخارجي</span>
                <span className="font-medium">{report.healthIndex.exterior}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(report.healthIndex.exterior)}`} 
                  style={{ width: `${report.healthIndex.exterior}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>المحرك</span>
                <span className="font-medium">{report.healthIndex.engine}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(report.healthIndex.engine)}`} 
                  style={{ width: `${report.healthIndex.engine}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>المقصورة الداخلية</span>
                <span className="font-medium">{report.healthIndex.interior}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(report.healthIndex.interior)}`} 
                  style={{ width: `${report.healthIndex.interior}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>نظام التعليق</span>
                <span className="font-medium">{report.healthIndex.suspension}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(report.healthIndex.suspension)}`} 
                  style={{ width: `${report.healthIndex.suspension}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>الإلكترونيات</span>
                <span className="font-medium">{report.healthIndex.electronics}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(report.healthIndex.electronics)}`} 
                  style={{ width: `${report.healthIndex.electronics}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* عرض المشاكل المكتشفة */}
        {showDetails && report.detectedIssues.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 ml-1 text-orange-500" />
              المشاكل المكتشفة
            </h4>
            <ul className="space-y-2">
              {report.detectedIssues.map((issue, index) => (
                <li key={index} className="bg-gray-50 p-2 rounded flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium">{issue.component}:</span>
                    <span className="text-sm text-gray-600 mr-1">{issue.issue}</span>
                  </div>
                  <div className="flex items-center">
                    {issue.estimatedRepairCost && (
                      <span className="text-xs text-gray-500 ml-2">
                        ~{issue.estimatedRepairCost} ريال
                      </span>
                    )}
                    {getSeverityBadge(issue.severity)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* التوصيات */}
        {showDetails && report.recommendedChecks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Tool className="h-4 w-4 ml-1 text-blue-500" />
              الفحوصات الموصى بها
            </h4>
            <ul className="bg-blue-50 rounded p-2">
              {report.recommendedChecks.map((check, index) => (
                <li key={index} className="text-sm mb-1 flex items-start">
                  <CheckCircle className="h-4 w-4 ml-1 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* شعار الذكاء الاصطناعي */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <div className="flex items-center text-xs text-gray-400">
            <Zap className="h-3 w-3 ml-1" />
            تم التحليل بواسطة الذكاء الاصطناعي
          </div>
        </div>
      </div>
    </div>
  );
} 