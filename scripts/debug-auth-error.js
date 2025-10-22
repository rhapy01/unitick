// Test Supabase Authentication
// Run this in browser console to debug the exact error

console.log('🔍 Testing Supabase Authentication...');

// Check environment variables
console.log('Environment Variables:');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

// Test with a simple request
async function testSupabaseAuth() {
  try {
    const response = await fetch('https://ecnzzjfjtrkplmzawbji.supabase.co/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnp6amZqdHJrcGxtemF3YmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDY4MjMsImV4cCI6MjA3NTk4MjgyM30.EOU8EzLHiuOzn47cgvqwMMR5oHCTclrqvP-x6DlX2WU',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnp6amZqdHJrcGxtemF3YmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDY4MjMsImV4cCI6MjA3NTk4MjgyM30.EOU8EzLHiuOzn47cgvqwMMR5oHCTclrqvP-x6DlX2WU'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', [...response.headers.entries()]);
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    if (!response.ok) {
      console.error('❌ Request failed:', response.status, responseText);
    } else {
      console.log('✅ Request successful');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Run the test
testSupabaseAuth();





