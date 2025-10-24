"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  getUserNotifications, 
  markNotificationRead, 
  markAllNotificationsRead,
  type NotificationData 
} from "@/lib/notifications"
import { formatDistanceToNow } from "date-fns"
import {
  Gift,
  CheckCircle2,
  Calendar,
  Star,
  XCircle,
  AlertCircle,
  CreditCard,
  Package,
  User,
  Bell,
  Heart,
  ThumbsDown
} from "lucide-react"

interface NotificationListProps {
  userId: string
  onClose: () => void
}

export function NotificationList({ userId, onClose }: NotificationListProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [userId])

  const fetchNotifications = async () => {
    setIsLoading(true)
    const data = await getUserNotifications(userId, 20)
    setNotifications(data)
    setIsLoading(false)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markNotificationRead(notificationId)
    if (success) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true)
    const success = await markAllNotificationsRead(userId)
    if (success) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )
    }
    setIsMarkingAllRead(false)
  }

  const handleNotificationClick = async (notification: NotificationData) => {
    // Mark as read
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id)
    }

    // Navigate based on notification type and data
    let navigationPath: string | null = null

    switch (notification.type) {
      case 'gift_received':
        // Navigate to gift claim page if token is available
        if (notification.data?.token) {
          navigationPath = `/gift/claim/${notification.data.token}`
        } else {
          navigationPath = '/gift'
        }
        break
      
      case 'payment_confirmed':
      case 'booking_confirmed':
      case 'order_completed':
        // Navigate to order details if order_id is available
        if (notification.data?.order_id) {
          navigationPath = `/order/${notification.data.order_id}`
        } else {
          navigationPath = '/dashboard'
        }
        break
      
      case 'booking_cancelled':
        // Navigate to dashboard to see cancelled bookings
        navigationPath = '/dashboard'
        break
      
      case 'vendor_verified':
      case 'vendor_rejected':
        // Navigate to vendor dashboard
        navigationPath = '/vendor/dashboard'
        break
      
      case 'new_review':
        // Navigate to vendor reviews or dashboard
        navigationPath = '/vendor/dashboard'
        break
      
      case 'new_booking':
        // Navigate to vendor bookings
        navigationPath = '/vendor/dashboard'
        break
      
      case 'new_like':
      case 'new_dislike':
        // Navigate to vendor profile
        navigationPath = '/vendor/dashboard'
        break
      
      case 'payment_failed':
        // Navigate to cart or payment page
        navigationPath = '/cart'
        break
      
      case 'ticket_verified':
        // Navigate to order details if order_id is available
        if (notification.data?.order_id) {
          navigationPath = `/order/${notification.data.order_id}`
        } else {
          navigationPath = '/dashboard'
        }
        break
      
      default:
        // Default to dashboard
        navigationPath = '/dashboard'
    }

    // Navigate if path is set
    if (navigationPath) {
      onClose()
      router.push(navigationPath)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'gift_received':
        return <Gift className="h-4 w-4 text-pink-500" />
      case 'payment_confirmed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'booking_confirmed':
        return <Calendar className="h-4 w-4 text-blue-500" />
      case 'booking_cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'vendor_verified':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'vendor_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'new_review':
        return <Star className="h-4 w-4 text-yellow-500" />
      case 'new_booking':
        return <Package className="h-4 w-4 text-blue-500" />
      case 'new_like':
        return <Heart className="h-4 w-4 text-pink-500" />
      case 'new_dislike':
        return <ThumbsDown className="h-4 w-4 text-red-500" />
      case 'payment_failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'ticket_verified':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'order_completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-blue-500'
      case 'low':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="max-h-96">
      {unreadCount > 0 && (
        <div className="p-3 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
            className="w-full"
          >
            {isMarkingAllRead ? "Marking..." : `Mark all ${unreadCount} as read`}
          </Button>
        </div>
      )}
      
      <ScrollArea className="h-80">
        <div className="p-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                notification.is_read 
                  ? 'bg-muted/50 hover:bg-muted border border-border' 
                  : 'bg-accent/10 hover:bg-accent/20 border-2 border-primary shadow-sm'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-sm font-medium ${
                      notification.is_read ? 'text-gray-600' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-1">
                      {!notification.is_read && (
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className={`text-sm mt-1 ${
                    notification.is_read ? 'text-gray-500' : 'text-gray-800'
                  }`}>
                    {notification.message}
                  </p>
                  
                  {notification.data && (
                    <div className="mt-2 text-xs text-gray-600">
                      {notification.data.order_id && (
                        <span>Order: {notification.data.order_id}</span>
                      )}
                      {notification.data.booking_id && (
                        <span>Booking: {notification.data.booking_id}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t">
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <a href="/notifications" onClick={onClose}>
            View All Notifications
          </a>
        </Button>
      </div>
    </div>
  )
}
