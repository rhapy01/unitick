const { createClient } = require("@supabase/supabase-js");

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ecnzzjfjtrkplmzawbji.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnp6amZqdHJrcGxtemF3YmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDY4MjMsImV4cCI6MjA3NTk4MjgyM30.EOU8EzLHiuOzn47cgvqwMMR5oHCTclrqvP-x6DlX2WU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyMigration() {
  try {
    console.log("🔍 Verifying wallet migration...\n");
    
    // Get all users with wallets
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('email')
    .limit(5);
    
    if (error) {
      console.error("❌ Error fetching profiles:", error.message);
      return;
    }
    
    console.log(`📊 Found ${profiles.length} users with wallets\n`);
    
    let encryptedCount = 0;
    let unencryptedCount = 0;
    
    for (const profile of profiles) {
      console.log(`👤 User: ${profile.email}`);
      console.log(`   📍 Wallet Address: ${profile.wallet_address}`);
      
      if (profile.wallet_encrypted_private_key && profile.wallet_encryption_salt) {
        encryptedCount++;
        console.log(`   🔐 Status: Encrypted wallet ✅`);
        console.log(`   🔑 Has Private Key: ✅`);
        console.log(`   🧂 Has Salt: ✅`);
      } else {
        unencryptedCount++;
        console.log(`   🔐 Status: Unencrypted wallet ❌`);
        console.log(`   🔑 Has Private Key: ${profile.wallet_encrypted_private_key ? '✅' : '❌'}`);
        console.log(`   🧂 Has Salt: ${profile.wallet_encryption_salt ? '✅' : '❌'}`);
      }
      
      console.log("");
    }
    
    console.log("📈 Summary:");
    console.log(`   Total Users: ${profiles.length}`);
    console.log(`   Encrypted Wallets: ${encryptedCount}`);
    console.log(`   Unencrypted Wallets: ${unencryptedCount}`);
    
    if (unencryptedCount === 0) {
      console.log("\n✅ SUCCESS: All wallets are now properly encrypted!");
      console.log("   Token approval should work for all users now.");
    } else {
      console.log("\n⚠️  Some wallets still need migration:");
      console.log("   Run the migration script again or check for errors.");
    }
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }
}

// Run the verification
if (require.main === module) {
  verifyMigration()
    .then(() => {
      console.log("\n✅ Verification complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Verification failed:", error);
      process.exit(1);
    });
}

module.exports = { verifyMigration };
