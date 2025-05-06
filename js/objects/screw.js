/**
 * فئة المسمار (البرغي)
 * كائن تفاعلي يمكن فكه ودورانه
 */
class Screw {
    /**
     * إنشاء مسمار جديد
     * @param {Phaser.Scene} scene - مشهد اللعبة
     * @param {number} x - الموقع الأفقي
     * @param {number} y - الموقع الرأسي
     * @param {number} rotation - زاوية الدوران الأولية
     * @param {number} depth - عمق المسمار (كم دورة يحتاج)
     * @param {boolean} removable - إمكانية إزالة المسمار
     */
    constructor(scene, x, y, rotation = 0, depth = 30, removable = true) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.maxDepth = depth;
        this.currentDepth = depth;
        this.removable = removable;
        this.isRemoving = false;
        this.rotationProgress = 0;
        this.rotationSpeed = 0.1; // سرعة الدوران
        
        // إنشاء الصور
        this.head = scene.add.image(x, y, 'screw_head')
            .setOrigin(0.5)
            .setRotation(rotation)
            .setInteractive({ draggable: true });
            
        this.body = scene.add.image(x, y, 'screw_body')
            .setOrigin(0.5);
            
        // إنشاء تأثيرات دوران المسمار والضوء
        this.rotationTween = null;
        this.highlightEffect = scene.add.sprite(x, y, 'highlight_effect')
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(1.2);
            
        // إضافة الاستماع للأحداث
        this.setupInteractions();
        
        // تحديث المظهر الأولي
        this.updateAppearance();
    }
    
    /**
     * إعداد التفاعلات مع المسمار
     */
    setupInteractions() {
        // بداية السحب
        this.head.on('dragstart', () => {
            // إظهار الضوء إذا كان المسمار قابل للإزالة
            if (this.removable) {
                this.highlightEffect.setAlpha(0.5);
                this.scene.sound.play('screw_start');
            }
        });
        
        // أثناء السحب
        this.head.on('drag', (pointer, dragX, dragY) => {
            if (!this.removable || this.isRemoving) return;
            
            // حساب زاوية الدوران من حركة السحب
            const deltaX = dragX - this.x;
            const deltaY = dragY - this.y;
            
            // حساب مقدار الحركة الدائرية
            const angle = Math.atan2(deltaY, deltaX);
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // تحديث التقدم في الدوران
            this.rotationProgress += distance * 0.01;
            
            // تقليل العمق بناءً على التقدم في الدوران
            if (this.rotationProgress >= 1) {
                this.rotationProgress = 0;
                this.decreaseDepth();
                
                // صوت الدوران
                this.scene.sound.play('screw_turn');
            }
            
            // تحديث الدوران المرئي للمسمار
            this.head.rotation += this.rotationSpeed;
        });
        
        // نهاية السحب
        this.head.on('dragend', () => {
            this.highlightEffect.setAlpha(0);
            
            // إذا تم فك المسمار بالكامل
            if (this.currentDepth <= 0 && !this.isRemoving) {
                this.remove();
            }
        });
        
        // الضغط على المسمار
        this.head.on('pointerdown', () => {
            if (this.removable) {
                this.scene.sound.play('screw_tap');
            }
        });
    }
    
    /**
     * تقليل عمق المسمار (فك جزئي)
     */
    decreaseDepth() {
        if (this.currentDepth <= 0) return;
        
        this.currentDepth--;
        this.updateAppearance();
        
        // إذا وصل العمق للصفر
        if (this.currentDepth <= 0) {
            this.scene.sound.play('screw_loose');
            this.scene.tweens.add({
                targets: this.head,
                y: this.y - 5,
                duration: 300,
                ease: 'Bounce.Out',
                yoyo: true
            });
            
            // إضافة تأثير وميض
            this.scene.tweens.add({
                targets: this.highlightEffect,
                alpha: 0.8,
                duration: 300,
                yoyo: true
            });
        }
    }
    
    /**
     * تحديث مظهر المسمار بناءً على عمقه الحالي
     */
    updateAppearance() {
        // ضبط مقياس المسمار ودرجة الشفافية والارتفاع
        const depthRatio = this.currentDepth / this.maxDepth;
        
        // تحديث شكل المسمار حسب عمقه
        this.body.setScale(1, depthRatio);
        this.body.setAlpha(depthRatio * 0.8 + 0.2);
        
        // تحريك رأس المسمار للأعلى كلما قل العمق
        const headOffset = (1 - depthRatio) * 20;
        this.head.y = this.y - headOffset;
    }
    
    /**
     * إزالة المسمار بعد فكه بالكامل
     */
    remove() {
        if (this.isRemoving) return;
        
        this.isRemoving = true;
        
        // تشغيل صوت الإزالة
        this.scene.sound.play('screw_remove');
        
        // تحريك المسمار للأعلى مع دوران
        this.scene.tweens.add({
            targets: [this.head, this.body],
            y: this.y - 50,
            alpha: 0,
            rotation: this.head.rotation + Math.PI * 2,
            duration: 800,
            ease: 'Back.easeIn',
            onComplete: () => {
                // إخطار المشهد بإزالة المسمار
                this.scene.events.emit('screwRemoved', this);
                
                // إزالة العناصر من المشهد
                this.destroy();
            }
        });
        
        // تأثير للإزالة
        this.scene.tweens.add({
            targets: this.highlightEffect,
            alpha: 0,
            scale: 2,
            duration: 500
        });
    }
    
    /**
     * تنظيف الموارد
     */
    destroy() {
        this.head.destroy();
        this.body.destroy();
        this.highlightEffect.destroy();
        
        if (this.rotationTween) {
            this.rotationTween.stop();
        }
    }
} 