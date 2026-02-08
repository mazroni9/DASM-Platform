<?php

namespace Bl\FatooraZatca\Commands;

use Illuminate\Console\Command;

class PackageInfoCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fatoora-zatca {--v}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add new client for zatca package';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        if($this->option('v')) {

            $readmePath = __DIR__ . '/../../README.md';

            if (file_exists($readmePath)) {
                $firstLine = strtok(file_get_contents($readmePath), "\n");
                $this->info($firstLine);
            } 
            else {
                $this->error('README.md file not found.');
            }

        }

        return self::SUCCESS;
    }
}
