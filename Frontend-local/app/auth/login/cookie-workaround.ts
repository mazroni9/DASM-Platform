// حل بديل لمكتبة js-cookie في حال فشل تثبيتها
export const CookiesWorkaround = {
  set: (name: string, value: string, options: { expires?: number } = {}) => {
    if (typeof window === 'undefined') return;
    
    try {
      // استخدام localStorage بدلاً من الكوكيز
      localStorage.setItem(name, value);
      
      // تخزين وقت انتهاء الصلاحية إذا كان محدداً
      if (options.expires) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + options.expires);
        localStorage.setItem(`${name}_expires`, expiryDate.toISOString());
      }
    } catch (err) {
      console.error('فشل تخزين القيمة في localStorage', err);
    }
  },
  
  get: (name: string) => {
    if (typeof window === 'undefined') return null;
    
    try {
      // التحقق من انتهاء الصلاحية
      const expiryStr = localStorage.getItem(`${name}_expires`);
      if (expiryStr) {
        const expiryDate = new Date(expiryStr);
        if (expiryDate < new Date()) {
          // القيمة منتهية الصلاحية
          localStorage.removeItem(name);
          localStorage.removeItem(`${name}_expires`);
          return null;
        }
      }
      
      return localStorage.getItem(name);
    } catch (err) {
      console.error('فشل قراءة القيمة من localStorage', err);
      return null;
    }
  },
  
  remove: (name: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(name);
      localStorage.removeItem(`${name}_expires`);
    } catch (err) {
      console.error('فشل حذف القيمة من localStorage', err);
    }
  }
}; 