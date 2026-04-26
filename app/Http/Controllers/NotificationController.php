<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('notifications/index', [
            'all_notifications' => $request->user()->notifications()->paginate(20),
            'breadcrumbs' => [
                ['title' => 'Notifications', 'href' => route('notifications.index')],
            ],
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        if ($request->header('X-Inertia')) {
            return back();
        }

        return redirect()->back();
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        if ($request->header('X-Inertia')) {
            return back();
        }

        return redirect()->back();
    }
}
