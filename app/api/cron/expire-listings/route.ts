import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Check for cron authentication
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    const supabase = await createClient()
    
    console.log('[CRON] Starting listing expiration check...')
    
    // Call the database function to deactivate expired listings
    const { data, error } = await supabase.rpc('deactivate_expired_listings')
    
    if (error) {
      console.error('[CRON] Error running listing expiration:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to run listing expiration check',
        details: error.message 
      }, { status: 500 })
    }
    
    const deactivatedCount = data?.[0]?.deactivated_count || 0
    const deactivatedListings = data?.[0]?.deactivated_listings || []
    
    console.log(`[CRON] Listing expiration check completed. Deactivated ${deactivatedCount} listings.`)
    
    if (deactivatedCount > 0) {
      console.log(`[CRON] Deactivated listing IDs:`, deactivatedListings)
    }
    
    return NextResponse.json({
      success: true,
      message: `Listing expiration check completed`,
      deactivatedCount,
      deactivatedListings,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[CRON] Error in listing expiration cron:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Allow POST requests as well for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
