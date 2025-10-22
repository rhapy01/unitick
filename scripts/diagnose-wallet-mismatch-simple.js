const { ethers } = require("ethers");
const { createClient } = require("@supabase/supabase-js");

// Configuration - using anon key since service key is not available
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ecnzzjfjtrkplmzawbji.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnp6amZqdHJrcGxtemF3YmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDY4MjMsImV4cCI6MjA3NTk4MjgyM30.EOU8EzLHiuOzn47cgvqwMMR5oHCTclrqvP-x6DlX2WU";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnoseWalletMismatch() {
  try {
    console.log("🔍 Diagnosing wallet mismatch issues...\n");
    console.log("⚠️  Note: Using anon key - limited to public data only\n");
    
    // Get all users with wallets (this will only work if profiles table is publicly readable)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, wallet_address, wallet_encrypted_private_key, wallet_encryption_salt')
      .not('wallet_address', 'is', null)
      .limit(10); // Limit to first 10 for testing
    
    if (error) {
      console.error("❌ Error fetching profiles:", error.message);
      console.log("💡 This might be because the profiles table is not publicly readable.");
      console.log("💡 You may need to run this script with service role key or make profiles table public.");
      return;
    }
    
    console.log(`📊 Found ${profiles.length} users with wallets\n`);
    
    if (profiles.length === 0) {
      console.log("ℹ️  No users found with wallets");
      return;
    }
    
    let mismatchCount = 0;
    let encryptedCount = 0;
    let unencryptedCount = 0;
    
    for (const profile of profiles) {
      console.log(`👤 User: ${profile.email}`);
      console.log(`   📍 Stored Address: ${profile.wallet_address}`);
      
      if (profile.wallet_encrypted_private_key) {
        encryptedCount++;
        console.log(`   🔐 Has Encrypted Private Key: ✅`);
        console.log(`   ⚠️  Cannot decrypt without service role key`);
        console.log(`   💡 Run with service role key to check for mismatches`);
      } else {
        unencryptedCount++;
        console.log(`   🔐 Has Encrypted Private Key: ❌`);
        console.log(`   ⚠️  Wallet not encrypted - needs migration`);
      }
      
      console.log("");
    }
    
    console.log("📈 Summary:");
    console.log(`   Total Users: ${profiles.length}`);
    console.log(`   Encrypted Wallets: ${encryptedCount}`);
    console.log(`   Unencrypted Wallets: ${unencryptedCount}`);
    console.log(`   Address Mismatches: ${mismatchCount} (cannot verify without service key)`);
    
    if (unencryptedCount > 0) {
      console.log("\n🚨 ACTION REQUIRED:");
      console.log("   Some wallets are not encrypted and need migration");
    }
    
    console.log("\n💡 To get full diagnosis:");
    console.log("   1. Add SUPABASE_SERVICE_ROLE_KEY to your .env file");
    console.log("   2. Re-run this script");
    
  } catch (error) {
    console.error("❌ Diagnosis failed:", error.message);
  }
}

// Run the diagnosis
if (require.main === module) {
  diagnoseWalletMismatch()
    .then(() => {
      console.log("\n✅ Diagnosis complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Diagnosis failed:", error);
      process.exit(1);
    });
}

module.exports = { diagnoseWalletMismatch };
