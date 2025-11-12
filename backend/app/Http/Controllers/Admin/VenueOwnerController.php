<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;

class VenueOwnerController extends Controller
{
    /**
     * GET /admin/venue-owners
     * يدعم:
     * - search, status, is_active, sort_by, sort_dir, per_page, page
     */
    public function index(Request $request)
    {
        try {
            // تأكد من وجود الجدول أصلاً
            if (!Schema::hasTable('venue_owners')) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Table "venue_owners" does not exist.',
                ], 500);
            }

            $perPage = max(1, min((int)$request->query('per_page', 15), 100));
            $page    = max(1, (int)$request->query('page', 1));

            // الأعمدة المتاحة فعليًا في الجدول
            $voCols = Schema::getColumnListing('venue_owners');
            $has = function (string $col) use ($voCols) {
                return in_array($col, $voCols, true);
            };

            // هل جدول المستخدمين موجود؟
            $usersExists = Schema::hasTable('users');
            $userHasName  = $usersExists && Schema::hasColumn('users', 'name');
            $userHasEmail = $usersExists && Schema::hasColumn('users', 'email');

            // الأعمدة التي سنرجعها (حسب المتاح)
            $select = [];
            $want = ['id','user_id','venue_name','commercial_registry','description','status','is_active','created_at','updated_at'];
            foreach ($want as $c) {
                if ($has($c)) $select[] = "vo.$c";
            }

            // لو عندنا users.name/email أضفهم
            if ($userHasName)  $select[] = DB::raw('u.name  as user_name');
            if ($userHasEmail) $select[] = DB::raw('u.email as user_email');

            // أقل شيء لازم نختار id لو موجود
            if (empty($select)) {
                // fallback لأحد الأعمدة الموجودة
                $any = $voCols[0] ?? 'id';
                $select[] = "vo.$any";
            }

            $query = DB::table('venue_owners as vo');

            if ($usersExists && ($userHasName || $userHasEmail)) {
                $query->leftJoin('users as u', 'u.id', '=', 'vo.user_id');
            }

            $query->select($select);

            // البحث
            if ($search = trim((string) $request->query('search', ''))) {
                $like = "%{$search}%";
                $query->where(function ($q) use ($like, $has, $userHasName, $userHasEmail) {
                    if ($has('venue_name'))           $q->orWhere('vo.venue_name', 'like', $like);
                    if ($has('commercial_registry'))  $q->orWhere('vo.commercial_registry', 'like', $like);
                    if ($has('description'))          $q->orWhere('vo.description', 'like', $like);
                    if ($userHasName)                 $q->orWhere('u.name', 'like', $like);
                    if ($userHasEmail)                $q->orWhere('u.email', 'like', $like);
                });
            }

            // فلترة الحالة
            if (($status = $request->query('status')) !== null && $status !== '' && $has('status')) {
                $query->where('vo.status', $status);
            }

            // فلترة التفعيل
            $isActiveParam = $request->query('is_active');
            if ($isActiveParam !== null && $isActiveParam !== '' && $has('is_active')) {
                $normalized = strtolower((string) $isActiveParam);
                if (in_array($normalized, ['1','true','yes','y'], true)) {
                    $query->where('vo.is_active', 1);
                } elseif (in_array($normalized, ['0','false','no','n'], true)) {
                    $query->where('vo.is_active', 0);
                }
            }

            // الترتيب — اسمح فقط بالأعمدة الموجودة فعلاً
            $allowedSort = [];
            foreach (['id','venue_name','status','is_active','created_at','updated_at'] as $c) {
                if ($has($c)) $allowedSort[] = "vo.$c";
            }
            if ($userHasName) $allowedSort[] = 'u.name';

            // اختر افتراضي مناسب
            $defaultSort = $has('id') ? 'vo.id' : ($allowedSort[0] ?? null);

            $sortBy  = $request->query('sort_by', $defaultSort);
            if (!in_array($sortBy, $allowedSort, true)) {
                $sortBy = $defaultSort;
            }

            $sortDir = strtolower($request->query('sort_dir', 'desc'));
            if (!in_array($sortDir, ['asc','desc'], true)) $sortDir = 'desc';

            if ($sortBy) $query->orderBy($sortBy, $sortDir);

            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'ok'      => true,
                'filters' => [
                    'search'    => $search ?: null,
                    'status'    => $status ?? null,
                    'is_active' => $isActiveParam ?? null,
                    'sort_by'   => $sortBy,
                    'sort_dir'  => $sortDir,
                    'per_page'  => $perPage,
                ],
                'data' => $paginator->items(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page'     => $paginator->perPage(),
                    'total'        => $paginator->total(),
                    'last_page'    => $paginator->lastPage(),
                ],
            ], 200);

        } catch (QueryException $e) {
            Log::error('VenueOwnerController@index DB error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'ok' => false,
                'message' => 'Database error while listing venue owners.',
            ], 500);
        } catch (\Throwable $e) {
            Log::error('VenueOwnerController@index error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'ok' => false,
                'message' => 'Unexpected server error.',
            ], 500);
        }
    }

    /**
     * GET /admin/venue-owners/{id}
     */
    public function show(int $id)
    {
        try {
            if (!Schema::hasTable('venue_owners')) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Table "venue_owners" does not exist.',
                ], 500);
            }

            $voCols = Schema::getColumnListing('venue_owners');
            $has = function (string $c) use ($voCols) {
                return in_array($c, $voCols, true);
            };

            $usersExists = Schema::hasTable('users');
            $userHasName  = $usersExists && Schema::hasColumn('users', 'name');
            $userHasEmail = $usersExists && Schema::hasColumn('users', 'email');

            $select = [];
            $want = ['id','user_id','venue_name','commercial_registry','description','status','is_active','created_at','updated_at'];
            foreach ($want as $c) {
                if ($has($c)) $select[] = "vo.$c";
            }
            if ($userHasName)  $select[] = DB::raw('u.name  as user_name');
            if ($userHasEmail) $select[] = DB::raw('u.email as user_email');

            if (empty($select)) {
                $any = $voCols[0] ?? 'id';
                $select[] = "vo.$any";
            }

            $query = DB::table('venue_owners as vo');
            if ($usersExists && ($userHasName || $userHasEmail)) {
                $query->leftJoin('users as u', 'u.id', '=', 'vo.user_id');
            }

            $row = $query->select($select)->where('vo.id', $id)->first();

            if (!$row) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Venue owner not found',
                ], 404);
            }

            return response()->json([
                'ok'   => true,
                'data' => $row,
            ], 200);

        } catch (QueryException $e) {
            Log::error('VenueOwnerController@show DB error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'ok' => false,
                'message' => 'Database error while fetching venue owner.',
            ], 500);
        } catch (\Throwable $e) {
            Log::error('VenueOwnerController@show error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'ok' => false,
                'message' => 'Unexpected server error.',
            ], 500);
        }
    }
}
