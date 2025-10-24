import { NextRequest, NextResponse } from 'next/server'
import { addVendorToWhitelist, removeVendorFromWhitelist, batchAddVendorsToWhitelist, isVendorWhitelisted, getWhitelistedVendorsCount, getWhitelistedVendor } from '@/lib/contract-client'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('[Admin API] Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    console.log('[Admin API] User authenticated:', user.id)

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      console.error('[Admin API] Profile error:', profileError, 'Role:', profile?.role)
      return NextResponse.json(
        { error: 'Admin access required', details: profileError?.message, role: profile?.role },
        { status: 403 }
      )
    }

    console.log('[Admin API] Admin verified:', profile.role)

    const { action, address, addresses } = await request.json()

    switch (action) {
      case 'add':
        if (!address) {
          return NextResponse.json({ error: 'Address is required' }, { status: 400 })
        }
        const addResult = await addVendorToWhitelist(address)
        return NextResponse.json({ success: true, result: addResult })

      case 'remove':
        if (!address) {
          return NextResponse.json({ error: 'Address is required' }, { status: 400 })
        }
        const removeResult = await removeVendorFromWhitelist(address)
        return NextResponse.json({ success: true, result: removeResult })

      case 'batchAdd':
        if (!addresses || !Array.isArray(addresses)) {
          return NextResponse.json({ error: 'Addresses array is required' }, { status: 400 })
        }
        const batchResult = await batchAddVendorsToWhitelist(addresses)
        return NextResponse.json({ success: true, result: batchResult })

      case 'check':
        if (!address) {
          return NextResponse.json({ error: 'Address is required' }, { status: 400 })
        }
        const isWhitelisted = await isVendorWhitelisted(address)
        return NextResponse.json({ success: true, isWhitelisted })

      case 'count':
        try {
          const count = await getWhitelistedVendorsCount()
          return NextResponse.json({ success: true, count: count.toString() })
        } catch (error) {
          console.error('[Admin API] Error getting whitelist count:', error)
          return NextResponse.json(
            { error: 'Failed to get whitelist count', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          )
        }

      case 'get':
        if (!address) {
          return NextResponse.json({ error: 'Address is required' }, { status: 400 })
        }
        try {
          const vendor = await getWhitelistedVendor(BigInt(address))
          return NextResponse.json({ success: true, vendor })
        } catch (error) {
          console.error('[Admin API] Error getting whitelisted vendor:', error)
          return NextResponse.json(
            { error: 'Failed to get whitelisted vendor', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          )
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Admin API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
