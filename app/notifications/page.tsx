"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
  BellRing,
  CheckCheck
} from "lucide-react"
import { sanitizeUserInput } from "@/lib/sanitize"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setIsLoading(true)
      const data = await getUserNotifications(user.id, 100)
      setNotifications(data)
      setIsLoading(false)
    }

    fetchNotifications()
  }, [router, supabase])

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
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    setIsMarkingAllRead(true)
    const success = await markAllNotificationsRead(user.id)
    if (success) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )
    }
    setIsMarkingAllRead(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'gift_received':
        return <Gift className="h-5 w-5 text-pink-500" />
      case 'payment_confirmed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'booking_confirmed':
        return <Calendar className="h-5 w-5 text-blue-500" />
      case 'booking_cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'vendor_verified':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'vendor_rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'new_review':
        return <Star className="h-5 w-5 text-yellow-500" />
      case 'new_booking':
        return <Package className="h-5 w-5 text-blue-500" />
      case 'payment_failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'ticket_verified':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'order_completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
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

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-card rounded w-1/4 mb-8" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 bg-card rounded" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                Stay updated with your account activity
              </p>
            </div>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                {isMarkingAllRead ? "Marking..." : `Mark all ${unreadCount} as read`}
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                <p className="text-muted-foreground">
                  You're all caught up! New notifications will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-colors bg-background ${
                    notification.is_read 
                      ? 'hover:bg-muted border-border' 
                      : 'border-primary hover:bg-accent/10 shadow-sm'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className={`font-semibold ${
                            notification.is_read ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {sanitizeUserInput(notification.title)}
                          </h3>
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                            )}
                            <Badge variant="outline" className="text-xs">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className={`mb-3 ${
                          notification.is_read ? 'text-gray-500' : 'text-gray-800'
                        }`}>
                          {sanitizeUserInput(notification.message)}
                        </p>
                        
                        {notification.data && (
                          <div className="text-sm text-gray-600 mb-3">
                            {notification.data.order_id && (
                              <span>Order: {notification.data.order_id}</span>
                            )}
                            {notification.data.booking_id && (
                              <span>Booking: {notification.data.booking_id}</span>
                            )}
                          </div>
                        )}
                        
                        {!notification.is_read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
