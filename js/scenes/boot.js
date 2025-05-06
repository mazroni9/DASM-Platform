/**
 * مشهد التمهيد
 * أول مشهد يتم تحميله في اللعبة
 */
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    
    preload() {
        // تحميل ضروري للصور المستخدمة في شاشة التحميل
        this.load.image('logo', 'assets/images/logo.png');
        this.load.image('button', 'assets/images/button.png');
        this.load.image('button_hover', 'assets/images/button_hover.png');
    }
    
    create() {
        // ضبط إعدادات اللعبة
        this.initGameSettings();
        
        // الانتقال إلى مشهد التحميل
        this.scene.start('PreloadScene');
    }
    
    /**
     * تهيئة إعدادات اللعبة
     */
    initGameSettings() {
        // ضبط صوت اللعبة كله
        this.sound.setVolume(0.8);
        
        // ضبط فيزياء اللعبة
        this.matter.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.matter.world.setGravity(0, 0.5);
        
        // تحميل تقدم اللاعب المحفوظ
        loadGameProgress();
        
        // ضبط خيارات إضافية
        this.input.setDefaultCursor('default');
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        
        // ضبط خيارات للأجهزة المحمولة
        if (this.sys.game.device.os.android || this.sys.game.device.os.iOS) {
            this.setupMobileSettings();
        }
    }
    
    /**
     * ضبط إعدادات الأجهزة المحمولة
     */
    setupMobileSettings() {
        this.scale.scaleMode = Phaser.Scale.FIT;
        this.scale.fullscreenTarget = document.getElementById('game-container');
        
        // منع تحريك الصفحة عند لمس اللعبة
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('#game-container')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
} 