/**
 * فئة الصامولة
 * كائن تفاعلي يمكن فكه وتثبيته مع البراغي
 */
class Nut {
    /**
     * إنشاء صامولة جديدة
     * @param {Phaser.Scene} scene - مشهد اللعبة
     * @param {number} x - الموقع الأفقي
     * @param {number} y - الموقع الرأسي
     * @param {string} type - نوع الصامولة (hexagon, square, wing)
     * @param {number} size - حجم الصامولة
     * @param {boolean} removable - إمكانية إزالة الصامولة
     */
    constructor(scene, x, y, type = 'hexagon', size = 20, removable = true) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = size;
        this.removable = removable;
        this.isRemoving = false;
        this.rotationProgress = 0;
        this.rotationSpeed = 0.15; // سرعة الدوران، أسرع من المسمار
        
        // تحديد نوع الصامولة
        let textureKey;
        switch (type) {
            case 'square':
                textureKey = 'nut_square';
                break;
            case 'wing':
                textureKey = 'nut_wing';
                break;
            case 'hexagon':
            default:
                textureKey = 'nut_hexagon';
                break;
        }
        
        // إنشاء الصورة للصامولة
        this.sprite = scene.add.image(x, y, textureKey)
            .setOrigin(0.5)
            .setScale(size / 30) // تحجيم بناءً على المقاس
            .setInteractive({ draggable: true });
            
        // إنشاء تأثير الضوء
        this.highlightEffect = scene.add.sprite(x, y, 'highlight_effect')
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(size / 20);
            
        // إضافة الاستماع للأحداث
        this.setupInteractions();
    }
    
    /**
     * إعداد التفاعلات مع الصامولة
     */
    setupInteractions() {
        // بداية السحب
        this.sprite.on('dragstart', () => {
            if (this.removable) {
                this.highlightEffect.setAlpha(0.5);
                this.scene.sound.play('nut_start');
            }
        });
        
        // أثناء السحب
        this.sprite.on('drag', (pointer, dragX, dragY) => {
            if (!this.removable || this.isRemoving) return;
            
            // حساب الحركة الدائرية حول مركز الصامولة
            const deltaX = dragX - this.x;
            const deltaY = dragY - this.y;
            
            // حساب مقدار الحركة
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // زيادة تقدم الدوران
            this.rotationProgress += distance * 0.015; // أسهل من المسمار
            
            // دوران الصامولة مرئياً
            this.sprite.rotation += this.rotationSpeed;
            
            // إذا اكتمل الدوران
            if (this.rotationProgress >= 1) {
                this.rotationProgress = 0;
                
                // صوت الدوران
                this.scene.sound.play('nut_turn');
                
                // إذا كانت الصامولة قابلة للإزالة، قم بإزالتها
                if (this.removable) {
                    this.remove();
                }
            }
        });
        
        // نهاية السحب
        this.sprite.on('dragend', () => {
            this.highlightEffect.setAlpha(0);
        });
        
        // الضغط على الصامولة
        this.sprite.on('pointerdown', () => {
            if (this.removable) {
                this.scene.sound.play('nut_tap');
            }
        });
    }
    
    /**
     * إزالة الصامولة
     */
    remove() {
        if (this.isRemoving) return;
        
        this.isRemoving = true;
        
        // صوت إزالة الصامولة
        this.scene.sound.play('nut_remove');
        
        // تطبيق تأثيرات الإزالة
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.y - 40,
            alpha: 0,
            rotation: this.sprite.rotation + Math.PI * 2,
            duration: 600,
            ease: 'Back.easeIn',
            onComplete: () => {
                // إخطار المشهد بإزالة الصامولة
                this.scene.events.emit('nutRemoved', this);
                
                // إزالة الكائن
                this.destroy();
            }
        });
        
        // تأثير وميض عند الإزالة
        this.scene.tweens.add({
            targets: this.highlightEffect,
            alpha: 0,
            scale: this.highlightEffect.scale * 1.5,
            duration: 500
        });
    }
    
    /**
     * نقل الصامولة إلى موقع جديد
     * @param {number} x - الموقع الأفقي الجديد
     * @param {number} y - الموقع الرأسي الجديد
     */
    moveTo(x, y) {
        this.x = x;
        this.y = y;
        
        this.scene.tweens.add({
            targets: [this.sprite, this.highlightEffect],
            x: x,
            y: y,
            duration: 300,
            ease: 'Cubic.easeOut'
        });
    }
    
    /**
     * تنظيف الموارد
     */
    destroy() {
        this.sprite.destroy();
        this.highlightEffect.destroy();
    }
} 