<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

abstract class OptimizedController extends Controller
{
    /**
     * Optimized pagination with caching
     */
    protected function paginateWithCache(
        $query,
        Request $request,
        int $perPage = 15,
        string $cacheKey = null,
        int $cacheTtl = 300
    ): JsonResponse {
        $page = $request->get('page', 1);
        $perPage = min($request->get('per_page', $perPage), 100); // Max 100 items per page
        
        // Generate cache key if not provided
        if (!$cacheKey) {
            $cacheKey = $this->generateCacheKey($request, $query);
        }
        
        // Try to get from cache
        $cacheKeyWithPage = $cacheKey . '_page_' . $page . '_per_' . $perPage;
        $cached = Cache::get($cacheKeyWithPage);
        
        if ($cached) {
            return response()->json($cached)->header('X-Cache', 'HIT');
        }
        
        // Execute query with pagination
        $result = $query->paginate($perPage, ['*'], 'page', $page);
        
        // Transform to array for caching
        $data = [
            'data' => $result->items(),
            'pagination' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
                'from' => $result->firstItem(),
                'to' => $result->lastItem(),
            ],
            'links' => [
                'first' => $result->url(1),
                'last' => $result->url($result->lastPage()),
                'prev' => $result->previousPageUrl(),
                'next' => $result->nextPageUrl(),
            ],
        ];
        
        // Cache the result
        Cache::put($cacheKeyWithPage, $data, $cacheTtl);
        
        return response()->json($data)->header('X-Cache', 'MISS');
    }
    
    /**
     * Optimized single item with caching
     */
    protected function findWithCache(
        $query,
        $id,
        string $cacheKey = null,
        int $cacheTtl = 600
    ): JsonResponse {
        if (!$cacheKey) {
            $cacheKey = 'item_' . class_basename($query->getModel()) . '_' . $id;
        }
        
        $cached = Cache::get($cacheKey);
        
        if ($cached) {
            return response()->json($cached)->header('X-Cache', 'HIT');
        }
        
        $item = $query->find($id);
        
        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }
        
        $data = $item->toArray();
        Cache::put($cacheKey, $data, $cacheTtl);
        
        return response()->json($data)->header('X-Cache', 'MISS');
    }
    
    /**
     * Optimized collection with eager loading
     */
    protected function getWithEagerLoading(
        $query,
        array $relations = [],
        array $select = ['*'],
        int $limit = null
    ): JsonResponse {
        $query = $query->select($select);
        
        if (!empty($relations)) {
            $query = $query->with($relations);
        }
        
        if ($limit) {
            $query = $query->limit($limit);
        }
        
        $items = $query->get();
        
        return response()->json([
            'data' => $items,
            'count' => $items->count(),
        ]);
    }
    
    /**
     * Generate cache key based on request and query
     */
    protected function generateCacheKey(Request $request, $query = null): string
    {
        $key = 'api_' . $request->path();
        
        // Add query parameters
        $params = $request->query();
        if (!empty($params)) {
            $key .= '_' . md5(serialize($params));
        }
        
        // Add user ID if authenticated
        if ($request->user()) {
            $key .= '_user_' . $request->user()->id;
        }
        
        return $key;
    }
    
    /**
     * Clear related cache
     */
    protected function clearCache(string $pattern): void
    {
        // This would need Redis or a cache driver that supports pattern deletion
        // For now, we'll implement a simple version
        Cache::forget($pattern);
    }
    
    /**
     * Optimized search with full-text search
     */
    protected function searchWithFullText(
        $query,
        string $searchTerm,
        array $searchColumns = [],
        int $limit = 20
    ): JsonResponse {
        if (empty($searchColumns)) {
            return response()->json(['data' => [], 'count' => 0]);
        }
        
        $searchTerm = trim($searchTerm);
        if (strlen($searchTerm) < 2) {
            return response()->json(['data' => [], 'count' => 0]);
        }
        
        $query = $query->where(function ($q) use ($searchColumns, $searchTerm) {
            foreach ($searchColumns as $column) {
                $q->orWhere($column, 'LIKE', "%{$searchTerm}%");
            }
        });
        
        $results = $query->limit($limit)->get();
        
        return response()->json([
            'data' => $results,
            'count' => $results->count(),
            'search_term' => $searchTerm,
        ]);
    }
    
    /**
     * Batch operations for better performance
     */
    protected function batchUpdate(array $updates, string $table): JsonResponse
    {
        if (empty($updates)) {
            return response()->json(['message' => 'No updates provided'], 400);
        }
        
        try {
            DB::beginTransaction();
            
            foreach ($updates as $update) {
                if (isset($update['id']) && isset($update['data'])) {
                    DB::table($table)
                        ->where('id', $update['id'])
                        ->update($update['data']);
                }
            }
            
            DB::commit();
            
            return response()->json([
                'message' => 'Batch update completed',
                'updated_count' => count($updates),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'error' => 'Batch update failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
