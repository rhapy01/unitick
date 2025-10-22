"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, Mail, Smartphone, Save, Settings } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { 
  Gift, 
  CheckCircle2, 
  Calendar, 
  Star, 
  XCircle, 
  AlertCircle,
  CreditCard,
  Package,
  User
} from "lucide-react"
import { PushNotificationSettings } from "@/components/notifications/push-notification-settings"

interface NotificationPreference {
  notification_type: string
  email_enabled: boolean
  in_app_enabled: boolean
  push_enabled: boolean
}

const NOTIFICATION_TYPES = {
  gift_received: {
    label: "Gift Received",
    description: "When someone sends you a gift",
    icon: Gift,
    color: "text-pink-500"
  },
  payment_confirmed: {
    label: "Payment Confirmed",
    description: "When your payment is processed successfully",
    icon: CheckCircle2,
    color: "text-green-500"
  },
  booking_confirmed: {
    label: "Booking Confirmed",
    description: "When your booking is confirmed",
    icon: Calendar,
    color: "text-blue-500"
  },
  booking_cancelled: {
    label: "Booking Cancelled",
    description: "When your booking is cancelled",
    icon: XCircle,
    color: "text-red-500"
  },
  vendor_verified: {
    label: "Vendor Verified",
    description: "When your vendor account is verified",
    icon: CheckCircle2,
    color: "text-green-500"
  },
  vendor_rejected: {
    label: "Vendor Rejected",
    description: "When your vendor verification is rejected",
    icon: XCircle,
    color: "text-red-500"
  },
  new_review: {
    label: "New Review",
    description: "When you receive a new review",
    icon: Star,
    color: "text-yellow-500"
  },
  new_booking: {
    label: "New Booking",
    description: "When you receive a new booking (vendors only)",
    icon: Package,
    color: "text-blue-500"
  },
  payment_failed: {
    label: "Payment Failed",
    description: "When your payment fails",
    icon: AlertCircle,
    color: "text-red-500"
  },
  ticket_verified: {
    label: "Ticket Verified",
    description: "When your ticket is verified",
    icon: CheckCircle2,
    color: "text-green-500"
  },
  order_completed: {
    label: "Order Completed",
    description: "When your order is completed",
    icon: CheckCircle2,
    color: "text-green-500"
  }
}

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    setIsLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_notification_preferences', { user_uuid: user.id })

      if (error) {
        console.error('Error fetching preferences:', error)
        toast({
          title: "Error",
          description: "Failed to load notification preferences",
          variant: "destructive",
        })
      } else {
        setPreferences(data || [])
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    }
    
    setIsLoading(false)
  }

  const updatePreference = async (
    notificationType: string,
    field: 'email_enabled' | 'in_app_enabled' | 'push_enabled',
    value: boolean
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    try {
      const { error } = await supabase
        .rpc('update_notification_preference', {
          user_uuid: user.id,
          notif_type: notificationType,
          [field]: value
        })

      if (error) {
        console.error('Error updating preference:', error)
        toast({
          title: "Error",
          description: "Failed to update preference",
          variant: "destructive",
        })
        return
      }

      // Update local state
      setPreferences(prev => 
        prev.map(p => 
          p.notification_type === notificationType 
            ? { ...p, [field]: value }
            : p
        )
      )

      toast({
        title: "Preference Updated",
        description: "Your notification preference has been updated",
      })
    } catch (error) {
      console.error('Error updating preference:', error)
      toast({
        title: "Error",
        description: "Failed to update preference",
        variant: "destructive",
      })
    }
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    // All preferences are saved automatically when toggled
    // This is just for UI feedback
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSaving(false)
    
    toast({
      title: "Preferences Saved",
      description: "All notification preferences have been saved",
    })
  }

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
                  <div key={i} className="h-32 bg-card rounded" />
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
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Notification Preferences</h1>
              <p className="text-muted-foreground">
                Choose how you want to receive notifications
              </p>
            </div>
            
            <Button onClick={handleSaveAll} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save All"}
            </Button>
          </div>

          <div className="space-y-6">
            {/* Push Notification Settings */}
            <PushNotificationSettings />
            
            {/* Notification Type Preferences */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Notification Types</h2>
              <div className="space-y-4">
                {preferences.map((preference) => {
              const typeConfig = NOTIFICATION_TYPES[preference.notification_type as keyof typeof NOTIFICATION_TYPES]
              if (!typeConfig) return null

              const IconComponent = typeConfig.icon

              return (
                <Card key={preference.notification_type}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 mt-1 ${typeConfig.color}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{typeConfig.label}</h3>
                          <Badge variant="outline" className="text-xs">
                            {preference.notification_type}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-4">{typeConfig.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={`email-${preference.notification_type}`} className="text-sm">
                                Email
                              </Label>
                            </div>
                            <Switch
                              id={`email-${preference.notification_type}`}
                              checked={preference.email_enabled}
                              onCheckedChange={(checked) => 
                                updatePreference(preference.notification_type, 'email_enabled', checked)
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <Bell className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={`in-app-${preference.notification_type}`} className="text-sm">
                                In-App
                              </Label>
                            </div>
                            <Switch
                              id={`in-app-${preference.notification_type}`}
                              checked={preference.in_app_enabled}
                              onCheckedChange={(checked) => 
                                updatePreference(preference.notification_type, 'in_app_enabled', checked)
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={`push-${preference.notification_type}`} className="text-sm">
                                Push
                              </Label>
                            </div>
                            <Switch
                              id={`push-${preference.notification_type}`}
                              checked={preference.push_enabled}
                              onCheckedChange={(checked) => 
                                updatePreference(preference.notification_type, 'push_enabled', checked)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">About Notification Types</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Email:</strong> Receive notifications via email<br/>
                  <strong>In-App:</strong> See notifications in your dashboard and notification bell<br/>
                  <strong>Push:</strong> Receive browser push notifications (requires permission)
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
