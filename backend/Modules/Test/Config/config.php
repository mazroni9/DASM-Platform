<?php

return array_merge([
    'name' => 'Test',
    'description' => 'Auction Testing Module',

    /**
     * السماح بتشغيل السيناريوهات في بيئة production.
     * افتراضيًا false — لا تشغيل سيناريوهات في production إلا بتفعيل صريح (env أو إعداد).
     * راجع docs/AUCTION_TESTING_BRANCH_IMPROVEMENT_PLAN.md
     */
    'scenario_runs_allowed_in_production' => filter_var(
        env('TEST_SCENARIO_RUNS_IN_PRODUCTION', false),
        FILTER_VALIDATE_BOOLEAN
    ),
], require __DIR__ . '/scenarios.php');
