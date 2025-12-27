<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ===== Team Performance Metrics =====
        Schema::create('developer_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('github_username')->nullable();
            $table->integer('total_commits')->default(0);
            $table->integer('total_pull_requests')->default(0);
            $table->integer('total_deployments')->default(0);
            $table->integer('code_quality_score')->default(0); // 0-100
            $table->integer('total_bugs_fixed')->default(0);
            $table->integer('total_bugs_introduced')->default(0);
            $table->decimal('avg_response_time', 8, 2)->default(0); // in seconds
            $table->integer('tasks_completed')->default(0);
            $table->integer('tasks_in_progress')->default(0);
            $table->integer('tasks_pending')->default(0);
            $table->decimal('productivity_score', 5, 2)->default(0); // 0-100
            $table->decimal('code_review_score', 5, 2)->default(0); // 0-100
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();
            $table->index('user_id');
            $table->index('created_at');
        });

        // ===== Daily Performance Snapshots =====
        Schema::create('daily_developer_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('developer_metric_id')->constrained('developer_metrics')->onDelete('cascade');
            $table->date('snapshot_date');
            $table->integer('commits_count')->default(0);
            $table->integer('pull_requests_count')->default(0);
            $table->integer('code_reviews_count')->default(0);
            $table->integer('bugs_fixed')->default(0);
            $table->integer('bugs_introduced')->default(0);
            $table->decimal('code_quality_score', 5, 2)->default(0);
            $table->integer('tasks_completed')->default(0);
            $table->integer('working_hours')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['developer_metric_id', 'snapshot_date']);
            $table->index('snapshot_date');
        });

        // ===== Platform Health Monitoring =====
        Schema::create('platform_health_metrics', function (Blueprint $table) {
            $table->id();
            $table->timestamp('check_time');
            $table->decimal('cpu_usage', 5, 2)->default(0); // percentage
            $table->decimal('memory_usage', 5, 2)->default(0); // percentage
            $table->decimal('disk_usage', 5, 2)->default(0); // percentage
            $table->integer('active_users')->default(0);
            $table->integer('api_requests_per_minute')->default(0);
            $table->decimal('avg_response_time', 8, 2)->default(0); // in ms
            $table->integer('error_count')->default(0);
            $table->integer('database_connections')->default(0);
            $table->decimal('database_query_time', 8, 2)->default(0); // in ms
            $table->boolean('is_healthy')->default(true);
            $table->text('alerts')->nullable();
            $table->timestamps();
            $table->index('check_time');
            $table->index('is_healthy');
        });

        // ===== Error Logs and Tracking =====
        Schema::create('platform_error_logs', function (Blueprint $table) {
            $table->id();
            $table->string('error_type'); // Exception type
            $table->string('error_message');
            $table->text('error_trace')->nullable();
            $table->string('file_path')->nullable();
            $table->integer('line_number')->nullable();
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->string('endpoint')->nullable();
            $table->string('method')->nullable(); // GET, POST, etc
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->json('request_data')->nullable();
            $table->json('response_data')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();
            $table->index('severity');
            $table->index('error_type');
            $table->index('is_resolved');
            $table->index('created_at');
        });

        // ===== Page Performance Tracking =====
        Schema::create('page_performance_logs', function (Blueprint $table) {
            $table->id();
            $table->string('page_path');
            $table->string('page_name')->nullable();
            $table->decimal('load_time', 8, 2); // in ms
            $table->decimal('render_time', 8, 2)->nullable(); // in ms
            $table->integer('total_requests')->default(0);
            $table->integer('failed_requests')->default(0);
            $table->decimal('avg_response_time', 8, 2)->default(0);
            $table->integer('unique_visitors')->default(0);
            $table->integer('total_visits')->default(0);
            $table->decimal('bounce_rate', 5, 2)->nullable();
            $table->enum('status', ['excellent', 'good', 'acceptable', 'poor'])->default('good');
            $table->timestamp('measurement_time');
            $table->timestamps();
            $table->index('page_path');
            $table->index('measurement_time');
            $table->index('status');
        });

        // ===== Deployment Tracking =====
        Schema::create('deployment_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deployed_by')->constrained('users')->onDelete('restrict');
            $table->string('branch_name');
            $table->string('commit_hash')->nullable();
            $table->enum('environment', ['development', 'staging', 'production'])->default('staging');
            $table->enum('status', ['pending', 'in_progress', 'success', 'failed', 'rolled_back'])->default('pending');
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->text('deployment_notes')->nullable();
            $table->text('error_message')->nullable();
            $table->json('changes_summary')->nullable();
            $table->integer('files_changed')->default(0);
            $table->integer('lines_added')->default(0);
            $table->integer('lines_removed')->default(0);
            $table->timestamps();
            $table->index('environment');
            $table->index('status');
            $table->index('started_at');
        });

        // ===== API Performance Tracking =====
        Schema::create('api_performance_logs', function (Blueprint $table) {
            $table->id();
            $table->string('endpoint');
            $table->string('method'); // GET, POST, PUT, DELETE
            $table->integer('status_code');
            $table->decimal('response_time', 8, 2); // in ms
            $table->integer('request_size')->nullable(); // in bytes
            $table->integer('response_size')->nullable(); // in bytes
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('ip_address')->nullable();
            $table->text('error_message')->nullable();
            $table->boolean('is_cached')->default(false);
            $table->timestamp('request_time');
            $table->timestamps();
            $table->index('endpoint');
            $table->index('method');
            $table->index('status_code');
            $table->index('request_time');
        });

        // ===== Database Performance Tracking =====
        Schema::create('database_performance_logs', function (Blueprint $table) {
            $table->id();
            $table->string('query_type'); // SELECT, INSERT, UPDATE, DELETE
            $table->string('table_name');
            $table->decimal('execution_time', 8, 2); // in ms
            $table->integer('rows_affected')->default(0);
            $table->boolean('is_slow')->default(false);
            $table->text('query_hash')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('executed_at');
            $table->timestamps();
            $table->index('table_name');
            $table->index('query_type');
            $table->index('is_slow');
            $table->index('executed_at');
        });

        // ===== Feature Usage Tracking =====
        Schema::create('feature_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->string('feature_name');
            $table->string('feature_category')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('usage_count')->default(1);
            $table->decimal('avg_duration', 8, 2)->nullable(); // in seconds
            $table->boolean('is_successful')->default(true);
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('last_used_at');
            $table->timestamps();
            $table->index('feature_name');
            $table->index('feature_category');
            $table->index('last_used_at');
        });

        // ===== Backup and Recovery Logs =====
        Schema::create('backup_logs', function (Blueprint $table) {
            $table->id();
            $table->string('backup_type'); // database, files, full
            $table->enum('status', ['pending', 'in_progress', 'success', 'failed'])->default('pending');
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->string('backup_location')->nullable();
            $table->integer('backup_size')->nullable(); // in MB
            $table->text('error_message')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->text('verification_notes')->nullable();
            $table->timestamps();
            $table->index('backup_type');
            $table->index('status');
            $table->index('started_at');
        });

        // ===== System Alerts and Notifications =====
        Schema::create('system_alerts', function (Blueprint $table) {
            $table->id();
            $table->enum('alert_type', ['performance', 'error', 'security', 'backup', 'deployment', 'resource'])->default('performance');
            $table->enum('severity', ['info', 'warning', 'critical'])->default('warning');
            $table->string('title');
            $table->text('description');
            $table->json('metadata')->nullable();
            $table->boolean('is_acknowledged')->default(false);
            $table->timestamp('acknowledged_at')->nullable();
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('resolution_notes')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->index('alert_type');
            $table->index('severity');
            $table->index('is_resolved');
            $table->index('created_at');
        });

        // ===== Monitoring Configuration =====
        Schema::create('monitoring_configs', function (Blueprint $table) {
            $table->id();
            $table->string('config_key')->unique();
            $table->json('config_value');
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monitoring_configs');
        Schema::dropIfExists('system_alerts');
        Schema::dropIfExists('backup_logs');
        Schema::dropIfExists('feature_usage_logs');
        Schema::dropIfExists('database_performance_logs');
        Schema::dropIfExists('api_performance_logs');
        Schema::dropIfExists('deployment_logs');
        Schema::dropIfExists('page_performance_logs');
        Schema::dropIfExists('platform_error_logs');
        Schema::dropIfExists('platform_health_metrics');
        Schema::dropIfExists('daily_developer_snapshots');
        Schema::dropIfExists('developer_metrics');
    }
};
