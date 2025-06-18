<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First create the venues table if it doesn't exist
        if (!Schema::hasTable('venues')) {
            Schema::create('venues', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('location')->nullable();
                $table->string('address')->nullable();
                $table->string('city')->nullable();
                $table->string('state')->nullable();
                $table->string('country')->nullable();
                $table->string('postal_code')->nullable();
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->timestamps();
            });
        }
        
        // Then check if the broadcasts table exists
        if (!Schema::hasTable('broadcasts')) {
            // If broadcasts table doesn't exist, rename live_streaming_sessions to broadcasts
            if (Schema::hasTable('live_streaming_sessions')) {
                Schema::rename('live_streaming_sessions', 'broadcasts');
                
                // Add missing columns that might be in the Broadcast model but not in live_streaming_sessions
                Schema::table('broadcasts', function (Blueprint $table) {
                    if (!Schema::hasColumn('broadcasts', 'title')) {
                        $table->string('title')->nullable();
                    }
                    if (!Schema::hasColumn('broadcasts', 'description')) {
                        $table->text('description')->nullable();
                    }
                    if (!Schema::hasColumn('broadcasts', 'venue_id')) {
                        $table->unsignedBigInteger('venue_id')->nullable();
                        $table->foreign('venue_id')->references('id')->on('venues')->onDelete('set null');
                    }
                    if (!Schema::hasColumn('broadcasts', 'is_live')) {
                        $table->boolean('is_live')->default(false);
                    }
                    if (!Schema::hasColumn('broadcasts', 'youtube_stream_id')) {
                        $table->string('youtube_stream_id')->nullable();
                    }
                    if (!Schema::hasColumn('broadcasts', 'youtube_embed_url')) {
                        $table->string('youtube_embed_url')->nullable();
                    }
                    if (!Schema::hasColumn('broadcasts', 'youtube_chat_embed_url')) {
                        $table->string('youtube_chat_embed_url')->nullable();
                    }
                    if (!Schema::hasColumn('broadcasts', 'scheduled_start_time')) {
                        $table->dateTime('scheduled_start_time')->nullable();
                    }
                    if (!Schema::hasColumn('broadcasts', 'actual_start_time')) {
                        $table->dateTime('actual_start_time')->nullable();
                    }
                    if (!Schema::hasColumn('broadcasts', 'end_time')) {
                        $table->dateTime('end_time')->nullable();
                    }
                    if (!Schema::hasColumn('broadcasts', 'created_by')) {
                        $table->unsignedBigInteger('created_by')->nullable();
                        $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
                    }
                    if (!Schema::hasColumn('broadcasts', 'updated_by')) {
                        $table->unsignedBigInteger('updated_by')->nullable();
                    }
                });
            } else {
                // If neither table exists, create the broadcasts table from scratch
                Schema::create('broadcasts', function (Blueprint $table) {
                    $table->bigIncrements('id');
                    $table->string('title')->nullable();
                    $table->text('description')->nullable();
                    $table->unsignedBigInteger('venue_id')->nullable();
                    $table->boolean('is_live')->default(false);
                    $table->string('youtube_stream_id')->nullable();
                    $table->string('youtube_embed_url')->nullable();
                    $table->string('youtube_chat_embed_url')->nullable();
                    $table->dateTime('scheduled_start_time')->nullable();
                    $table->dateTime('actual_start_time')->nullable();
                    $table->dateTime('end_time')->nullable();
                    $table->unsignedBigInteger('created_by')->nullable();
                    $table->unsignedBigInteger('updated_by')->nullable();
                    $table->timestamps();
                    
                    $table->foreign('venue_id')->references('id')->on('venues')->onDelete('set null');
                    $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
                });
            }
        }
        
        // Now add the moderator fields to the broadcasts table
        Schema::table('broadcasts', function (Blueprint $table) {
            if (!Schema::hasColumn('broadcasts', 'current_car_id')) {
                $table->unsignedBigInteger('current_car_id')->nullable()->after('venue_id');
                $table->foreign('current_car_id')->references('id')->on('cars')->onDelete('set null');
            }
            
            if (!Schema::hasColumn('broadcasts', 'moderator_id')) {
                $table->unsignedBigInteger('moderator_id')->nullable()->after('current_car_id');
                $table->foreign('moderator_id')->references('id')->on('users')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the moderator fields if they exist
        if (Schema::hasTable('broadcasts')) {
            Schema::table('broadcasts', function (Blueprint $table) {
                if (Schema::hasColumn('broadcasts', 'current_car_id')) {
                    $table->dropForeign(['current_car_id']);
                    $table->dropColumn('current_car_id');
                }
                
                if (Schema::hasColumn('broadcasts', 'moderator_id')) {
                    $table->dropForeign(['moderator_id']);
                    $table->dropColumn('moderator_id');
                }
            });
            
            // Check if this migration created the broadcasts table from scratch
            // We can't reliably determine this, so we'll just leave the table as is
            // If we renamed the table, we should rename it back
            if (Schema::hasTable('broadcasts') && !Schema::hasTable('live_streaming_sessions')) {
                // Get the structure of the broadcasts table
                $columns = Schema::getColumnListing('broadcasts');
                
                // Check if the broadcasts table has the structure of the original live_streaming_sessions table
                // This is a heuristic and may not be 100% accurate
                $liveStreamingColumns = ['id', 'auction_id', 'stream_url', 'status', 'started_at', 'ended_at', 'created_at', 'updated_at'];
                $hasLiveStreamingStructure = true;
                
                foreach ($liveStreamingColumns as $column) {
                    if (!in_array($column, $columns)) {
                        $hasLiveStreamingStructure = false;
                        break;
                    }
                }
                
                // If it has the structure of live_streaming_sessions, rename it back
                if ($hasLiveStreamingStructure) {
                    Schema::rename('broadcasts', 'live_streaming_sessions');
                }
            }
        }
        
        // Check if there are any broadcasts referencing venues
        $hasReferences = false;
        if (Schema::hasTable('broadcasts') && Schema::hasColumn('broadcasts', 'venue_id')) {
            // We can't drop the venues table if there are broadcasts referencing it
            // This is a simple check to see if there are any non-null venue_id values
            $hasReferences = DB::table('broadcasts')->whereNotNull('venue_id')->exists();
        }
        
        // Only drop the venues table if it was created by this migration and has no references
        if (Schema::hasTable('venues') && !$hasReferences) {
            // Check if there are any other tables referencing venues
            // If not, we can assume it was created by this migration
            $foreignKeys = DB::select("SELECT * FROM information_schema.table_constraints 
                                      WHERE constraint_type = 'FOREIGN KEY' 
                                      AND constraint_name LIKE '%venues%'");
                                      
            // If there are no other foreign keys referencing venues, we can drop it
            if (count($foreignKeys) <= 1) { // Only the broadcasts table references venues
                Schema::dropIfExists('venues');
            }
        }
    }
};