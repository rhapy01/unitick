"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  requestPushPermission, 
  isPushNotificationSupported, 
  getNotificationPermission,
  showTestNotification 
} from "@/lib/push-notifications"
import { Bell, BellOff, Smartphone, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function PushNotificationSettings() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isRequesting, setIsRequesting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsSupported(isPushNotificationSupported())
    setPermission(getNotificationPermission())
  }, [])

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    
    try {
      const granted = await requestPushPermission()
      setPermission(getNotificationPermission())
      
      if (granted) {
        toast({
          title: "Permission Granted",
          description: "Push notifications are now enabled",
        })
      } else {
        toast({
          title: "Permission Denied",
          description: "Push notifications are disabled. You can enable them in your browser settings.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive",
      })
    } finally {
      setIsRequesting(false)
    }
  }

  const handleTestNotification = async () => {
    setIsTesting(true)
    
    try {
      const success = await showTestNotification()
      
      if (success) {
        toast({
          title: "Test Sent",
          description: "Check for a test notification",
        })
      } else {
        toast({
          title: "Test Failed",
          description: "Could not send test notification",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          text: 'Enabled',
          color: 'bg-green-500',
          description: 'You will receive push notifications'
        }
      case 'denied':
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          text: 'Disabled',
          color: 'bg-red-500',
          description: 'Push notifications are blocked. Enable them in browser settings.'
        }
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
          text: 'Not Set',
          color: 'bg-yellow-500',
          description: 'Click "Enable Push Notifications" to get started'
        }
    }
  }

  const status = getPermissionStatus()

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <BellOff className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">Not Supported</p>
              <p className="text-sm text-gray-600">
                Your browser doesn't support push notifications
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {status.icon}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Status</p>
                <Badge className={`${status.color} text-white`}>
                  {status.text}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {status.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {permission !== 'granted' && (
            <Button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="flex-1"
            >
              <Bell className="mr-2 h-4 w-4" />
              {isRequesting ? "Requesting..." : "Enable Push Notifications"}
            </Button>
          )}
          
          {permission === 'granted' && (
            <Button
              variant="outline"
              onClick={handleTestNotification}
              disabled={isTesting}
              className="flex-1"
            >
              {isTesting ? "Sending..." : "Send Test Notification"}
            </Button>
          )}
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>How it works:</strong> Push notifications appear even when you're not on the site. 
            They're perfect for important updates like payment confirmations and gift notifications.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
