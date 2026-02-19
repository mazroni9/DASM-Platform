<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Auth\AuthController as NestedAuthController;

/**
 * Compatibility alias for cached/legacy routes that still reference
 * App\Http\Controllers\AuthController.
 */
class AuthController extends NestedAuthController
{
}
