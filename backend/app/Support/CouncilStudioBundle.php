<?php

namespace App\Support;

/**
 * Maps operational request bundles to Spatie permission names (platform team context).
 */
final class CouncilStudioBundle
{
    public const WRITER = 'writer';

    public const EDITOR = 'editor';

    public const PUBLISHER = 'publisher';

    public const MODERATOR = 'moderator';

    /** @return list<string> */
    public static function permissionNames(string $bundle): array
    {
        return match ($bundle) {
            self::WRITER => [
                'council.studio.access',
                'council.article.create',
                'council.article.edit_own',
                'council.article.submit_review',
            ],
            self::EDITOR => [
                'council.studio.access',
                'council.article.create',
                'council.article.edit_own',
                'council.article.edit_any',
                'council.article.review',
            ],
            self::PUBLISHER => [
                'council.studio.access',
                'council.article.edit_any',
                'council.article.review',
                'council.article.publish',
                'council.article.unpublish',
                'council.article.feature',
            ],
            self::MODERATOR => [
                'council.studio.access',
                'council.comment.review',
                'council.reply.review',
            ],
            default => [],
        };
    }

    /** @return list<string> */
    public static function validBundles(): array
    {
        return [self::WRITER, self::EDITOR, self::PUBLISHER, self::MODERATOR];
    }
}
