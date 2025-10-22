import { createClient } from "@/lib/supabase/client"

export interface EmailNotificationData {
  orderId: string
  userEmail: string
  userName: string
  totalAmount: number
  transactionHash: string
  bookings: Array<{
    title: string
    vendor: string
    quantity: number
    bookingDate: string
    price: number
  }>
}

export interface VendorBookingNotificationData {
  vendorEmail: string
  vendorName: string
  customerName: string
  customerEmail: string
  orderId: string
  totalAmount: number
  isGift: boolean
  recipientName?: string
  bookings: Array<{
    title: string
    quantity: number
    bookingDate: string
    totalAmount: number
    customerNotes?: string
  }>
  vendorDashboardUrl: string
}

export async function sendPaymentConfirmationEmail(data: EmailNotificationData): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: data.userEmail,
        subject: 'Payment Confirmed - Your Tickets Are Ready',
        template: 'payment-confirmation',
        data: {
          orderId: data.orderId,
          userName: data.userName,
          totalAmount: data.totalAmount,
          transactionHash: data.transactionHash,
          bookings: data.bookings,
          orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/order/${data.orderId}`
        }
      }
    })

    if (error) {
      console.error('Email sending error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email notification error:', error)
    return false
  }
}

export async function sendVendorBookingNotificationEmail(data: VendorBookingNotificationData): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: data.vendorEmail,
        subject: 'New Booking Alert!',
        template: 'vendor-booking-notification',
        data: {
          vendorName: data.vendorName,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          orderId: data.orderId,
          totalAmount: data.totalAmount,
          isGift: data.isGift,
          recipientName: data.recipientName,
          bookings: data.bookings,
          vendorDashboardUrl: data.vendorDashboardUrl
        }
      }
    })

    if (error) {
      console.error('Vendor booking notification email error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Vendor booking notification error:', error)
    return false
  }
}
