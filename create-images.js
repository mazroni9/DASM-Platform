// سكربت لنسخ الصور من مجلدات أخرى إلى مجلد الحافلات والشاحنات
const fs = require('fs');
const path = require('path');

// إنشاء المجلد إذا لم يكن موجوداً
const targetDir = path.join('Frontend-local', 'public', 'auctionsPIC', 'car-busesTrucksPIC');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`تم إنشاء المجلد: ${targetDir}`);
}

// تعريف مصادر الصور والأسماء المستهدفة
const sourceImages = [
  // يمكن استخدام مسارات مختلفة حسب الصور المتوفرة
  path.join('Frontend-local', 'public', 'auctionsPIC', 'car-classicPIC', '1970 Plum Crazy Dodge Dart Swinger.jpg'),
  path.join('Frontend-local', 'public', 'auctionsPIC', 'car-classicPIC', '1969 Pontiac Grand Prix SJ.png'),
  path.join('Frontend-local', 'public', 'auctionsPIC', 'car-classicPIC', '1970 Plum Crazy Dodge Dart Swinger.jpg'),
  path.join('Frontend-local', 'public', 'auctionsPIC', 'car-classicPIC', '1969 Pontiac Grand Prix SJ.png'),
  path.join('Frontend-local', 'public', 'auctionsPIC', 'car-classicPIC', '1970 Plum Crazy Dodge Dart Swinger.jpg')
];

const targetImages = [
  path.join(targetDir, 'mercedes-actros-2019.jpg'),
  path.join(targetDir, 'mercedes-travego-2020.jpg'),
  path.join(targetDir, 'volvo-fh16-2021.jpg'),
  path.join(targetDir, 'hyundai-universe-2022.jpg'),
  path.join(targetDir, 'man-tgx-2020.jpg')
];

// نسخ الصور
let copiedCount = 0;
for (let i = 0; i < sourceImages.length; i++) {
  if (fs.existsSync(sourceImages[i])) {
    try {
      const data = fs.readFileSync(sourceImages[i]);
      fs.writeFileSync(targetImages[i], data);
      console.log(`تم نسخ: ${sourceImages[i]} إلى ${targetImages[i]}`);
      copiedCount++;
    } catch (err) {
      console.error(`خطأ في نسخ الصورة: ${sourceImages[i]}`, err);
    }
  } else {
    console.warn(`ملف المصدر غير موجود: ${sourceImages[i]}`);
  }
}

console.log(`تم نسخ ${copiedCount} صور بنجاح إلى ${targetDir}`); 