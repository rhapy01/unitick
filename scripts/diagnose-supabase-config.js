// Supabase Configuration Diagnostic Script
// Run this to check your Supabase setup

console.log('🔍 Supabase Configuration Diagnostic');
console.log('=====================================');

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n📋 Environment Variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');

if (supabaseUrl) {
  console.log('URL Value:', supabaseUrl);
}

if (supabaseAnonKey) {
  console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
}

// Check if URL is valid
if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    console.log('\n🌐 URL Analysis:');
    console.log('Protocol:', url.protocol);
    console.log('Host:', url.host);
    console.log('Valid URL:', url.protocol === 'https:' ? '✅ HTTPS' : '⚠️ Not HTTPS');
  } catch (error) {
    console.log('\n❌ Invalid URL format:', error.message);
  }
}

// Test Supabase connection
async function testSupabaseConnection() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('\n❌ Cannot test connection - missing environment variables');
    return;
  }

  try {
    console.log('\n🔗 Testing Supabase Connection...');
    
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test auth endpoint
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Connection successful');
      console.log('Session:', data.session ? 'Active' : 'No active session');
    }
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
  }
}

// Run the test
testSupabaseConnection();

console.log('\n📝 Common Solutions:');
console.log('1. Create .env.local file with:');
console.log('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
console.log('');
console.log('2. Restart your development server after adding env vars');
console.log('');
console.log('3. Check Supabase dashboard for correct URL and keys');
console.log('');
console.log('4. Ensure your Supabase project is active and not paused');
