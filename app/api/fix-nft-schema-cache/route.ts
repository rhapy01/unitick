import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔧 Fixing NFT columns schema cache issue...')

    // Apply the migration script to fix NFT columns
    const migrationSQL = `
      -- Add NFT reference columns for on-chain ticketing (if not already present)
      ALTER TABLE public.bookings
      ADD COLUMN IF NOT EXISTS nft_contract_address TEXT,
      ADD COLUMN IF NOT EXISTS nft_token_id TEXT;

      ALTER TABLE public.orders
      ADD COLUMN IF NOT EXISTS nft_batch_contract_address TEXT,
      ADD COLUMN IF NOT EXISTS nft_batch_id TEXT;

      -- Create helpful indexes (if not already present)
      CREATE INDEX IF NOT EXISTS idx_bookings_nft ON public.bookings(nft_contract_address, nft_token_id);
      CREATE INDEX IF NOT EXISTS idx_orders_nft ON public.orders(nft_batch_contract_address, nft_batch_id);
    `

    // Execute the migration
    const { error: migrationError } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    })

    if (migrationError) {
      console.error('Migration error:', migrationError)
      return NextResponse.json({ 
        error: "Failed to apply migration", 
        details: migrationError.message 
      }, { status: 500 })
    }

    // Verify the columns exist by querying them
    const { data: ordersTest, error: ordersError } = await supabase
      .from("orders")
      .select("nft_batch_id, nft_batch_contract_address")
      .limit(1)

    const { data: bookingsTest, error: bookingsError } = await supabase
      .from("bookings")
      .select("nft_token_id, nft_contract_address")
      .limit(1)

    if (ordersError || bookingsError) {
      console.error('Verification error:', { ordersError, bookingsError })
      return NextResponse.json({ 
        error: "Failed to verify columns", 
        details: { ordersError, bookingsError }
      }, { status: 500 })
    }

    // Test order creation to ensure the issue is resolved
    const testOrderData = {
      user_id: user.id,
      total_amount: 0.01,
      platform_fee_total: 0.001,
      wallet_address: "0x0000000000000000000000000000000000000000",
      status: "pending",
      nft_batch_contract_address: "0x0000000000000000000000000000000000000000",
      nft_batch_id: "test_batch_id"
    }

    const { data: testOrder, error: testError } = await supabase
      .from("orders")
      .insert(testOrderData)
      .select()
      .single()

    if (testError) {
      console.error('Test order creation failed:', testError)
      return NextResponse.json({ 
        error: "Test order creation failed", 
        details: testError.message 
      }, { status: 500 })
    }

    // Clean up test order
    await supabase
      .from("orders")
      .delete()
      .eq("id", testOrder.id)

    console.log('✅ NFT columns schema cache fix completed successfully')

    return NextResponse.json({ 
      success: true,
      message: "NFT columns schema cache fixed successfully",
      details: {
        columnsAdded: [
          "orders.nft_batch_contract_address",
          "orders.nft_batch_id", 
          "bookings.nft_contract_address",
          "bookings.nft_token_id"
        ],
        indexesCreated: [
          "idx_orders_nft",
          "idx_bookings_nft"
        ],
        testOrderCreated: true,
        testOrderCleanedUp: true
      }
    })

  } catch (error) {
    console.error('Error fixing NFT columns schema cache:', error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔍 Checking NFT columns status...')

    // Check if NFT columns exist in orders table
    const { data: ordersColumns, error: ordersError } = await supabase
      .from("orders")
      .select("nft_batch_id, nft_batch_contract_address")
      .limit(1)

    // Check if NFT columns exist in bookings table
    const { data: bookingsColumns, error: bookingsError } = await supabase
      .from("bookings")
      .select("nft_token_id, nft_contract_address")
      .limit(1)

    const status = {
      orders: {
        nft_batch_id: !ordersError,
        nft_batch_contract_address: !ordersError,
        error: ordersError?.message
      },
      bookings: {
        nft_token_id: !bookingsError,
        nft_contract_address: !bookingsError,
        error: bookingsError?.message
      }
    }

    const allColumnsExist = !ordersError && !bookingsError

    return NextResponse.json({ 
      success: true,
      allColumnsExist,
      status,
      message: allColumnsExist 
        ? "All NFT columns are accessible" 
        : "Some NFT columns are missing or inaccessible"
    })

  } catch (error) {
    console.error('Error checking NFT columns status:', error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
