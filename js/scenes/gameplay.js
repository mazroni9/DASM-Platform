/**
 * مشهد اللعب الرئيسي
 * يتعامل مع تحميل المستوى والتفاعلات وحالة اللعبة
 */
class GameplayScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameplayScene' });
    }
    
    /**
     * تهيئة البيانات
     */
    init(data) {
        this.levelId = data.levelId || 1;
        this.levelData = getLevel(this.levelId);
        
        // متغيرات المستوى الحالي
        this.woodBlocks = [];
        this.screws = [];
        this.nuts = [];
        this.removedScrews = 0;
        this.removedNuts = 0;
        this.removedWoods = 0;
        this.isLevelComplete = false;
        
        // مؤقت المستوى
        this.timer = 0;
        this.timerStarted = false;
        this.timeLeft = this.levelData.timeLimit;
    }
    
    /**
     * إنشاء المستوى وعناصره
     */
    create() {
        // إنشاء الخلفية
        this.createBackground();
        
        // إنشاء واجهة المستخدم
        this.createUI();
        
        // تحميل عناصر المستوى
        this.loadLevel();
        
        // الاستماع للأحداث
        this.setupEventListeners();
        
        // بدء المؤقت
        this.startTimer();
        
        // عرض تلميح المستوى
        this.showLevelHint();
    }
    
    /**
     * إنشاء خلفية المستوى
     */
    createBackground() {
        // خلفية بلون فاتح
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0xF0E6D2)
            .setOrigin(0);
            
        // إضافة نقوش وأنماط للخلفية
        const pattern = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'background')
            .setOrigin(0)
            .setAlpha(0.2);
    }
    
    /**
     * إنشاء واجهة المستخدم
     */
    createUI() {
        // شريط علوي
        const headerHeight = 50;
        const header = this.add.rectangle(0, 0, this.cameras.main.width, headerHeight, 0x4A6572)
            .setOrigin(0);
            
        // عنوان المستوى
        this.add.text(10, 10, `المستوى ${this.levelId}: ${this.levelData.name}`, {
            fontFamily: 'Cairo, Arial',
            fontSize: '18px',
            color: '#ffffff'
        });
        
        // زر العودة
        const backButton = this.add.image(this.cameras.main.width - 35, 25, 'home_icon')
            .setScale(0.8)
            .setInteractive();
            
        backButton.on('pointerdown', () => {
            this.sound.play('click');
            this.showExitConfirmation();
        });
        
        // زر الإعدادات
        const settingsButton = this.add.image(this.cameras.main.width - 75, 25, 'settings_icon')
            .setScale(0.8)
            .setInteractive();
            
        settingsButton.on('pointerdown', () => {
            this.sound.play('click');
            this.showSettings();
        });
        
        // عداد الوقت
        const timerBg = this.add.rectangle(this.cameras.main.width / 2, 25, 120, 30, 0x2D3E50)
            .setOrigin(0.5);
            
        this.timerText = this.add.text(this.cameras.main.width / 2, 25, `${this.timeLeft}`, {
            fontFamily: 'Cairo, Arial',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // أيقونة المؤقت
        const timerIcon = this.add.image(this.cameras.main.width / 2 - 50, 25, 'timer_icon')
            .setScale(0.6);
            
        // عرض صعوبة المستوى
        let difficultyStars = '';
        for (let i = 0; i < this.levelData.difficulty; i++) {
            difficultyStars += '★';
        }
        
        this.add.text(120, 10, `الصعوبة: ${difficultyStars}`, {
            fontFamily: 'Cairo, Arial',
            fontSize: '16px',
            color: '#ffffff'
        });
    }
    
    /**
     * تحميل عناصر المستوى
     */
    loadLevel() {
        // تحميل قطع الخشب
        this.levelData.woodBlocks.forEach(blockData => {
            const woodBlock = new Wood(
                this,
                blockData.x,
                blockData.y,
                blockData.width,
                blockData.height,
                blockData.type,
                blockData.rotation,
                blockData.movable
            );
            
            this.woodBlocks.push(woodBlock);
        });
        
        // تحميل المسامير
        this.levelData.screws.forEach(screwData => {
            const screw = new Screw(
                this,
                screwData.x,
                screwData.y,
                screwData.rotation,
                screwData.depth,
                screwData.removable
            );
            
            this.screws.push(screw);
        });
        
        // تحميل الصواميل
        this.levelData.nuts.forEach(nutData => {
            const nut = new Nut(
                this,
                nutData.x,
                nutData.y,
                nutData.type,
                nutData.size,
                nutData.removable
            );
            
            this.nuts.push(nut);
        });
    }
    
    /**
     * الاستماع للأحداث
     */
    setupEventListeners() {
        // فك مسمار
        this.events.on('screwRemoved', (screw) => {
            this.removedScrews++;
            
            // تحقق من فتح قفل قطع الخشب
            this.checkWoodUnlocking();
            
            // تشغيل صوت
            this.sound.play('screw_remove');
        });
        
        // فك صامولة
        this.events.on('nutRemoved', (nut) => {
            this.removedNuts++;
            
            // تحقق من فتح قفل قطع الخشب
            this.checkWoodUnlocking();
            
            // تشغيل صوت
            this.sound.play('nut_remove');
        });
        
        // تحريك قطعة خشب
        this.events.on('woodMoved', (wood) => {
            this.checkLevelCompletion();
        });
    }
    
    /**
     * بدء مؤقت المستوى
     */
    startTimer() {
        this.timerStarted = true;
        
        // تحديث المؤقت كل ثانية
        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }
    
    /**
     * تحديث مؤقت المستوى
     */
    updateTimer() {
        if (!this.timerStarted || this.isLevelComplete) return;
        
        this.timer++;
        this.timeLeft = Math.max(0, this.levelData.timeLimit - this.timer);
        
        // تحديث نص المؤقت
        this.timerText.setText(`${this.timeLeft}`);
        
        // تغيير لون النص حسب الوقت المتبقي
        if (this.timeLeft <= 10) {
            this.timerText.setColor('#FF5252');
            
            // اهتزاز النص عند الاقتراب من نهاية الوقت
            if (this.timeLeft <= 5) {
                this.tweens.add({
                    targets: this.timerText,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 200,
                    yoyo: true
                });
            }
        }
        
        // إذا انتهى الوقت
        if (this.timeLeft <= 0) {
            this.timerStarted = false;
            this.showTimeUpMessage();
        }
    }
    
    /**
     * تحقق من فتح قفل قطع الخشب
     * يتم فتح قفل قطعة الخشب عندما تتم إزالة جميع المسامير والصواميل المتصلة بها
     */
    checkWoodUnlocking() {
        // هذا منطق مبسط، في التطبيق الفعلي يجب تحديد المسامير والصواميل المرتبطة بكل قطعة خشب
        if (this.removedScrews + this.removedNuts >= (this.levelData.screws.length + this.levelData.nuts.length) / 2) {
            // فتح قفل قطع الخشب التي يمكن تحريكها
            this.woodBlocks.forEach(wood => {
                if (wood.movable && wood.locked) {
                    wood.unlock();
                }
            });
        }
    }
    
    /**
     * تحقق من اكتمال المستوى
     */
    checkLevelCompletion() {
        // تحقق من انتقال قطع الخشب المحددة إلى المكان المطلوب
        // في هذا المثال المبسط، نعتبر المستوى مكتملاً إذا تم تحريك جميع قطع الخشب القابلة للتحريك
        
        let movedBlocks = 0;
        let movableBlocks = 0;
        
        this.woodBlocks.forEach(wood => {
            if (wood.movable) {
                movableBlocks++;
                if (!wood.locked && wood.isMoving === false) {
                    movedBlocks++;
                }
            }
        });
        
        // إذا تم تحريك جميع القطع القابلة للتحريك، أكمل المستوى
        if (movedBlocks >= movableBlocks && movableBlocks > 0) {
            this.completedLevel();
        }
    }
    
    /**
     * إكمال المستوى
     */
    completedLevel() {
        if (this.isLevelComplete) return;
        
        this.isLevelComplete = true;
        this.timerStarted = false;
        
        // حساب عدد النجوم
        const stars = this.calculateStars();
        
        // تحديث تقدم اللاعب
        if (!gameData.completedLevels.includes(this.levelId)) {
            gameData.completedLevels.push(this.levelId);
        }
        
        // حفظ التقدم
        saveGameProgress();
        
        // تشغيل صوت النجاح
        this.sound.play('level_complete');
        
        // عرض شاشة إكمال المستوى مع تأخير قصير
        this.time.delayedCall(1000, () => {
            this.scene.start('LevelCompleteScene', {
                levelId: this.levelId,
                stars: stars,
                timeUsed: this.timer,
                nextLevelId: this.levelId + 1
            });
        });
    }
    
    /**
     * حساب عدد النجوم المكتسبة
     */
    calculateStars() {
        const timeUsed = this.timer;
        const starCriteria = this.levelData.starCriteria;
        
        if (timeUsed <= starCriteria[2]) {
            return 3; // 3 نجوم
        } else if (timeUsed <= starCriteria[1]) {
            return 2; // نجمتان
        } else if (timeUsed <= starCriteria[0]) {
            return 1; // نجمة واحدة
        } else {
            return 1; // على الأقل نجمة واحدة للإكمال
        }
    }
    
    /**
     * عرض تلميح المستوى
     */
    showLevelHint() {
        // خلفية شبه شفافة
        const hintBg = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            400,
            200,
            0x000000,
            0.7
        ).setOrigin(0.5);
        
        const hintTitle = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 70,
            'تلميح المستوى',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '24px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);
        
        const hintText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 20,
            this.levelData.hint,
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '18px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: 350 }
            }
        ).setOrigin(0.5);
        
        const closeButton = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 60,
            'فهمت!',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '20px',
                color: '#ffffff',
                backgroundColor: '#4A6572',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5)
        .setInteractive();
        
        closeButton.on('pointerdown', () => {
            this.sound.play('click');
            hintBg.destroy();
            hintTitle.destroy();
            hintText.destroy();
            closeButton.destroy();
        });
    }
    
    /**
     * عرض رسالة انتهاء الوقت
     */
    showTimeUpMessage() {
        // خلفية شبه شفافة
        const timesUpBg = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            400,
            250,
            0x000000,
            0.8
        ).setOrigin(0.5);
        
        const timesUpTitle = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 80,
            'انتهى الوقت!',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '32px',
                color: '#FF5252'
            }
        ).setOrigin(0.5);
        
        const timesUpText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 20,
            'حاول مرة أخرى بتركيز أكبر\nأنت تستطيع إكمال هذا المستوى!',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '18px',
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        const retryButton = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            'إعادة المحاولة',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '20px',
                color: '#ffffff',
                backgroundColor: '#4CAF50',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5)
        .setInteractive();
        
        const exitButton = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 100,
            'الخروج',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#F44336',
                padding: { x: 15, y: 8 }
            }
        ).setOrigin(0.5)
        .setInteractive();
        
        retryButton.on('pointerdown', () => {
            this.sound.play('click');
            this.scene.restart({ levelId: this.levelId });
        });
        
        exitButton.on('pointerdown', () => {
            this.sound.play('click');
            this.scene.start('LevelSelectScene');
        });
    }
    
    /**
     * عرض تأكيد الخروج
     */
    showExitConfirmation() {
        // تعليق مؤقت للعبة
        this.timerStarted = false;
        
        // خلفية شبه شفافة
        const exitBg = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            400,
            200,
            0x000000,
            0.8
        ).setOrigin(0.5);
        
        const exitTitle = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 60,
            'هل تريد الخروج؟',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '24px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);
        
        const exitText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 20,
            'سيتم فقدان التقدم في هذا المستوى',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '16px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);
        
        const stayButton = this.add.text(
            this.cameras.main.width / 2 - 80,
            this.cameras.main.height / 2 + 40,
            'البقاء',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#4CAF50',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5)
        .setInteractive();
        
        const confirmExitButton = this.add.text(
            this.cameras.main.width / 2 + 80,
            this.cameras.main.height / 2 + 40,
            'خروج',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#F44336',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5)
        .setInteractive();
        
        stayButton.on('pointerdown', () => {
            this.sound.play('click');
            this.timerStarted = true;
            exitBg.destroy();
            exitTitle.destroy();
            exitText.destroy();
            stayButton.destroy();
            confirmExitButton.destroy();
        });
        
        confirmExitButton.on('pointerdown', () => {
            this.sound.play('click');
            this.scene.start('LevelSelectScene');
        });
    }
    
    /**
     * عرض الإعدادات
     */
    showSettings() {
        // تعليق مؤقت للعبة
        this.timerStarted = false;
        
        // خلفية شبه شفافة
        const settingsBg = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            400,
            300,
            0x000000,
            0.8
        ).setOrigin(0.5);
        
        const settingsTitle = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 120,
            'الإعدادات',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '28px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);
        
        // إعدادات الصوت
        const soundText = this.add.text(
            this.cameras.main.width / 2 - 150,
            this.cameras.main.height / 2 - 60,
            'المؤثرات الصوتية:',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '18px',
                color: '#ffffff'
            }
        ).setOrigin(0, 0.5);
        
        const soundToggle = this.add.text(
            this.cameras.main.width / 2 + 100,
            this.cameras.main.height / 2 - 60,
            gameData.soundEnabled ? 'مفعّل' : 'معطّل',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '18px',
                color: gameData.soundEnabled ? '#4CAF50' : '#F44336',
                backgroundColor: '#333333',
                padding: { x: 15, y: 5 }
            }
        ).setOrigin(0.5)
        .setInteractive();
        
        // إعدادات الموسيقى
        const musicText = this.add.text(
            this.cameras.main.width / 2 - 150,
            this.cameras.main.height / 2,
            'الموسيقى:',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '18px',
                color: '#ffffff'
            }
        ).setOrigin(0, 0.5);
        
        const musicToggle = this.add.text(
            this.cameras.main.width / 2 + 100,
            this.cameras.main.height / 2,
            gameData.musicEnabled ? 'مفعّل' : 'معطّل',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '18px',
                color: gameData.musicEnabled ? '#4CAF50' : '#F44336',
                backgroundColor: '#333333',
                padding: { x: 15, y: 5 }
            }
        ).setOrigin(0.5)
        .setInteractive();
        
        // إعدادات الاهتزاز
        const vibrationText = this.add.text(
            this.cameras.main.width / 2 - 150,
            this.cameras.main.height / 2 + 60,
            'الاهتزاز:',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '18px',
                color: '#ffffff'
            }
        ).setOrigin(0, 0.5);
        
        const vibrationToggle = this.add.text(
            this.cameras.main.width / 2 + 100,
            this.cameras.main.height / 2 + 60,
            gameData.vibrationEnabled ? 'مفعّل' : 'معطّل',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '18px',
                color: gameData.vibrationEnabled ? '#4CAF50' : '#F44336',
                backgroundColor: '#333333',
                padding: { x: 15, y: 5 }
            }
        ).setOrigin(0.5)
        .setInteractive();
        
        // زر الإغلاق
        const closeButton = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 120,
            'إغلاق',
            {
                fontFamily: 'Cairo, Arial',
                fontSize: '20px',
                color: '#ffffff',
                backgroundColor: '#4A6572',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5)
        .setInteractive();
        
        // تفاعلات الأزرار
        soundToggle.on('pointerdown', () => {
            this.sound.play('click');
            gameData.soundEnabled = !gameData.soundEnabled;
            soundToggle.setText(gameData.soundEnabled ? 'مفعّل' : 'معطّل');
            soundToggle.setColor(gameData.soundEnabled ? '#4CAF50' : '#F44336');
            saveGameProgress();
        });
        
        musicToggle.on('pointerdown', () => {
            this.sound.play('click');
            gameData.musicEnabled = !gameData.musicEnabled;
            musicToggle.setText(gameData.musicEnabled ? 'مفعّل' : 'معطّل');
            musicToggle.setColor(gameData.musicEnabled ? '#4CAF50' : '#F44336');
            
            // تطبيق تغييرات الموسيقى
            if (gameData.musicEnabled) {
                if (!this.sound.get('theme_music')) {
                    this.sound.play('theme_music', { loop: true, volume: 0.5 });
                }
            } else {
                const music = this.sound.get('theme_music');
                if (music) {
                    music.stop();
                }
            }
            
            saveGameProgress();
        });
        
        vibrationToggle.on('pointerdown', () => {
            this.sound.play('click');
            gameData.vibrationEnabled = !gameData.vibrationEnabled;
            vibrationToggle.setText(gameData.vibrationEnabled ? 'مفعّل' : 'معطّل');
            vibrationToggle.setColor(gameData.vibrationEnabled ? '#4CAF50' : '#F44336');
            saveGameProgress();
        });
        
        closeButton.on('pointerdown', () => {
            this.sound.play('click');
            
            // استئناف اللعبة
            this.timerStarted = true;
            
            // إزالة عناصر الإعدادات
            settingsBg.destroy();
            settingsTitle.destroy();
            soundText.destroy();
            soundToggle.destroy();
            musicText.destroy();
            musicToggle.destroy();
            vibrationText.destroy();
            vibrationToggle.destroy();
            closeButton.destroy();
        });
    }
    
    /**
     * تحديث اللوحة
     */
    update() {
        // تحديث أي منطق متواصل للعبة هنا
    }
} 