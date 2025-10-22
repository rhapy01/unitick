import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    console.log('🕐 Cron job triggered - expiring listings...')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Call the database function to deactivate expired listings
    const { data, error } = await supabase.rpc('deactivate_expired_listings')
    
    if (error) {
      console.error('❌ Database error:', error)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to run listing expiration check',
        details: error.message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
    
    const deactivatedCount = data?.[0]?.deactivated_count || 0
    const deactivatedListings = data?.[0]?.deactivated_listings || []
    
    console.log(`✅ Listing expiration completed. Deactivated ${deactivatedCount} listings.`)
    
    if (deactivatedCount > 0) {
      console.log(`📋 Deactivated listing IDs:`, deactivatedListings)
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: `Listing expiration check completed`,
      deactivatedCount,
      deactivatedListings,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
    
  } catch (error) {
    console.error('❌ Cron job error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: `Cron job failed: ${error.message}`,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})














