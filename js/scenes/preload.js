/**
 * مشهد تحميل الموارد
 * يقوم بتحميل جميع الصور والأصوات اللازمة للعبة
 */
class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }
    
    preload() {
        // إنشاء شريط التحميل
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        // نص التحميل
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'جار التحميل...', {
            fontFamily: 'Cairo, Arial',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        const percentText = this.add.text(width / 2, height / 2, '0%', {
            fontFamily: 'Cairo, Arial',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // تحديث شريط التحميل
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x9AD98D, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
            percentText.setText(parseInt(value * 100) + '%');
        });
        
        // عند الانتهاء من التحميل
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });
        
        // تحميل الصور
        this.loadImages();
        
        // تحميل الأصوات
        this.loadSounds();
        
        // تحميل الخطوط
        this.loadFonts();
    }
    
    loadImages() {
        // صور عامة
        this.load.image('background', 'assets/images/background.png');
        this.load.image('logo', 'assets/images/logo.png');
        this.load.image('star', 'assets/images/star.png');
        this.load.image('star_empty', 'assets/images/star_empty.png');
        
        // أزرار
        this.load.image('button', 'assets/images/button.png');
        this.load.image('button_hover', 'assets/images/button_hover.png');
        this.load.image('settings_icon', 'assets/images/settings_icon.png');
        this.load.image('home_icon', 'assets/images/home_icon.png');
        
        // عناصر اللعبة
        this.load.image('wood_texture', 'assets/images/wood_texture.png');
        this.load.image('screw_head', 'assets/images/screw_head.png');
        this.load.image('screw_body', 'assets/images/screw_body.png');
        this.load.image('nut_hexagon', 'assets/images/nut_hexagon.png');
        this.load.image('nut_square', 'assets/images/nut_square.png');
        this.load.image('nut_wing', 'assets/images/nut_wing.png');
        this.load.image('highlight_effect', 'assets/images/highlight_effect.png');
        
        // ايقونات المستويات
        this.load.image('level_locked', 'assets/images/level_locked.png');
        this.load.image('level_unlocked', 'assets/images/level_unlocked.png');
        this.load.image('level_completed', 'assets/images/level_completed.png');
    }
    
    loadSounds() {
        // أصوات الواجهة
        this.load.audio('click', 'assets/sounds/click.mp3');
        this.load.audio('success', 'assets/sounds/success.mp3');
        this.load.audio('fail', 'assets/sounds/fail.mp3');
        this.load.audio('level_complete', 'assets/sounds/level_complete.mp3');
        
        // أصوات اللعبة
        this.load.audio('screw_turn', 'assets/sounds/screw_turn.mp3');
        this.load.audio('screw_start', 'assets/sounds/screw_start.mp3');
        this.load.audio('screw_remove', 'assets/sounds/screw_remove.mp3');
        this.load.audio('screw_tap', 'assets/sounds/screw_tap.mp3');
        this.load.audio('screw_loose', 'assets/sounds/screw_loose.mp3');
        
        this.load.audio('nut_turn', 'assets/sounds/nut_turn.mp3');
        this.load.audio('nut_start', 'assets/sounds/nut_start.mp3');
        this.load.audio('nut_remove', 'assets/sounds/nut_remove.mp3');
        this.load.audio('nut_tap', 'assets/sounds/nut_tap.mp3');
        
        this.load.audio('wood_pickup', 'assets/sounds/wood_pickup.mp3');
        this.load.audio('wood_drop', 'assets/sounds/wood_drop.mp3');
        this.load.audio('wood_unlock', 'assets/sounds/wood_unlock.mp3');
        this.load.audio('wood_locked', 'assets/sounds/wood_locked.mp3');
        
        // موسيقى الخلفية
        this.load.audio('theme_music', 'assets/sounds/theme_music.mp3');
    }
    
    loadFonts() {
        // تحميل الخطوط (في نسخة متقدمة يمكن استخدام WebFont لتحميل الخطوط)
    }
    
    create() {
        // عرض الشعار (لوجو)
        const logo = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2 - 100, 'logo')
            .setOrigin(0.5);
            
        // تأثير حركة للشعار
        this.tweens.add({
            targets: logo,
            y: logo.y + 15,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // زر "ابدأ"
        const startButton = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2 + 100, 'button')
            .setOrigin(0.5)
            .setInteractive();
            
        const startText = this.add.text(startButton.x, startButton.y, 'ابدأ اللعبة', {
            fontFamily: 'Cairo, Arial',
            fontSize: '26px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // تفاعل الزر
        startButton.on('pointerover', () => {
            startButton.setTexture('button_hover');
        });
        
        startButton.on('pointerout', () => {
            startButton.setTexture('button');
        });
        
        startButton.on('pointerdown', () => {
            this.sound.play('click');
            this.cameras.main.fadeOut(500);
        });
        
        // عند انتهاء تأثير التلاشي، انتقل إلى القائمة الرئيسية
        this.cameras.main.on('camerafadeoutcomplete', () => {
            this.scene.start('MainMenuScene');
        });
        
        // إطلاق موسيقى الخلفية
        if (gameData.musicEnabled && !this.sound.get('theme_music')) {
            this.sound.play('theme_music', {
                loop: true,
                volume: 0.5
            });
        }
    }
} 