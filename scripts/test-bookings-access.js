const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Try multiple env file locations
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Bookings Access');
console.log('==========================');
console.log('URL:', supabaseUrl);
console.log('Has Key:', !!supabaseKey);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBookingsAccess() {
  try {
    // Test 1: Check if we can query orders
    console.log('📋 Test 1: Query orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ Orders query failed:', ordersError);
    } else {
      console.log('✅ Orders query succeeded. Count:', orders?.length || 0);
      if (orders && orders.length > 0) {
        console.log('   First order ID:', orders[0].id);
        console.log('   First order user_id:', orders[0].user_id);
        
        // Test 2: Query bookings for this order
        const orderId = orders[0].id;
        console.log('\n📋 Test 2: Query bookings for order ' + orderId + '...');
        
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('order_id', orderId)
          .limit(5);
        
        if (bookingsError) {
          console.error('❌ Bookings query failed:', JSON.stringify(bookingsError, null, 2));
        } else {
          console.log('✅ Bookings query succeeded. Count:', bookings?.length || 0);
          if (bookings && bookings.length > 0) {
            console.log('   First booking:', {
              id: bookings[0].id,
              user_id: bookings[0].user_id,
              order_id: bookings[0].order_id,
              listing_id: bookings[0].listing_id
            });
          }
        }
        
        // Test 3: Query with joins
        console.log('\n📋 Test 3: Query bookings with joins...');
        const { data: bookingsWithJoins, error: joinsError } = await supabase
          .from('bookings')
          .select('*, listing:listings(id, title), vendor:vendors(id, business_name)')
          .eq('order_id', orderId)
          .limit(3);
        
        if (joinsError) {
          console.error('❌ Joined query failed:', JSON.stringify(joinsError, null, 2));
          console.error('   Error details:', {
            message: joinsError.message,
            details: joinsError.details,
            hint: joinsError.hint,
            code: joinsError.code
          });
        } else {
          console.log('✅ Joined query succeeded. Count:', bookingsWithJoins?.length || 0);
        }
        
        // Test 4: Query order_items to get booking_ids
        console.log('\n📋 Test 4: Query order_items for this order...');
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('booking_id')
          .eq('order_id', orderId);
        
        if (itemsError) {
          console.error('❌ Order items query failed:', itemsError);
        } else {
          console.log('✅ Order items query succeeded. Count:', orderItems?.length || 0);
          if (orderItems && orderItems.length > 0) {
            const bookingIds = orderItems.map(item => item.booking_id);
            console.log('   Booking IDs:', bookingIds);
            
            // Test 5: Query bookings by IDs (this is what the order page does)
            console.log('\n📋 Test 5: Query bookings by IDs...');
            const { data: bookingsByIds, error: idsError } = await supabase
              .from('bookings')
              .select('*, listing:listings(*, vendor:vendors(*))')
              .in('id', bookingIds);
            
            if (idsError) {
              console.error('❌ Bookings by IDs query failed:', JSON.stringify(idsError, null, 2));
              console.error('   Error details:', {
                message: idsError.message,
                details: idsError.details,
                hint: idsError.hint,
                code: idsError.code
              });
            } else {
              console.log('✅ Bookings by IDs query succeeded. Count:', bookingsByIds?.length || 0);
            }
          }
        }
      }
    }
    
    // Test 6: Check if order_id column exists
    console.log('\n📋 Test 6: Check if order_id exists on bookings...');
    const { data: bookingsWithOrderId, error: orderIdCheckError } = await supabase
      .from('bookings')
      .select('order_id')
      .not('order_id', 'is', null)
      .limit(1);
    
    if (orderIdCheckError && orderIdCheckError.code === '42703') {
      console.error('❌ order_id column does NOT exist on bookings table!');
      console.error('   You need to add it first with: ALTER TABLE public.bookings ADD COLUMN order_id UUID REFERENCES public.orders(id);');
    } else if (orderIdCheckError) {
      console.error('❌ Error checking order_id:', orderIdCheckError.message);
    } else {
      console.log('✅ order_id column exists. Bookings with order_id:', bookingsWithOrderId?.length || 0);
    }
    
    console.log('\n✅ All tests complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Check current user
supabase.auth.getUser().then(({ data: { user }, error }) => {
  if (error) {
    console.error('❌ Not authenticated:', error.message);
  } else if (user) {
    console.log('✅ Authenticated as:', user.id);
    console.log('');
    testBookingsAccess();
  } else {
    console.error('❌ No authenticated user');
    console.log('   Run this: supabase.auth.signInWithPassword({ email, password })');
    process.exit(1);
  }
});

