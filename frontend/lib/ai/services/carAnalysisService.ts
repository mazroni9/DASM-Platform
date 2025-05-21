/**
 * خدمة تحليل السيارة
 * توفر وظائف لتحليل وتقييم السيارات باستخدام الذكاء الاصطناعي
 */

import axios from 'axios';
import { imageService, ImageAnalysisResult } from './imageService';

// واجهة تقرير صحة السيارة
export interface CarHealthReport {
  carId: number;
  overallHealthScore: number; // 0-100
  healthIndex: {
    exterior: number; // 0-100
    engine: number; // 0-100
    interior: number; // 0-100
    suspension: number; // 0-100
    electronics: number; // 0-100
  };
  estimatedLifeExpectancy: {
    years: number;
    kilometers: number;
  };
  detectedIssues: Array<{
    component: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    estimatedRepairCost?: number;
  }>;
  recommendedChecks: string[];
  confidenceScore: number; // 0-1
}

// واجهة تقييم قيمة السيارة
export interface CarValueAssessment {
  carId: number;
  estimatedMarketValue: number;
  priceRange: {
    min: number;
    max: number;
  };
  comparisonFactors: {
    make: string;
    model: string;
    year: number;
    condition: string;
    mileage: number;
    region: string;
  };
  marketTrend: 'rising' | 'stable' | 'falling';
  similarCars: Array<{
    id: number;
    price: number;
    soldDate?: string;
    condition: string;
    mileage: number;
  }>;
  valueScore: number; // 0-100, نسبة القيمة مقابل السعر
  confidenceScore: number; // 0-1
}

/**
 * خدمة تحليل السيارة
 */
class CarAnalysisService {
  private readonly apiUrl: string;

  constructor() {
    // استخدام الـ URL من متغيرات البيئة أو URL افتراضي
    this.apiUrl = process.env.NEXT_PUBLIC_AI_CAR_API_URL || '/api/ai/car';
  }

