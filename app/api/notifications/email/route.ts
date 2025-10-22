import { NextRequest, NextResponse } from "next/server"

// For now, we'll use a simple email service
// In production, you can integrate with Resend, SendGrid, or AWS SES

export async function POST(request: NextRequest) {
  try {
    const { to, type, title, message, data } = await request.json()

    if (!to || !type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // TODO: Replace with actual email service integration
    // Example with Resend (free tier: 3,000 emails/month):
    /*
    import { Resend } from 'resend'
    
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const emailContent = generateEmailContent(type, title, message, data)
    
    const { data: emailData, error } = await resend.emails.send({
      from: 'UniTick <noreply@unitick.com>',
      to: [to],
      subject: title,
      html: emailContent.html,
      text: emailContent.text,
    })
    
    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
    */

    // For now, just log the email (replace with actual service)
    console.log("📧 Email Notification:", {
      to,
      type,
      title,
      message,
      data,
      timestamp: new Date().toISOString()
    })

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100))

    return NextResponse.json({ 
      success: true, 
      message: "Email notification sent successfully",
      // emailId: emailData?.id // Uncomment when using Resend
    })
  } catch (error) {
    console.error("Error sending email notification:", error)
    return NextResponse.json({ 
      error: "Failed to send email notification" 
    }, { status: 500 })
  }
}

/**
 * Generate email content based on notification type
 */
function generateEmailContent(type: string, title: string, message: string, data: any) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  switch (type) {
    case 'gift_received':
      return {
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎁 You Received a Gift!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">UniTick - The Smartest Way to Book Multiple Services</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">${title}</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">${message}</p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${baseUrl}/gift/claim/${data?.token || 'claim'}" 
                     style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    Claim Your Gift
                  </a>
                </div>
                
                <!-- Footer -->
                <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
                  <p style="color: #999; font-size: 14px; margin: 0;">
                    This gift was sent to you via UniTick<br>
                    <a href="${baseUrl}" style="color: #667eea;">Visit UniTick</a> | 
                    <a href="${baseUrl}/notifications" style="color: #667eea;">Manage Notifications</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `${title}\n\n${message}\n\nClaim your gift: ${baseUrl}/gift/claim/${data?.token || 'claim'}\n\nVisit UniTick: ${baseUrl}`
      }
    
    case 'payment_confirmed':
      return {
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">✅ Payment Confirmed</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">UniTick - The Smartest Way to Book Multiple Services</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">${title}</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">${message}</p>
                
                ${data?.order_id ? `
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
                  <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Order Details</h3>
                  <p style="color: #666; margin: 5px 0;"><strong>Order ID:</strong> ${data.order_id}</p>
                  ${data.amount ? `<p style="color: #666; margin: 5px 0;"><strong>Amount:</strong> $${data.amount}</p>` : ''}
                </div>
                ` : ''}
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${baseUrl}/dashboard" 
                     style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    View Your Tickets
                  </a>
                </div>
                
                <!-- Footer -->
                <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
                  <p style="color: #999; font-size: 14px; margin: 0;">
                    Thank you for using UniTick!<br>
                    <a href="${baseUrl}" style="color: #4CAF50;">Visit UniTick</a> | 
                    <a href="${baseUrl}/notifications" style="color: #4CAF50;">Manage Notifications</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `${title}\n\n${message}\n\n${data?.order_id ? `Order ID: ${data.order_id}\n` : ''}${data?.amount ? `Amount: $${data.amount}\n` : ''}\nView your tickets: ${baseUrl}/dashboard\n\nVisit UniTick: ${baseUrl}`
      }
    
    default:
      return {
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
              <!-- Header -->
              <div style="background: #667eea; padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${title}</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">UniTick - The Smartest Way to Book Multiple Services</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">${message}</p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${baseUrl}/dashboard" 
                     style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    View Dashboard
                  </a>
                </div>
                
                <!-- Footer -->
                <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
                  <p style="color: #999; font-size: 14px; margin: 0;">
                    <a href="${baseUrl}" style="color: #667eea;">Visit UniTick</a> | 
                    <a href="${baseUrl}/notifications" style="color: #667eea;">Manage Notifications</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `${title}\n\n${message}\n\nView dashboard: ${baseUrl}/dashboard\n\nVisit UniTick: ${baseUrl}`
      }
  }
}