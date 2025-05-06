/**
 * لعبة المسامير والخشب
 * نسخة خالية من الاعلانات وبدون ابتزاز للاعبين
 * مستوحاة من لعبة لغز المسمار: خشب وصامولة
 */

// تكوين اللعبة
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#f4d2a6', // لون خلفية يشبه الخشب
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 0.8 },
            debug: false // اجعلها true للمساعدة في التطوير
        }
    },
    scene: [
        BootScene,
        PreloadScene,
        MainMenuScene,
        LevelSelectScene,
        GameplayScene,
        LevelCompleteScene
    ]
};

// متغيرات عامة للعبة
const gameData = {
    currentLevel: 1,
    totalLevels: 30,
    completedLevels: [],
    soundEnabled: true,
    musicEnabled: true,
    vibrationEnabled: true,
    // في إصدار لاحق يمكن إضافة المزيد من الخيارات
};

// حفظ تقدم اللاعب
function saveGameProgress() {
    localStorage.setItem('woodNutsPuzzle_progress', JSON.stringify({
        completedLevels: gameData.completedLevels,
        soundEnabled: gameData.soundEnabled,
        musicEnabled: gameData.musicEnabled,
        vibrationEnabled: gameData.vibrationEnabled
    }));
}

// استرجاع تقدم اللاعب
function loadGameProgress() {
    const savedData = localStorage.getItem('woodNutsPuzzle_progress');
    if (savedData) {
        const data = JSON.parse(savedData);
        gameData.completedLevels = data.completedLevels || [];
        gameData.soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
        gameData.musicEnabled = data.musicEnabled !== undefined ? data.musicEnabled : true;
        gameData.vibrationEnabled = data.vibrationEnabled !== undefined ? data.vibrationEnabled : true;
    }
}

// تهيئة اللعبة وبدء التشغيل
window.onload = function() {
    // تحميل تقدم اللاعب
    loadGameProgress();
    
    // إنشاء اللعبة
    const game = new Phaser.Game(config);
    
    // تعيين مرجع عام للعبة
    window.game = game;
}; 