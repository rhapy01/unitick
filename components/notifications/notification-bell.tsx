"use client"

import { useState, useEffect } from "react"
import { Bell, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationList } from "./notification-list"
import { getUnreadNotificationCount } from "@/lib/notifications"
import { createClient } from "@/lib/supabase/client"

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUserId()
  }, [supabase])

  useEffect(() => {
    if (!userId) return

    const fetchUnreadCount = async () => {
      const count = await getUnreadNotificationCount(userId)
      setUnreadCount(count)
    }

    fetchUnreadCount()

    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  if (!userId) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-white border-2 border-gray-200 shadow-lg" align="end">
        <DropdownMenuHeader>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-sm text-gray-600">
                {unreadCount} unread
              </span>
            )}
          </div>
        </DropdownMenuHeader>
        <NotificationList userId={userId} onClose={() => setIsOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
