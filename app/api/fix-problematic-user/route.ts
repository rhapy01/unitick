import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the problematic user
    const { data: problematicUser, error: findError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        role,
        full_name,
        vendors!inner(
          id,
          business_name,
          created_at,
          is_verified
        )
      `)
      .eq('role', 'user')
      .limit(1)
      .single()

    if (findError) {
      return NextResponse.json({ 
        success: false, 
        error: 'No problematic user found or error occurred',
        details: findError.message 
      })
    }

    if (!problematicUser) {
      return NextResponse.json({ 
        success: true, 
        message: 'No problematic users found - issue already resolved' 
      })
    }

    const vendorProfile = problematicUser.vendors[0]

    // Check if this user has any listings or bookings
    const { data: listings } = await supabase
      .from('listings')
      .select('id, title, is_active')
      .eq('vendor_id', vendorProfile.id)

    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, status, total_amount')
      .eq('vendor_id', vendorProfile.id)

    const hasActiveBusiness = (listings && listings.length > 0) || (bookings && bookings.length > 0)

    let fixAction = ''
    let success = false

    if (hasActiveBusiness) {
      // User has business activity - update their role to vendor
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'vendor' })
        .eq('id', problematicUser.id)

      if (updateError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to update user role',
          details: updateError.message 
        })
      }

      fixAction = 'Updated user role from "user" to "vendor"'
      success = true
    } else {
      // User has no business activity - delete vendor profile
      const { error: deleteError } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorProfile.id)

      if (deleteError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to delete vendor profile',
          details: deleteError.message 
        })
      }

      fixAction = 'Deleted vendor profile (user has no business activity)'
      success = true
    }

    // Verify the fix
    const { data: verification } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        role,
        vendors(id, business_name)
      `)
      .eq('id', problematicUser.id)
      .single()

    return NextResponse.json({
      success,
      fixAction,
      user: {
        id: problematicUser.id.slice(0, 8) + '...',
        email: problematicUser.email,
        full_name: problematicUser.full_name,
        original_role: problematicUser.role,
        new_role: verification?.role,
        vendor_profile: verification?.vendors?.[0] ? {
          id: verification.vendors[0].id.slice(0, 8) + '...',
          business_name: verification.vendors[0].business_name
        } : null
      },
      businessActivity: {
        listings_count: listings?.length || 0,
        bookings_count: bookings?.length || 0,
        has_active_business: hasActiveBusiness
      }
    })

  } catch (error) {
    console.error('Error in fix-problematic-user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the problematic user details
    const { data: problematicUser, error: findError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        role,
        full_name,
        created_at,
        vendors!inner(
          id,
          business_name,
          description,
          contact_email,
          is_verified,
          created_at
        )
      `)
      .eq('role', 'user')
      .limit(1)
      .single()

    if (findError || !problematicUser) {
      return NextResponse.json({ 
        success: true, 
        message: 'No problematic users found - issue already resolved' 
      })
    }

    const vendorProfile = problematicUser.vendors[0]

    // Check business activity
    const { data: listings } = await supabase
      .from('listings')
      .select('id, title, service_type, price, is_active, created_at')
      .eq('vendor_id', vendorProfile.id)

    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, status, total_amount, created_at')
      .eq('vendor_id', vendorProfile.id)

    return NextResponse.json({
      success: true,
      problematicUser: {
        id: problematicUser.id.slice(0, 8) + '...',
        email: problematicUser.email,
        full_name: problematicUser.full_name,
        role: problematicUser.role,
        profile_created_at: problematicUser.created_at,
        vendor_profile: {
          id: vendorProfile.id.slice(0, 8) + '...',
          business_name: vendorProfile.business_name,
          description: vendorProfile.description,
          contact_email: vendorProfile.contact_email,
          is_verified: vendorProfile.is_verified,
          vendor_created_at: vendorProfile.created_at
        },
        business_activity: {
          listings: listings || [],
          bookings: bookings || [],
          has_active_business: (listings && listings.length > 0) || (bookings && bookings.length > 0)
        }
      }
    })

  } catch (error) {
    console.error('Error in fix-problematic-user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
