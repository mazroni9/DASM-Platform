<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrganizationController extends Controller
{
    public function index(Request $request)
    {
        $query = Organization::with('owner')->withCount('members');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('type', 'like', "%{$search}%");
        }

        $organizations = $query->paginate(10);

        return response()->json($organizations);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'owner_id' => 'required|exists:users,id',
            'type' => 'required|string',
            'status' => 'required|in:active,pending,inactive',
            'description' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(4);

        $organization = Organization::create($validated);

        // Update user's organization_id
        $user = User::find($validated['owner_id']);
        if ($user) {
            $user->organization_id = $organization->id;
            $user->save();
        }

        return response()->json($organization, 201);
    }

    public function show($id)
    {
        $organization = Organization::with('owner')->withCount('members')->findOrFail($id);
        return response()->json($organization);
    }

    public function update(Request $request, $id)
    {
        $organization = Organization::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'owner_id' => 'sometimes|exists:users,id',
            'type' => 'sometimes|string',
            'status' => 'sometimes|in:active,pending,inactive',
            'description' => 'nullable|string',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(4);
        }

        $organization->update($validated);

        if (isset($validated['owner_id'])) {
            // Update user's organization_id if owner changed
            $user = User::find($validated['owner_id']);
            if ($user) {
                $user->organization_id = $organization->id;
                $user->save();
            }
        }

        return response()->json($organization);
    }

    public function destroy($id)
    {
        $organization = Organization::findOrFail($id);
        $organization->delete();
        return response()->json(['message' => 'Organization deleted']);
    }

    /**
     * Get members of the organization.
     */
    public function getMembers($id)
    {
        $organization = Organization::findOrFail($id);
        $members = $organization->members()->with('roles')->paginate(10);
        return response()->json($members);
    }

    /**
     * Add a member to the organization.
     */
    public function addMember(Request $request, $id)
    {
        $organization = Organization::findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($validated['user_id']);
        $user->organization_id = $organization->id;
        $user->save();

        return response()->json(['message' => 'Member added successfully', 'user' => $user]);
    }

    /**
     * Remove a member from the organization.
     */
    public function removeMember($id, $userId)
    {
        $organization = Organization::findOrFail($id);
        $user = User::where('organization_id', $organization->id)->findOrFail($userId);

        // Prevent removing the owner
        if ($organization->owner_id == $user->id) {
            return response()->json(['message' => 'Cannot remove the owner from the organization'], 403);
        }

        $user->organization_id = null;
        $user->save();

        return response()->json(['message' => 'Member removed successfully']);
    }
}
