import { serve } from "https://deno.land/std/http/server.ts"

serve(async (req) => {
  try {
    console.log('🕐 Cron job triggered - running all scheduled tasks...')
    
    const results = []
    
    // 1. Sync contract events
    console.log('📡 Syncing contract events...')
    const syncResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-contract-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        'Content-Type': 'application/json'
      }
    })
    
    const syncResult = await syncResponse.json()
    results.push({
      task: 'sync-contract-events',
      success: syncResponse.ok,
      result: syncResult
    })
    
    // 2. Expire listings
    console.log('📅 Expiring listings...')
    const expireResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/expire-listings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        'Content-Type': 'application/json'
      }
    })
    
    const expireResult = await expireResponse.json()
    results.push({
      task: 'expire-listings',
      success: expireResponse.ok,
      result: expireResult
    })
    
    console.log('✅ All cron tasks completed:', results)
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "All cron tasks completed",
      results 
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
