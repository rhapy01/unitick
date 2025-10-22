/**
 * Web Push Notifications using browser native APIs
 * Free to use - no external services required
 */

export interface PushNotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: any
  actions?: NotificationAction[]
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

/**
 * Check if push notifications are supported and enabled
 */
export function isPushNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator
}

/**
 * Check current notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  return Notification.permission
}

/**
 * Show a push notification
 */
export async function showPushNotification(data: PushNotificationData): Promise<Notification | null> {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications not supported')
    return null
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted')
    return null
  }

  try {
    const notification = new Notification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      image: data.image,
      data: data.data,
      actions: data.actions,
      tag: 'unitick-notification',
      requireInteraction: false,
      silent: false,
    })

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)

    // Handle click
    notification.onclick = (event) => {
      event.preventDefault()
      window.focus()
      
      // Handle different notification types
      if (data.data?.type === 'gift_received' && data.data?.token) {
        window.open(`/gift/claim/${data.data.token}`, '_blank')
      } else if (data.data?.type === 'payment_confirmed') {
        window.open('/dashboard', '_blank')
      } else {
        window.open('/notifications', '_blank')
      }
      
      notification.close()
    }

    return notification
  } catch (error) {
    console.error('Error showing push notification:', error)
    return null
  }
}

/**
 * Show notification based on type
 */
export async function showNotificationByType(
  type: string,
  title: string,
  message: string,
  data?: any
): Promise<Notification | null> {
  const notificationData: PushNotificationData = {
    title,
    body: message,
    icon: '/favicon.ico',
    data: { type, ...data },
  }

  // Add type-specific configurations
  switch (type) {
    case 'gift_received':
      notificationData.icon = '/icons/gift.png'
      notificationData.actions = [
        {
          action: 'claim',
          title: 'Claim Gift',
          icon: '/icons/gift.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
      break
    
    case 'payment_confirmed':
      notificationData.icon = '/icons/check.png'
      notificationData.actions = [
        {
          action: 'view',
          title: 'View Tickets',
          icon: '/icons/ticket.png'
        }
      ]
      break
    
    case 'booking_confirmed':
      notificationData.icon = '/icons/calendar.png'
      break
    
    case 'payment_failed':
      notificationData.icon = '/icons/error.png'
      notificationData.actions = [
        {
          action: 'retry',
          title: 'Retry Payment',
          icon: '/icons/retry.png'
        }
      ]
      break
  }

  return showPushNotification(notificationData)
}

/**
 * Initialize push notification service
 */
export async function initializePushNotifications(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false
  }

  // Request permission on first visit
  const hasPermission = await requestPushPermission()
  
  if (hasPermission) {
    console.log('Push notifications enabled')
    return true
  } else {
    console.log('Push notifications disabled by user')
    return false
  }
}

/**
 * Show a test notification
 */
export async function showTestNotification(): Promise<boolean> {
  const success = await showNotificationByType(
    'test',
    'Test Notification',
    'Push notifications are working!',
    { test: true }
  )
  
  return success !== null
}
