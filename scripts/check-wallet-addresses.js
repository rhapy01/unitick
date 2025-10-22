const { createClient } = require("@supabase/supabase-js");

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ecnzzjfjtrkplmzawbji.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnp6amZqdHJrcGxtemF3YmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDY4MjMsImV4cCI6MjA3NTk4MjgyM30.EOU8EzLHiuOzn47cgvqwMMR5oHCTclrqvP-x6DlX2WU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkWalletAddresses() {
  try {
    console.log("🔍 Checking wallet addresses after migration...\n");
    
    // Get all users with wallets
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, wallet_address, wallet_encrypted_private_key, wallet_encryption_salt, wallet_connected_at')
      .not('wallet_address', 'is', null)
      .order('wallet_connected_at', { ascending: false });
    
    if (error) {
      console.error("❌ Error fetching profiles:", error.message);
      return;
    }
    
    console.log(`📊 Found ${profiles.length} users with wallets\n`);
    
    for (const profile of profiles) {
      console.log(`👤 User: ${profile.email}`);
      console.log(`   📍 Wallet Address: ${profile.wallet_address}`);
      console.log(`   🔑 Has Private Key: ${profile.wallet_encrypted_private_key ? '✅' : '❌'}`);
      console.log(`   🧂 Has Salt: ${profile.wallet_encryption_salt ? '✅' : '❌'}`);
      console.log(`   📅 Connected At: ${profile.wallet_connected_at || 'Not set'}`);
      console.log("");
    }
    
    // Check if the addresses changed (indicating migration worked)
    const expectedNewAddresses = [
      '0xAD177209CABD1952740FF7B6C17F37C7C44B0f01', // reisofifi@gmail.com
      '0x0dAc05dA1c8965f6DAfDa6c78780e9183507E37E'  // craddy036@gmail.com
    ];
    
    const actualAddresses = profiles.map(p => p.wallet_address);
    
    console.log("🔍 Checking if migration addresses were applied:");
    console.log(`   Expected: ${expectedNewAddresses.join(', ')}`);
    console.log(`   Actual: ${actualAddresses.join(', ')}`);
    
    const migrationWorked = expectedNewAddresses.some(addr => actualAddresses.includes(addr));
    
    if (migrationWorked) {
      console.log("✅ Migration addresses found - migration was successful!");
    } else {
      console.log("❌ Migration addresses not found - migration may have failed");
      console.log("💡 This could be due to:");
      console.log("   1. Database permissions (anon key can't update)");
      console.log("   2. RLS policies blocking updates");
      console.log("   3. Network/connection issues");
    }
    
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

// Run the check
if (require.main === module) {
  checkWalletAddresses()
    .then(() => {
      console.log("\n✅ Check complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Check failed:", error);
      process.exit(1);
    });
}

module.exports = { checkWalletAddresses };
