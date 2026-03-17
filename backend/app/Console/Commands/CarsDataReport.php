<?php

namespace App\Console\Commands;

use App\Models\Car;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CarsDataReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cars:data-report
                            {--json-file= : Export full report to JSON file path}
                            {--json-pretty : Pretty-print JSON to console}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'تقارير بيانات السيارات: إحصاءات الحقول، نسب الاكتمال، توزيع الماركة والسنة والمدينة';

    /**
     * Field mapping: display_name => db_column
     * Only columns that exist will be included.
     */
    private array $fieldMap = [
        'make'        => 'make',
        'model'       => 'model',
        'year'        => 'year',
        'color'       => 'color',
        'mileage'     => 'odometer',
        'price'       => 'evaluation_price',
        'condition'   => 'condition',
        'fuel_type'   => 'engine',
        'transmission'=> 'transmission',
        'city'        => 'province',  // province is the main location column
        'description' => 'description',
        'images'      => 'image',
    ];

    public function handle(): int
    {
        $this->info('═══════════════════════════════════════════════════════');
        $this->info('  تقرير بيانات السيارات — cars:data-report');
        $this->info('═══════════════════════════════════════════════════════');
        $this->newLine();

        $total = Car::count();
        $this->info("إجمالي عدد السيارات: {$total}");
        $this->newLine();

        if ($total === 0) {
            $this->warn('لا توجد سيارات في الجدول.');
            return Command::SUCCESS;
        }

        // 1. Field completeness
        $fieldStats = $this->computeFieldStats($total);
        $this->outputFieldTable($fieldStats);

        $this->newLine();

        // 2. Distribution: make (top 15)
        $makeDist = $this->getMakeDistribution();
        $this->outputMakeTable($makeDist);

        $this->newLine();

        // 3. Distribution: year
        $yearDist = $this->getYearDistribution();
        $this->outputYearTable($yearDist);

        $this->newLine();

        // 4. Distribution: city (province)
        $cityDist = $this->getCityDistribution();
        $this->outputCityTable($cityDist);

        // Build full report
        $report = [
            'generated_at'     => now()->toIso8601String(),
            'total_cars'       => $total,
            'field_stats'      => $fieldStats,
            'distribution'     => [
                'by_make_top15'  => $makeDist,
                'by_year'        => $yearDist,
                'by_city'        => $cityDist,
            ],
        ];

        // JSON output
        $json = json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        if ($path = $this->option('json-file')) {
            file_put_contents($path, $json);
            $this->info("تم تصدير التقرير كـ JSON إلى: {$path}");
        }

        if ($this->option('json-pretty')) {
            $this->newLine();
            $this->line('══════════════ JSON ══════════════');
            $this->line($json);
        }

        return Command::SUCCESS;
    }

    /**
     * Compute filled/empty stats for each field.
     */
    private function computeFieldStats(int $total): array
    {
        $stats = [];
        $table = (new Car())->getTable();

        foreach ($this->fieldMap as $label => $column) {
            if (!Schema::hasColumn($table, $column)) {
                $stats[] = [
                    'field'   => $label,
                    'column'  => $column,
                    'filled'  => 0,
                    'empty'   => $total,
                    'percent' => 0.0,
                    'exists'  => false,
                ];
                continue;
            }

            $filled = $this->countFilled($column);
            $empty = $total - $filled;
            $percent = $total > 0 ? round(100 * $filled / $total, 2) : 0;

            $stats[] = [
                'field'   => $label,
                'column'  => $column,
                'filled'  => $filled,
                'empty'   => $empty,
                'percent' => $percent,
                'exists'  => true,
            ];
        }

        return $stats;
    }

    /**
     * Count cars with non-empty value for the given column.
     */
    private function countFilled(string $column): int
    {
        $table = (new Car())->getTable();
        $grammar = DB::connection()->getSchemaGrammar();
        $wrapped = $grammar->wrap("{$table}.{$column}");

        if (in_array($column, ['image', 'images'], true)) {
            return Car::query()
                ->whereNotNull($column)
                ->whereRaw("{$wrapped} NOT IN ('null', '\"\"')")
                ->whereRaw("{$wrapped} != '[]'")
                ->count();
        }

        $query = Car::query()->whereNotNull($column);

        $stringColumns = ['make', 'model', 'color', 'engine', 'transmission', 'province', 'city', 'description'];
        if (in_array($column, $stringColumns, true)) {
            $driver = DB::connection()->getDriverName();
            if ($driver === 'mysql' || $driver === 'mariadb') {
                $query->whereRaw("TRIM(COALESCE({$wrapped}, '')) != ''");
            } else {
                $query->where($column, '!=', '');
            }
        }

        return $query->count();
    }

    private function outputFieldTable(array $stats): void
    {
        $headers = ['الحقل', 'العمود', 'ممتلئ', 'فارغ', 'نسبة الاكتمال %'];
        $rows = [];

        foreach ($stats as $s) {
            $col = $s['exists'] ? $s['column'] : "— (غير موجود)";
            $rows[] = [
                $s['field'],
                $col,
                $s['filled'],
                $s['empty'],
                $s['percent'] . '%',
            ];
        }

        $this->table($headers, $rows);
    }

    private function getMakeDistribution(): array
    {
        $column = 'make';
        if (!Schema::hasColumn((new Car())->getTable(), $column)) {
            return [];
        }

        return Car::query()
            ->select($column, DB::raw('COUNT(*) as count'))
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->groupBy($column)
            ->orderByDesc('count')
            ->limit(15)
            ->pluck('count', $column)
            ->map(fn ($c) => (int) $c)
            ->all();
    }

    private function getYearDistribution(): array
    {
        $column = 'year';
        if (!Schema::hasColumn((new Car())->getTable(), $column)) {
            return [];
        }

        return Car::query()
            ->select($column, DB::raw('COUNT(*) as count'))
            ->whereNotNull($column)
            ->groupBy($column)
            ->orderBy($column)
            ->pluck('count', $column)
            ->map(fn ($c) => (int) $c)
            ->all();
    }

    private function getCityDistribution(): array
    {
        $column = 'province';
        if (!Schema::hasColumn((new Car())->getTable(), $column)) {
            return [];
        }

        return Car::query()
            ->select($column, DB::raw('COUNT(*) as count'))
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->groupBy($column)
            ->orderByDesc('count')
            ->pluck('count', $column)
            ->map(fn ($c) => (int) $c)
            ->all();
    }

    private function outputMakeTable(array $dist): void
    {
        $this->info('توزيع السيارات حسب الماركة (أعلى 15):');
        if (empty($dist)) {
            $this->warn('  لا توجد بيانات.');
            return;
        }

        $rows = [];
        foreach ($dist as $make => $count) {
            $rows[] = [$make ?: '(فارغ)', $count];
        }
        $this->table(['الماركة', 'العدد'], $rows);
    }

    private function outputYearTable(array $dist): void
    {
        $this->info('توزيع السيارات حسب سنة الصنع:');
        if (empty($dist)) {
            $this->warn('  لا توجد بيانات.');
            return;
        }

        $rows = [];
        foreach ($dist as $year => $count) {
            $rows[] = [$year ?: '(فارغ)', $count];
        }
        $this->table(['السنة', 'العدد'], $rows);
    }

    private function outputCityTable(array $dist): void
    {
        $this->info('توزيع السيارات حسب المدينة (المحافظة):');
        if (empty($dist)) {
            $this->warn('  لا توجد بيانات.');
            return;
        }

        $rows = [];
        foreach ($dist as $city => $count) {
            $rows[] = [$city ?: '(فارغ)', $count];
        }
        $this->table(['المدينة', 'العدد'], $rows);
    }
}
