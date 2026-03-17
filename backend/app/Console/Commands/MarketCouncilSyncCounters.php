<?php

namespace App\Console\Commands;

use App\Models\MarketArticle;
use App\Models\MarketComment;
use App\Models\MarketReaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Re-sync Market Council article counters from source tables.
 * Use after data fixes, migrations, or when counters have drifted.
 * Safe to run manually; does not run automatically.
 */
class MarketCouncilSyncCounters extends Command
{
    protected $signature = 'market-council:sync-counters
                            {--dry-run : Show what would be updated without writing}
                            {--article= : Sync only a specific article ID}';

    protected $description = 'Re-sync likes_count, saves_count, helpful_count, comments_count on market_articles from source tables';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $articleId = $this->option('article');

        $query = MarketArticle::query();
        if ($articleId !== null && $articleId !== '') {
            $query->where('id', (int) $articleId);
            if ($query->doesntExist()) {
                $this->warn("Article ID {$articleId} not found.");
                return self::FAILURE;
            }
        }

        $articles = $query->get();
        $updated = 0;

        foreach ($articles as $article) {
            $likesCount = MarketReaction::query()
                ->where('article_id', $article->id)
                ->where('type', 'like')
                ->count();

            $savesCount = MarketReaction::query()
                ->where('article_id', $article->id)
                ->where('type', 'save')
                ->count();

            $helpfulCount = MarketReaction::query()
                ->where('article_id', $article->id)
                ->where('type', 'helpful')
                ->count();

            $commentsCount = MarketComment::query()
                ->where('article_id', $article->id)
                ->whereNull('parent_id')
                ->where('status', 'approved')
                ->count();

            $drifted = (
                (int) $article->likes_count !== $likesCount
                || (int) $article->saves_count !== $savesCount
                || (int) $article->helpful_count !== $helpfulCount
                || (int) $article->comments_count !== $commentsCount
            );

            if (!$drifted) {
                continue;
            }

            $this->line(sprintf(
                'Article %d: likes %d→%d, saves %d→%d, helpful %d→%d, comments %d→%d',
                $article->id,
                $article->likes_count,
                $likesCount,
                $article->saves_count,
                $savesCount,
                $article->helpful_count,
                $helpfulCount,
                $article->comments_count,
                $commentsCount
            ));

            if (!$dryRun) {
                DB::table('market_articles')->where('id', $article->id)->update([
                    'likes_count'   => $likesCount,
                    'saves_count'   => $savesCount,
                    'helpful_count' => $helpfulCount,
                    'comments_count' => $commentsCount,
                ]);
                $updated++;
            } else {
                $updated++;
            }
        }

        if ($updated === 0) {
            $this->info('No articles needed counter updates.');
            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->info("[Dry run] Would update {$updated} article(s). Run without --dry-run to apply.");
        } else {
            $this->info("Updated counters for {$updated} article(s).");
        }

        return self::SUCCESS;
    }
}
