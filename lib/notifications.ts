/**
 * Notification system for the app
 * Handles both in-app notifications and email notifications
 */

import { createClient } from "@/lib/supabase/client"

export type NotificationType =
  | 'gift_received'
  | 'payment_confirmed'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'vendor_verified'
  | 'vendor_rejected'
  | 'new_review'
  | 'new_booking'
  | 'new_like'
  | 'new_dislike'
  | 'payment_failed'
  | 'ticket_verified'
  | 'order_completed'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface NotificationData {
  id: string
  user_id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  data?: any
  is_read: boolean
  is_email_sent: boolean
  email_sent_at?: string
  created_at: string
  updated_at: string
}

export interface CreateNotificationParams {
  user_id: string
  type: NotificationType
  priority?: NotificationPriority
  title: string
  message: string
  data?: any
  send_email?: boolean
}

/**
 * Create a new notification
 */
export async function createNotification(params: CreateNotificationParams): Promise<NotificationData | null> {
  const supabase = createClient()
  
  // Check user preferences before creating notification
  const { data: preferences } = await supabase
    .rpc('get_user_notification_preferences', { user_uuid: params.user_id })
  
  const userPreference = preferences?.find((p: any) => p.notification_type === params.type)
  
  // If user has disabled in-app notifications for this type, don't create
  if (userPreference && !userPreference.in_app_enabled) {
    console.log(`In-app notifications disabled for ${params.type} for user ${params.user_id}`)
    // Still send email if enabled and requested
    if (params.send_email && userPreference.email_enabled) {
      await sendNotificationEmailDirect(params.user_id, params.type, params.title, params.message, params.data)
    }
    return null
  }
  
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: params.user_id,
      type: params.type,
      priority: params.priority || 'medium',
      title: params.title,
      message: params.message,
      data: params.data || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating notification:', error)
    return null
  }

  // Send email if requested and user has email enabled
  if (params.send_email && (!userPreference || userPreference.email_enabled)) {
    await sendNotificationEmail(data)
  }

  // Send push notification if user has push enabled
  if (!userPreference || userPreference.push_enabled) {
    await sendPushNotification(data)
  }

  return data
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<NotificationData[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return data || []
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }

  return true
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }

  return true
}

/**
 * Send push notification
 */
async function sendPushNotification(notification: NotificationData): Promise<boolean> {
  try {
    // Import push notification functions dynamically to avoid SSR issues
    const { showNotificationByType } = await import('@/lib/push-notifications')
    
    await showNotificationByType(
      notification.type,
      notification.title,
      notification.message,
      notification.data
    )
    
    return true
  } catch (error) {
    console.error('Error sending push notification:', error)
    return false
  }
}

/**
 * Send email notification directly (without creating in-app notification)
 */
async function sendNotificationEmailDirect(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: any
): Promise<boolean> {
  try {
    // Get user email
    const supabase = createClient()
    const { data: user } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (!user?.email) {
      console.error('User email not found for notification')
      return false
    }

    // Send email
    const emailResult = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.email,
        type,
        title,
        message,
        data,
      }),
    })

    return emailResult.ok
  } catch (error) {
    console.error('Error sending direct email notification:', error)
    return false
  }
}

/**
 * Send email notification
 */
async function sendNotificationEmail(notification: NotificationData): Promise<boolean> {
  try {
    // Get user email
    const supabase = createClient()
    const { data: user } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', notification.user_id)
      .single()

    if (!user?.email) {
      console.error('User email not found for notification')
      return false
    }

    // Send email based on notification type
    const emailResult = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.email,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
      }),
    })

    if (!emailResult.ok) {
      console.error('Failed to send notification email')
      return false
    }

    // Mark email as sent
    await supabase
      .from('notifications')
      .update({ 
        is_email_sent: true, 
        email_sent_at: new Date().toISOString() 
      })
      .eq('id', notification.id)

    return true
  } catch (error) {
    console.error('Error sending notification email:', error)
    return false
  }
}

/**
 * Predefined notification templates
 */
export const NOTIFICATION_TEMPLATES = {
  gift_received: {
    title: "🎁 You Received a Gift!",
    message: "Someone has sent you a gift. Click to claim your NFT tickets.",
    priority: 'high' as NotificationPriority,
  },
  payment_confirmed: {
    title: "✅ Payment Confirmed",
    message: "Your payment has been processed successfully. Your tickets are ready!",
    priority: 'high' as NotificationPriority,
  },
  booking_confirmed: {
    title: "🎫 Booking Confirmed",
    message: "Your booking has been confirmed. Check your tickets in your dashboard.",
    priority: 'medium' as NotificationPriority,
  },
  booking_cancelled: {
    title: "❌ Booking Cancelled",
    message: "Your booking has been cancelled. Refund will be processed within 3-5 business days.",
    priority: 'high' as NotificationPriority,
  },
  vendor_verified: {
    title: "✅ Vendor Verified",
    message: "Congratulations! Your vendor account has been verified.",
    priority: 'high' as NotificationPriority,
  },
  vendor_rejected: {
    title: "❌ Vendor Verification Rejected",
    message: "Your vendor verification has been rejected. Please check your details and try again.",
    priority: 'high' as NotificationPriority,
  },
  new_review: {
    title: "⭐ New Review",
    message: "You received a new review from a customer.",
    priority: 'medium' as NotificationPriority,
  },
  new_booking: {
    title: "📅 New Booking",
    message: "You have a new booking for your service.",
    priority: 'high' as NotificationPriority,
  },
  new_like: {
    title: "💖 New Like",
    message: "Someone liked your vendor profile.",
    priority: 'low' as NotificationPriority,
  },
  new_dislike: {
    title: "👎 New Dislike",
    message: "Someone disliked your vendor profile.",
    priority: 'low' as NotificationPriority,
  },
  payment_failed: {
    title: "❌ Payment Failed",
    message: "Your payment could not be processed. Please try again.",
    priority: 'urgent' as NotificationPriority,
  },
  ticket_verified: {
    title: "✅ Ticket Verified",
    message: "Your ticket has been successfully verified.",
    priority: 'medium' as NotificationPriority,
  },
  order_completed: {
    title: "🎉 Order Completed",
    message: "Your order has been completed successfully. Thank you for using our platform!",
    priority: 'medium' as NotificationPriority,
  },
}

/**
 * Helper function to create notifications using templates
 */
export async function createNotificationFromTemplate(
  userId: string,
  type: NotificationType,
  data?: any,
  sendEmail: boolean = true
): Promise<NotificationData | null> {
  const template = NOTIFICATION_TEMPLATES[type]

  if (!template) {
    console.error(`Template not found for notification type: ${type}`)
    console.error('Available templates:', Object.keys(NOTIFICATION_TEMPLATES))
    return null
  }

  return createNotification({
    user_id: userId,
    type,
    priority: template.priority,
    title: template.title,
    message: template.message,
    data,
    send_email: sendEmail,
  })
}
