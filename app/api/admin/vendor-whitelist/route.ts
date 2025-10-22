import { NextRequest, NextResponse } from 'next/server'
import { addVendorToWhitelist, removeVendorFromWhitelist, batchAddVendorsToWhitelist, isVendorWhitelisted, getWhitelistedVendorsCount, getWhitelistedVendor } from '@/lib/contract-client'

export async function POST(request: NextRequest) {
  try {
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
        const count = await getWhitelistedVendorsCount()
        return NextResponse.json({ success: true, count })

      case 'get':
        if (!address) {
          return NextResponse.json({ error: 'Address is required' }, { status: 400 })
        }
        const vendor = await getWhitelistedVendor(BigInt(address))
        return NextResponse.json({ success: true, vendor })

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