  /**
   * تحليل صحة السيارة
   * @param carId معرف السيارة
   * @param includeImageAnalysis هل يتم تضمين تحليل الصور
   * @returns تقرير صحة السيارة
   */
  async analyzeCarHealth(carId: number, includeImageAnalysis = true): Promise<CarHealthReport> {
    try {
      // في بيئة التطوير، نستخدم بيانات وهمية
      if (process.env.NODE_ENV === 'development') {
        // محاكاة زمن المعالجة
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // بيانات وهمية للتجربة
        const healthReport: CarHealthReport = {
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

        // إذا تم طلب تحليل الصور
        if (includeImageAnalysis) {
          // محاكاة تحليل الصور
          const carDetails = await this.getCarDetails(carId);
          if (carDetails && carDetails.images && carDetails.images.length > 0) {
            // تحليل الصورة الأولى فقط للتبسيط
            const imageAnalysis = await imageService.analyzeImage(carDetails.images[0]);
            
            // دمج نتائج تحليل الصور مع التقرير
            healthReport.overallHealthScore = Math.round(
              (healthReport.overallHealthScore + 
              this.convertConditionToScore(imageAnalysis.overallCondition)) / 2
            );
            
            // إضافة المشاكل المكتشفة من الصور
            for (const [part, details] of Object.entries(imageAnalysis.carParts)) {
              details.detectedIssues.forEach(issue => {
                healthReport.detectedIssues.push({
                  component: this.translateCarPart(part),
                  issue: this.translateIssueType(issue.type),
                  severity: this.convertSeverityToCategory(issue.severity),
                });
              });
            }
          }
        }
        
        return healthReport;
      }

      // في بيئة الإنتاج، استخدام API حقيقي
      const response = await axios.get(`${this.apiUrl}/health/${carId}`, {
        params: { includeImageAnalysis }
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing car health:', error);
      throw new Error('فشل في تحليل صحة السيارة');
    }
  }

  /**
   * تقييم قيمة السيارة في السوق
   * @param carId معرف السيارة
   * @returns تقييم قيمة السيارة
   */
  async assessCarValue(carId: number): Promise<CarValueAssessment> {
    try {
      // في بيئة التطوير، نستخدم بيانات وهمية
      if (process.env.NODE_ENV === 'development') {
        // محاكاة زمن المعالجة
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // الحصول على تفاصيل السيارة
        const carDetails = await this.getCarDetails(carId);
        
        // بيانات وهمية للتجربة
        return {
          carId,
          estimatedMarketValue: 85000,
          priceRange: {
            min: 80000,
            max: 92000
          },
          comparisonFactors: {
            make: carDetails?.make || 'تويوتا',
            model: carDetails?.model || 'كامري',
            year: carDetails?.year || 2020,
            condition: 'جيدة',
            mileage: carDetails?.mileage || 50000,
            region: 'الرياض'
          },
          marketTrend: 'stable',
          similarCars: [
            {
              id: 1001,
              price: 83000,
              soldDate: '2023-09-15',
              condition: 'جيدة',
              mileage: 55000
            },
            {
              id: 1002,
              price: 88000,
              soldDate: '2023-10-02',
              condition: 'ممتازة',
              mileage: 40000
            },
            {
              id: 1003,
              price: 81000,
              soldDate: '2023-09-28',
              condition: 'جيدة',
              mileage: 58000
            }
          ],
          valueScore: 87, // قيمة جيدة مقابل السعر
          confidenceScore: 0.85
        };
      }

      // في بيئة الإنتاج، استخدام API حقيقي
      const response = await axios.get(`${this.apiUrl}/value/${carId}`);
      return response.data;
    } catch (error) {
      console.error('Error assessing car value:', error);
      throw new Error('فشل في تقييم قيمة السيارة');
    }
  }

  /**
   * كشف القيمة الخفية للسيارة
   * @param carId معرف السيارة
   * @returns نسبة القيمة الخفية (أعلى من 1 تعني قيمة أعلى من السعر)
   */
  async detectHiddenValue(carId: number): Promise<{valueRatio: number, reasons: string[]}> {
    try {
      const valueAssessment = await this.assessCarValue(carId);
      const carDetails = await this.getCarDetails(carId);
      
      if (!carDetails) {
        throw new Error('لم يتم العثور على تفاصيل السيارة');
      }
      
      // نسبة القيمة السوقية إلى السعر الحالي
      const currentPrice = carDetails.current_price || carDetails.min_price;
      const valueRatio = valueAssessment.estimatedMarketValue / currentPrice;
      
      // أسباب القيمة الخفية
      const reasons: string[] = [];
      
      if (valueRatio > 1.15) {
        reasons.push('السعر الحالي أقل بكثير من القيمة السوقية المقدرة');
      }
      
      if (valueAssessment.marketTrend === 'rising') {
        reasons.push('سوق هذا النوع من السيارات في ارتفاع');
      }
      
      // مقارنة كيلومترات السيارة مع المتوسط
      const avgMileage = valueAssessment.similarCars.reduce((sum, car) => sum + car.mileage, 0) / 
                        valueAssessment.similarCars.length;
      
      if (carDetails.mileage < avgMileage * 0.8) {
        reasons.push('عداد الكيلومترات أقل بكثير من المتوسط');
      }
      
      return {
        valueRatio,
        reasons: reasons.length > 0 ? reasons : ['لا توجد قيمة خفية ملحوظة']
      };
    } catch (error) {
      console.error('Error detecting hidden value:', error);
      throw new Error('فشل في كشف القيمة الخفية');
    }
  }

  // ============== وظائف مساعدة ==============

  /**
   * الحصول على تفاصيل السيارة
   * @param carId معرف السيارة
   * @returns تفاصيل السيارة
   */
  private async getCarDetails(carId: number): Promise<any> {
    try {
      // في بيئة التطوير، نستخدم بيانات وهمية
      if (process.env.NODE_ENV === 'development') {
        return {
          id: carId,
          title: 'تويوتا كامري 2020',
          make: 'تويوتا',
          model: 'كامري',
          year: 2020,
          mileage: 50000,
          color: 'أبيض',
          condition: 'جيدة',
          min_price: 75000,
          max_price: 95000,
          current_price: 82000,
          images: [
            'https://example.com/images/toyota-camry-2020-1.jpg',
            'https://example.com/images/toyota-camry-2020-2.jpg'
          ]
        };
      }

      // في بيئة الإنتاج، استخدام API حقيقي
      const response = await axios.get(`/api/cars/${carId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching car details:', error);
      return null;
    }
  }

  /**
   * تحويل حالة السيارة إلى درجة
   * @param condition حالة السيارة
   * @returns درجة من 0 إلى 100
   */
  private convertConditionToScore(condition: 'excellent' | 'good' | 'fair' | 'poor'): number {
    const conditionMap: Record<string, number> = {
      'excellent': 95,
      'good': 80,
      'fair': 60,
      'poor': 40
    };
    return conditionMap[condition] || 50;
  }

  /**
   * ترجمة جزء السيارة إلى العربية
   * @param part جزء السيارة بالإنجليزية
   * @returns جزء السيارة بالعربية
   */
  private translateCarPart(part: string): string {
    const partMap: Record<string, string> = {
      'body': 'هيكل السيارة',
      'wheels': 'العجلات',
      'headlights': 'المصابيح الأمامية',
      'taillights': 'المصابيح الخلفية',
      'bumper': 'المصد',
      'hood': 'غطاء المحرك',
      'door': 'الباب',
      'mirror': 'المرآة',
      'window': 'النافذة'
    };
    return partMap[part] || part;
  }

  /**
   * ترجمة نوع المشكلة إلى العربية
   * @param issueType نوع المشكلة بالإنجليزية
   * @returns نوع المشكلة بالعربية
   */
  private translateIssueType(issueType: string): string {
    const issueMap: Record<string, string> = {
      'scratch': 'خدش',
      'dent': 'صدمة',
      'rust': 'صدأ',
      'crack': 'تشقق',
      'missing': 'جزء مفقود',
      'worn': 'تآكل',
      'faded': 'بهتان اللون'
    };
    return issueMap[issueType] || issueType;
  }

  /**
   * تحويل شدة المشكلة إلى فئة
   * @param severity شدة المشكلة من 0 إلى 1
   * @returns فئة الشدة
   */
  private convertSeverityToCategory(severity: number): 'low' | 'medium' | 'high' {
    if (severity < 0.3) return 'low';
    if (severity < 0.7) return 'medium';
    return 'high';
  }
}

export const carAnalysisService = new CarAnalysisService();
export default carAnalysisService; 