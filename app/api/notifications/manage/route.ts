import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { action, userId, notificationId, daysOld } = await request.json()

    if (!action || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    switch (action) {
      case 'archive_old':
        const { data: archiveResult, error: archiveError } = await supabase
          .rpc('archive_old_notifications', { days_old: daysOld || 30 })

        if (archiveError) {
          console.error('Error archiving notifications:', archiveError)
          return NextResponse.json({ error: 'Failed to archive notifications' }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          message: `Archived ${archiveResult} old notifications`,
          count: archiveResult
        })

      case 'cleanup_old':
        const { data: cleanupResult, error: cleanupError } = await supabase
          .rpc('cleanup_old_archived_notifications', { days_old: daysOld || 90 })

        if (cleanupError) {
          console.error('Error cleaning up notifications:', cleanupError)
          return NextResponse.json({ error: 'Failed to cleanup notifications' }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          message: `Cleaned up ${cleanupResult} old archived notifications`,
          count: cleanupResult
        })

      case 'get_stats':
        const { data: stats, error: statsError } = await supabase
          .rpc('get_notification_stats', { user_uuid: userId })

        if (statsError) {
          console.error('Error getting notification stats:', statsError)
          return NextResponse.json({ error: 'Failed to get notification stats' }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          stats: stats[0] || {}
        })

      case 'get_with_archive':
        const { includeArchived = false, limit = 50, offset = 0 } = await request.json()
        
        const { data: notifications, error: notificationsError } = await supabase
          .rpc('get_user_notifications_with_archive', {
            user_uuid: userId,
            include_archived: includeArchived,
            limit_count: limit,
            offset_count: offset
          })

        if (notificationsError) {
          console.error('Error getting notifications with archive:', notificationsError)
          return NextResponse.json({ error: 'Failed to get notifications' }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          notifications: notifications || []
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in notification management:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    if (action === 'stats') {
      const { data: stats, error: statsError } = await supabase
        .rpc('get_notification_stats', { user_uuid: userId })

      if (statsError) {
        console.error('Error getting notification stats:', statsError)
        return NextResponse.json({ error: 'Failed to get notification stats' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        stats: stats[0] || {}
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in notification management GET:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
