<?php

namespace App\Console\Commands;

use App\Models\Car;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * إخفاء سيارات من قائمة «سياراتي» للمالك عبر العلم exclude_from_owner_dashboard
 * دون حذف السجلات أو تعديل المزادات العامة.
 *
 * الاستخدام المقترح بعد مراجعة المعرفات في بيئة staging:
 *   php artisan cars:owner-listing-suppress --email=USER@EXAMPLE.COM --keep-ids=1,2,3 --dry-run
 *   php artisan cars:owner-listing-suppress --email=USER@EXAMPLE.COM --keep-ids=1,2,3 --apply
 *
 * في production يجب أن يكون البريد ضمن INVENTORY_OWNER_CLEANUP_EMAILS في .env
 */
class OwnerListingSuppressCommand extends Command
{
    protected $signature = 'cars:owner-listing-suppress
                            {--email= : بريد المستخدم المالك}
                            {--keep-ids= : معرفات السيارات التي تبقى ظاهرة (مفصولة بفواصل)}
                            {--restore-all : إلغاء الإخفاء لكل سيارات هذا المستخدم}
                            {--dry-run : عرض النتائج دون كتابة}
                            {--apply : مطلوب مع --keep-ids (غير restore-all) لتنفيذ التحديث}';

    protected $description = 'إخفاء سيارات من قائمة المالك في لوحة المستخدم (علم exclude_from_owner_dashboard)';

    public function handle(): int
    {
        if (! Schema::hasColumn('cars', 'exclude_from_owner_dashboard')) {
            $this->error('عمود exclude_from_owner_dashboard غير موجود. شغّل php artisan migrate أولًا.');

            return self::FAILURE;
        }

        $email = (string) $this->option('email');
        if ($email === '') {
            $this->error('مرّر --email=');

            return self::FAILURE;
        }

        if (app()->environment('production')) {
            $allowed = config('inventory_cleanup.allowed_owner_emails', []);
            if ($allowed === [] || ! in_array($email, $allowed, true)) {
                $this->error('في الإنتاج: أضف البريد إلى INVENTORY_OWNER_CLEANUP_EMAILS في البيئة قبل التشغيل.');

                return self::FAILURE;
            }
        }

        $user = User::query()->where('email', $email)->first();
        if (! $user) {
            $this->error('لم يُعثر على مستخدم بهذا البريد.');

            return self::FAILURE;
        }

        $restoreAll = (bool) $this->option('restore-all');
        $keepIdsRaw = (string) $this->option('keep-ids');
        $dryRun = (bool) $this->option('dry-run');
        $apply = (bool) $this->option('apply');

        if ($restoreAll) {
            $cars = Car::query()->where('user_id', $user->id)->orderBy('id')->get();
            $toUnsuppress = $cars->where('exclude_from_owner_dashboard', true);
            $this->info("المستخدم #{$user->id} — سيارات مُخفاة حاليًا: {$toUnsuppress->count()}");

            if ($dryRun) {
                $this->warn('[dry-run] سيتم إظهار جميع سيارات المستخدم في قائمة المالك.');

                return self::SUCCESS;
            }

            $updated = Car::query()
                ->where('user_id', $user->id)
                ->where('exclude_from_owner_dashboard', true)
                ->update(['exclude_from_owner_dashboard' => false]);
            $this->info("تم تحديث {$updated} سيارة (إلغاء الإخفاء).");

            return self::SUCCESS;
        }

        if ($keepIdsRaw === '') {
            $this->error('مرّر --keep-ids= أو استخدم --restore-all');

            return self::FAILURE;
        }

        $keepIds = array_values(array_unique(array_filter(array_map(
            'intval',
            array_map('trim', explode(',', $keepIdsRaw))
        ))));

        if ($keepIds === []) {
            $this->error('قيمة --keep-ids غير صالحة.');

            return self::FAILURE;
        }

        if (! $dryRun && ! $apply) {
            $this->error('للتنفيذ الفعلي أضف --apply (أو استخدم --dry-run للمعاينة).');

            return self::FAILURE;
        }

        $allCars = Car::query()->where('user_id', $user->id)->orderBy('id')->get();
        if ($allCars->isEmpty()) {
            $this->warn('لا توجد سيارات لهذا المستخدم.');

            return self::SUCCESS;
        }

        $invalidKeep = array_diff($keepIds, $allCars->pluck('id')->all());
        if ($invalidKeep !== []) {
            $this->error('معرفات ليست لهذا المستخدم: '.implode(', ', $invalidKeep));

            return self::FAILURE;
        }

        $suppressIds = $allCars->pluck('id')->diff($keepIds)->values()->all();

        $this->table(
            ['id', 'make', 'model', 'year', 'exclude (بعد التشغيل)'],
            $allCars->map(fn (Car $c) => [
                $c->id,
                $c->make,
                $c->model,
                $c->year,
                in_array((int) $c->id, $keepIds, true) ? 'لا' : 'نعم',
            ])->all()
        );

        $this->info('تبقى ظاهرة: '.implode(', ', $keepIds));
        $this->info('ستُخفى من قائمة المالك: '.(count($suppressIds) ? implode(', ', $suppressIds) : '(لا شيء)'));

        if ($dryRun) {
            $this->warn('[dry-run] لم يُحفظ أي تغيير.');

            return self::SUCCESS;
        }

        Car::query()->where('user_id', $user->id)->update(['exclude_from_owner_dashboard' => true]);
        Car::query()
            ->where('user_id', $user->id)
            ->whereIn('id', $keepIds)
            ->update(['exclude_from_owner_dashboard' => false]);

        $this->info('تم حفظ التحديث.');

        return self::SUCCESS;
    }
}
