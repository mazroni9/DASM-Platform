<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\BlogTag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    /**
     * Display a listing of blog posts
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = Blog::with(['user:id,name', 'tags']);
        
        // Filter by tag
        if ($request->has('tag')) {
            $query->whereHas('tags', function ($q) use ($request) {
                $q->where('name', $request->tag);
            });
        }
        
        // Search by title or content
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }
        
        // Sort options
        $sortField = $request->input('sort_by', 'published_at');
        $sortDirection = $request->input('sort_dir', 'desc');
        
        $query->orderBy($sortField, $sortDirection);
        
        // Only published posts for public view
        if (!$request->has('show_all') || !Auth::check() || !Auth::user()->isAdmin()) {
            $query->where('status', 'published');
        }
        
        $posts = $query->paginate(10);
        
        return response()->json([
            'status' => 'success',
            'data' => $posts
        ]);
    }

    /**
     * Store a newly created blog post
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Check if user has permission to create posts
        if (!Auth::user()->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'You do not have permission to create blog posts'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'excerpt' => 'nullable|string|max:500',
            'status' => 'required|in:draft,published',
            'image' => 'nullable|image|max:2048', // 2MB max
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Generate slug from title
        $slug = Str::slug($request->title);
        $uniqueSlug = $slug;
        $counter = 1;
        
        // Ensure slug is unique
        while (Blog::where('slug', $uniqueSlug)->exists()) {
            $uniqueSlug = $slug . '-' . $counter;
            $counter++;
        }
        
        $post = new Blog();
        $post->title = $request->title;
        $post->slug = $uniqueSlug;
        $post->content = $request->content;
        $post->excerpt = $request->excerpt ?? Str::limit(strip_tags($request->content), 200);
        $post->status = $request->status;
        $post->user_id = Auth::id();
        
        // Handle image upload if present
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('blog', 'public');
            $post->image = $imagePath;
        }
        
        $post->save();
        
        // Handle tags
        if ($request->has('tags') && is_array($request->tags)) {
            $tags = [];
            
            foreach ($request->tags as $tagName) {
                // Find or create tag
                $tag = BlogTag::firstOrCreate(['name' => $tagName]);
                $tags[] = $tag->id;
            }
            
            $post->tags()->sync($tags);
        }
        
        return response()->json([
            'status' => 'success',
            'message' => 'Blog post created successfully',
            'data' => $post->load(['user:id,name', 'tags'])
        ], 201);
    }

    /**
     * Display the specified blog post
     *
     * @param string $slug
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($slug)
    {
        $post = Blog::with(['user:id,name', 'tags'])
            ->where('slug', $slug)
            ->first();
            
        if (!$post) {
            return response()->json([
                'status' => 'error',
                'message' => 'Blog post not found'
            ], 404);
        }
        
        // Check if non-published post can be viewed
        if ($post->status !== 'published' && (!Auth::check() || !Auth::user()->isAdmin())) {
            return response()->json([
                'status' => 'error',
                'message' => 'Blog post not available'
            ], 403);
        }
        
        // Increment view count
        $post->increment('views');
        
        return response()->json([
            'status' => 'success',
            'data' => $post
        ]);
    }

    /**
     * Update the specified blog post
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $post = Blog::find($id);
        
        if (!$post) {
            return response()->json([
                'status' => 'error',
                'message' => 'Blog post not found'
            ], 404);
        }
        
        // Check if user has permission to update the post
        if (!Auth::user()->isAdmin() && $post->user_id !== Auth::id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'You do not have permission to update this blog post'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'excerpt' => 'nullable|string|max:500',
            'status' => 'sometimes|in:draft,published',
            'image' => 'nullable|image|max:2048', // 2MB max
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Update slug if title changed
        if ($request->has('title') && $request->title !== $post->title) {
            $slug = Str::slug($request->title);
            $uniqueSlug = $slug;
            $counter = 1;
            
            // Ensure slug is unique
            while (Blog::where('slug', $uniqueSlug)->where('id', '!=', $id)->exists()) {
                $uniqueSlug = $slug . '-' . $counter;
                $counter++;
            }
            
            $post->slug = $uniqueSlug;
        }
        
        // Update fields
        if ($request->has('title')) $post->title = $request->title;
        if ($request->has('content')) $post->content = $request->content;
        if ($request->has('excerpt')) {
            $post->excerpt = $request->excerpt;
        } else if ($request->has('content')) {
            $post->excerpt = Str::limit(strip_tags($request->content), 200);
        }
        if ($request->has('status')) $post->status = $request->status;
        
        // Handle image upload if present
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('blog', 'public');
            $post->image = $imagePath;
        }
        
        $post->save();
        
        // Handle tags
        if ($request->has('tags') && is_array($request->tags)) {
            $tags = [];
            
            foreach ($request->tags as $tagName) {
                // Find or create tag
                $tag = BlogTag::firstOrCreate(['name' => $tagName]);
                $tags[] = $tag->id;
            }
            
            $post->tags()->sync($tags);
        }
        
        return response()->json([
            'status' => 'success',
            'message' => 'Blog post updated successfully',
            'data' => $post->load(['user:id,name', 'tags'])
        ]);
    }

    /**
     * Remove the specified blog post
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $post = Blog::find($id);
        
        if (!$post) {
            return response()->json([
                'status' => 'error',
                'message' => 'Blog post not found'
            ], 404);
        }
        
        // Check if user has permission to delete the post
        if (!Auth::user()->isAdmin() && $post->user_id !== Auth::id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'You do not have permission to delete this blog post'
            ], 403);
        }
        
        // Delete the post (and related tags through pivot table)
        $post->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Blog post deleted successfully'
        ]);
    }
    
    /**
     * Get all tags
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function tags()
    {
        $tags = BlogTag::withCount('posts')->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $tags
        ]);
    }
    
    /**
     * Get latest posts
     *
     * @param int $count
     * @return \Illuminate\Http\JsonResponse
     */
    public function latest($count = 3)
    {
        $posts = Blog::with(['user:id,name', 'tags'])
            ->where('status', 'published')
            ->orderBy('published_at', 'desc')
            ->take($count)
            ->get();
            
        return response()->json([
            'status' => 'success',
            'data' => $posts
        ]);
    }
}