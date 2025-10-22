const { ethers } = require("ethers");
const { createClient } = require("@supabase/supabase-js");

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ecnzzjfjtrkplmzawbji.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnp6amZqdHJrcGxtemF3YmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDY4MjMsImV4cCI6MjA3NTk4MjgyM30.EOU8EzLHiuOzn47cgvqwMMR5oHCTclrqvP-x6DlX2WU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTokenApprovalIssue() {
  try {
    console.log("🔍 Checking token approval issue...\n");
    
    // Get users with wallets
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, wallet_address, wallet_encrypted_private_key')
      .not('wallet_address', 'is', null);
    
    if (error) {
      console.error("❌ Error fetching profiles:", error.message);
      return;
    }
    
    console.log(`📊 Found ${profiles.length} users with wallets\n`);
    
    // Check each user's wallet status
    for (const profile of profiles) {
      console.log(`👤 User: ${profile.email}`);
      console.log(`   📍 Wallet Address: ${profile.wallet_address}`);
      
      if (profile.wallet_encrypted_private_key) {
        console.log(`   🔐 Status: Encrypted wallet ✅`);
        console.log(`   💡 This user should work with token approval`);
      } else {
        console.log(`   🔐 Status: Unencrypted wallet ❌`);
        console.log(`   ⚠️  This user will have token approval issues`);
        console.log(`   🔧 Solution: Migrate to encrypted wallet system`);
      }
      
      console.log("");
    }
    
    // Check if the issue is with unencrypted wallets
    const unencryptedUsers = profiles.filter(p => !p.wallet_encrypted_private_key);
    
    if (unencryptedUsers.length > 0) {
      console.log("🚨 ISSUE IDENTIFIED:");
      console.log(`   ${unencryptedUsers.length} users have unencrypted wallets`);
      console.log("   These users will experience token approval failures");
      console.log("\n🔧 RECOMMENDED SOLUTION:");
      console.log("   1. Run the wallet migration API endpoint");
      console.log("   2. Or manually migrate these users to encrypted wallets");
      console.log("\n💡 Quick Fix:");
      console.log("   Visit: /api/wallet/migrate (POST request)");
      console.log("   This will migrate unencrypted wallets to encrypted ones");
    } else {
      console.log("✅ All wallets are properly encrypted");
      console.log("💡 If token approval still fails, the issue might be:");
      console.log("   1. Wallet address mismatch (needs service key to verify)");
      console.log("   2. Contract address issues");
      console.log("   3. Network/RPC issues");
    }
    
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

// Run the check
if (require.main === module) {
  checkTokenApprovalIssue()
    .then(() => {
      console.log("\n✅ Check complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Check failed:", error);
      process.exit(1);
    });
}

module.exports = { checkTokenApprovalIssue };
