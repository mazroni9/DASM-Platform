/**
 * فئة قطعة الخشب
 * قطعة يمكن تثبيتها أو تحريكها عند إزالة البراغي والصواميل
 */
class Wood {
    /**
     * إنشاء قطعة خشب جديدة
     * @param {Phaser.Scene} scene - مشهد اللعبة
     * @param {number} x - الموقع الأفقي للمركز
     * @param {number} y - الموقع الرأسي للمركز
     * @param {number} width - العرض
     * @param {number} height - الارتفاع
     * @param {string} type - نوع الشكل ('rectangle', 'circle', 'triangle', 'custom')
     * @param {number} rotation - زاوية الدوران
     * @param {boolean} movable - هل يمكن تحريك القطعة
     */
    constructor(scene, x, y, width, height, type = 'rectangle', rotation = 0, movable = true) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.rotation = rotation;
        this.movable = movable;
        this.screwPoints = []; // نقاط تثبيت المسامير
        this.isMoving = false;
        this.locked = true; // مقفلة افتراضياً بسبب وجود مسامير
        
        // إنشاء الجسم الفيزيائي
        this.createPhysicsBody();
        
        // تمثيل بصري
        this.createVisualRepresentation();
        
        // الاستماع للأحداث
        this.setupInteractions();
    }
    
    /**
     * إنشاء الجسم الفيزيائي
     */
    createPhysicsBody() {
        // إنشاء الشكل المناسب
        let physicsShape;
        let options = {
            isStatic: true, // ثابتة حتى يتم فتح القفل
            angle: this.rotation,
            friction: 0.5,
            frictionAir: 0.2,
            restitution: 0.3,
            density: 0.01,
            chamfer: { radius: 5 } // تنعيم الحواف
        };
        
        switch (this.type) {
            case 'circle':
                physicsShape = this.scene.matter.bodies.circle(this.x, this.y, this.width / 2, options);
                break;
            case 'triangle':
                // إنشاء مثلث
                physicsShape = this.scene.matter.bodies.polygon(this.x, this.y, 3, this.width / 2, options);
                break;
            case 'custom':
                // للأشكال المخصصة يتم تعريفها بنقاط
                // يمكن تخصيص هذا حسب الحاجة للمستويات المتقدمة
                physicsShape = this.scene.matter.bodies.fromVertices(this.x, this.y, 
                    [
                        { x: -this.width/2, y: -this.height/2 },
                        { x: this.width/2, y: -this.height/2 },
                        { x: this.width/2, y: this.height/2 },
                        { x: -this.width/2, y: this.height/2 }
                    ], 
                    options
                );
                break;
            case 'rectangle':
            default:
                physicsShape = this.scene.matter.bodies.rectangle(this.x, this.y, this.width, this.height, options);
                break;
        }
        
        // إضافة الجسم إلى العالم الفيزيائي
        this.body = this.scene.matter.body.create({
            parts: [physicsShape],
            label: 'wood'
        });
        
        // إضافة الجسم إلى المحرك
        this.scene.matter.world.add(this.body);
    }
    
    /**
     * إنشاء التمثيل البصري
     */
    createVisualRepresentation() {
        // اختيار نسيج الخشب
        const textureKey = 'wood_texture'; // يمكن وضع أنواع مختلفة للخشب في نسخة متقدمة
        
        // إنشاء رسم الخشب حسب النوع
        switch (this.type) {
            case 'circle':
                this.sprite = this.scene.add.circle(this.x, this.y, this.width / 2, 0xCE9F6F, 1)
                    .setStrokeStyle(2, 0x8B5A2B)
                    .setOrigin(0.5);
                break;
            case 'triangle':
                // مثلث باستخدام رسومات
                this.sprite = this.scene.add.graphics();
                this.sprite.fillStyle(0xCE9F6F);
                this.sprite.lineStyle(2, 0x8B5A2B);
                this.sprite.beginPath();
                this.sprite.moveTo(0, -this.height / 2);
                this.sprite.lineTo(this.width / 2, this.height / 2);
                this.sprite.lineTo(-this.width / 2, this.height / 2);
                this.sprite.closePath();
                this.sprite.fillPath();
                this.sprite.strokePath();
                this.sprite.x = this.x;
                this.sprite.y = this.y;
                break;
            case 'rectangle':
            default:
                // استخدام صورة كخلفية مع إضافة خطوط لتمثيل ألياف الخشب
                this.sprite = this.scene.add.container(this.x, this.y);
                
                // خلفية الخشب
                const background = this.scene.add.image(0, 0, textureKey)
                    .setDisplaySize(this.width, this.height);
                
                // إضافة تفاصيل على الخشب (خطوط)
                const details = this.scene.add.graphics();
                details.lineStyle(1, 0x8B5A2B, 0.4);
                // رسم خطوط أفقية لأنماط الخشب
                for (let i = -this.height / 2 + 5; i < this.height / 2; i += 10) {
                    details.beginPath();
                    details.moveTo(-this.width / 2, i);
                    details.lineTo(this.width / 2, i);
                    details.closePath();
                    details.strokePath();
                }
                
                // إضافة حدود
                const border = this.scene.add.graphics();
                border.lineStyle(2, 0x8B5A2B, 1);
                border.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
                
                // إضافة العناصر للحاوية
                this.sprite.add(background);
                this.sprite.add(details);
                this.sprite.add(border);
                break;
        }
        
        // ضبط الدوران
        this.sprite.rotation = this.rotation;
        
        // ضبط التفاعلية إذا كانت قابلة للتحريك
        if (this.movable) {
            if (this.sprite.setInteractive) {
                this.sprite.setInteractive({ draggable: true });
            }
        }
        
        // إضافة تأثير توهج عند إمكانية التحريك
        this.highlightEffect = this.scene.add.rectangle(this.x, this.y, this.width + 10, this.height + 10, 0xFFFFFF, 0)
            .setOrigin(0.5)
            .setRotation(this.rotation);
    }
    
    /**
     * إعداد التفاعلات
     */
    setupInteractions() {
        if (!this.movable) return;
        
        // في Phaser 3، يمكننا التعامل مع الأحداث بشكل مباشر من خلال الكائنات
        if (this.sprite.on) {
            // بداية السحب
            this.sprite.on('dragstart', (pointer) => {
                if (this.locked) {
                    this.scene.sound.play('wood_locked');
                    
                    // تأثير اهتزاز إذا كانت مقفلة
                    this.scene.tweens.add({
                        targets: this.sprite,
                        x: this.x + 5,
                        duration: 50,
                        yoyo: true,
                        repeat: 3
                    });
                    return;
                }
                
                this.isMoving = true;
                this.scene.sound.play('wood_pickup');
                
                // تفعيل الفيزياء للحركة
                this.scene.matter.body.setStatic(this.body, false);
                
                // إظهار تأثير التوهج
                this.scene.tweens.add({
                    targets: this.highlightEffect,
                    alpha: 0.3,
                    duration: 200
                });
            });
            
            // أثناء السحب
            this.sprite.on('drag', (pointer, dragX, dragY) => {
                if (this.locked || !this.isMoving) return;
                
                // تحريك الجسم الفيزيائي
                this.scene.matter.body.setPosition(this.body, {
                    x: dragX,
                    y: dragY
                });
                
                // تحريك العناصر المرئية
                this.sprite.x = dragX;
                this.sprite.y = dragY;
                this.highlightEffect.x = dragX;
                this.highlightEffect.y = dragY;
                
                // تحديث المواقع
                this.x = dragX;
                this.y = dragY;
            });
            
            // نهاية السحب
            this.sprite.on('dragend', () => {
                if (this.locked || !this.isMoving) return;
                
                this.isMoving = false;
                this.scene.sound.play('wood_drop');
                
                // إخفاء تأثير التوهج
                this.scene.tweens.add({
                    targets: this.highlightEffect,
                    alpha: 0,
                    duration: 200
                });
                
                // إخطار المشهد بأن قطعة الخشب قد تحركت
                this.scene.events.emit('woodMoved', this);
            });
        }
    }
    
    /**
     * فتح قفل قطعة الخشب
     */
    unlock() {
        if (!this.locked) return;
        
        this.locked = false;
        
        // تأثير بصري لإظهار أن القطعة مفتوحة
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.y - 5,
            duration: 300,
            ease: 'Sine.easeOut',
            yoyo: true,
            onComplete: () => {
                // توهج ليشير إلى أنها أصبحت قابلة للتحريك
                this.scene.tweens.add({
                    targets: this.highlightEffect,
                    alpha: 0.5,
                    duration: 300,
                    yoyo: true
                });
            }
        });
        
        this.scene.sound.play('wood_unlock');
    }
    
    /**
     * إضافة نقطة تثبيت للمسمار
     * @param {Object} point - نقطة التثبيت {x, y}
     */
    addScrewPoint(point) {
        this.screwPoints.push(point);
    }
    
    /**
     * تنظيف الموارد
     */
    destroy() {
        // إزالة الجسم الفيزيائي
        if (this.body) {
            this.scene.matter.world.remove(this.body);
        }
        
        // إزالة التمثيل البصري
        if (this.sprite) {
            this.sprite.destroy();
        }
        
        if (this.highlightEffect) {
            this.highlightEffect.destroy();
        }
    }
} 