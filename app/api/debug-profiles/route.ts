import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get all profiles with their roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, created_at, wallet_address')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    // Get all vendors
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, user_id, business_name, is_verified, created_at')

    if (vendorsError) {
      console.error('Error fetching vendors:', vendorsError)
      return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
    }

    // Count roles
    const roleCounts = profiles?.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Find users with 'user' role but have vendor profiles (potential bug)
    const usersWithVendorProfiles = profiles?.filter(profile => {
      if (profile.role !== 'user') return false
      return vendors?.some(vendor => vendor.user_id === profile.id)
    }) || []

    // Find users with 'vendor' role but no vendor profile
    const vendorsWithoutProfiles = profiles?.filter(profile => {
      if (profile.role !== 'vendor') return false
      return !vendors?.some(vendor => vendor.user_id === profile.id)
    }) || []

    // Create vendor lookup map
    const vendorMap = vendors?.reduce((acc, vendor) => {
      acc[vendor.user_id] = vendor
      return acc
    }, {} as Record<string, any>) || {}

    // Combine profiles with vendor data
    const profilesWithVendorData = profiles?.map(profile => ({
      id: profile.id.slice(0, 8) + '...',
      email: profile.email,
      role: profile.role,
      full_name: profile.full_name,
      created_at: profile.created_at,
      has_wallet: !!profile.wallet_address,
      vendor_profile: vendorMap[profile.id] ? {
        id: vendorMap[profile.id].id.slice(0, 8) + '...',
        business_name: vendorMap[profile.id].business_name,
        is_verified: vendorMap[profile.id].is_verified,
        created_at: vendorMap[profile.id].created_at
      } : null
    })) || []

    return NextResponse.json({
      success: true,
      summary: {
        totalProfiles: profiles?.length || 0,
        totalVendors: vendors?.length || 0,
        roleCounts,
        usersWithVendorProfiles: usersWithVendorProfiles.length,
        vendorsWithoutProfiles: vendorsWithoutProfiles.length
      },
      profiles: profilesWithVendorData,
      potentialBugs: {
        usersWithVendorProfiles: usersWithVendorProfiles.map(p => ({
          id: p.id.slice(0, 8) + '...',
          email: p.email,
          role: p.role,
          vendor_id: vendorMap[p.id]?.id.slice(0, 8) + '...',
          business_name: vendorMap[p.id]?.business_name
        })),
        vendorsWithoutProfiles: vendorsWithoutProfiles.map(p => ({
          id: p.id.slice(0, 8) + '...',
          email: p.email,
          role: p.role,
          created_at: p.created_at
        }))
      }
    })

  } catch (error) {
    console.error('Error in debug-profiles API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
