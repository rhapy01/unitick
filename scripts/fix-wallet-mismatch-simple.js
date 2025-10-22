const { createClient } = require("@supabase/supabase-js");

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ecnzzjfjtrkplmzawbji.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnp6amZqdHJrcGxtemF3YmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDY4MjMsImV4cCI6MjA3NTk4MjgyM30.EOU8EzLHiuOzn47cgvqwMMR5oHCTclrqvP-x6DlX2WU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixWalletMismatch() {
  try {
    console.log("🔧 Fixing wallet address mismatch...\n");
    
    // Update the specific user's wallet address
    const { error } = await supabase
      .from('profiles')
      .update({
        wallet_address: '0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88'
      })
      .eq('email', 'akintoyeisaac5@gmail.com');
    
    if (error) {
      console.error("❌ Error updating address:", error.message);
      return;
    }
    
    console.log("✅ Successfully updated wallet address!");
    console.log("   User: akintoyeisaac5@gmail.com");
    console.log("   Old Address: 0x9C0ec60bDEeF0B8D8FDca3D2a137078D68F454Bb");
    console.log("   New Address: 0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88");
    console.log("\n🎉 Token approval should now work for this user!");
    
  } catch (error) {
    console.error("❌ Fix failed:", error.message);
  }
}

// Run the fix
if (require.main === module) {
  fixWalletMismatch()
    .then(() => {
      console.log("\n✅ Fix complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Fix failed:", error);
      process.exit(1);
    });
}

module.exports = { fixWalletMismatch };
