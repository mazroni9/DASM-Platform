/**
 * تعريف مستويات اللعبة
 * كل مستوى يحتوي على:
 * - تكوين قطع الخشب
 * - مواقع البراغي والصواميل
 * - الاتجاه المطلوب للحل
 */

const LEVELS = [
    // المستوى الأول: مقدمة بسيطة
    {
        id: 1,
        name: "البداية السهلة",
        difficulty: 1,
        woodBlocks: [
            { x: 400, y: 300, width: 200, height: 40, type: 'rectangle', rotation: 0, movable: true }
        ],
        screws: [
            { x: 350, y: 300, rotation: 0, depth: 30, removable: true }
        ],
        nuts: [
            { x: 450, y: 300, type: 'hexagon', size: 20, removable: true }
        ],
        hint: "قم بفك المسمار والصامولة لإزالة قطعة الخشب",
        targetDirection: 'up', // الاتجاه المطلوب للسحب
        timeLimit: 60, // الوقت بالثواني
        starCriteria: [45, 30, 20] // الأوقات المطلوبة للحصول على 1 و 2 و 3 نجوم
    },
    
    // المستوى الثاني: زيادة صغيرة في التعقيد
    {
        id: 2,
        name: "دورة مزدوجة",
        difficulty: 1,
        woodBlocks: [
            { x: 300, y: 300, width: 150, height: 40, type: 'rectangle', rotation: 0, movable: true },
            { x: 500, y: 300, width: 150, height: 40, type: 'rectangle', rotation: 0, movable: true }
        ],
        screws: [
            { x: 250, y: 300, rotation: 0, depth: 30, removable: true },
            { x: 350, y: 300, rotation: 0, depth: 30, removable: true },
            { x: 450, y: 300, rotation: 0, depth: 30, removable: true },
            { x: 550, y: 300, rotation: 0, depth: 30, removable: true }
        ],
        nuts: [
            { x: 250, y: 330, type: 'hexagon', size: 20, removable: true },
            { x: 550, y: 330, type: 'hexagon', size: 20, removable: true }
        ],
        hint: "قم بفك البراغي والصواميل بالترتيب الصحيح",
        targetDirection: 'right',
        timeLimit: 90,
        starCriteria: [70, 50, 35]
    },
    
    // المستوى الثالث: تعقيد أكبر وتركيب مختلف
    {
        id: 3,
        name: "المربع المغلق",
        difficulty: 2,
        woodBlocks: [
            { x: 300, y: 250, width: 200, height: 40, type: 'rectangle', rotation: 0, movable: true },
            { x: 300, y: 350, width: 200, height: 40, type: 'rectangle', rotation: 0, movable: true },
            { x: 220, y: 300, width: 140, height: 40, type: 'rectangle', rotation: 90, movable: false },
            { x: 380, y: 300, width: 140, height: 40, type: 'rectangle', rotation: 90, movable: true }
        ],
        screws: [
            { x: 220, y: 250, rotation: 0, depth: 30, removable: true },
            { x: 380, y: 250, rotation: 0, depth: 30, removable: true },
            { x: 220, y: 350, rotation: 0, depth: 30, removable: true },
            { x: 380, y: 350, rotation: 0, depth: 30, removable: true }
        ],
        nuts: [
            { x: 220, y: 280, type: 'hexagon', size: 20, removable: true },
            { x: 380, y: 280, type: 'hexagon', size: 20, removable: true },
            { x: 220, y: 380, type: 'hexagon', size: 20, removable: true },
            { x: 380, y: 380, type: 'hexagon', size: 20, removable: true }
        ],
        hint: "افتح المربع بفك المسامير بالترتيب الصحيح",
        targetDirection: 'left',
        timeLimit: 120,
        starCriteria: [100, 80, 60]
    },
    
    // هنا يمكنك إضافة المزيد من المستويات بنفس النمط
    // ...
];

// دالة للحصول على مستوى معين
function getLevel(levelId) {
    return LEVELS.find(level => level.id === levelId) || LEVELS[0];
}

// دالة للحصول على إجمالي عدد المستويات
function getTotalLevels() {
    return LEVELS.length;
} 