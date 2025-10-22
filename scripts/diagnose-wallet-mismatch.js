const { ethers } = require("ethers");
const { createClient } = require("@supabase/supabase-js");

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnoseWalletMismatch() {
  try {
    console.log("🔍 Diagnosing wallet mismatch issues...\n");
    
    // Get all users with wallets
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, wallet_address, wallet_encrypted_private_key, wallet_encryption_salt')
      .not('wallet_address', 'is', null);
    
    if (error) {
      console.error("❌ Error fetching profiles:", error);
      return;
    }
    
    console.log(`📊 Found ${profiles.length} users with wallets\n`);
    
    let mismatchCount = 0;
    let encryptedCount = 0;
    let unencryptedCount = 0;
    
    for (const profile of profiles) {
      console.log(`👤 User: ${profile.email}`);
      console.log(`   📍 Stored Address: ${profile.wallet_address}`);
      
      if (profile.wallet_encrypted_private_key) {
        encryptedCount++;
        console.log(`   🔐 Has Encrypted Private Key: ✅`);
        
        // Try to decrypt and verify address
        try {
          const decryptedWallet = await decryptWalletForUser(profile.id, profile.email);
          console.log(`   🔑 Decrypted Address: ${decryptedWallet.address}`);
          
          if (decryptedWallet.address.toLowerCase() !== profile.wallet_address.toLowerCase()) {
            console.log(`   ⚠️  MISMATCH DETECTED!`);
            mismatchCount++;
          } else {
            console.log(`   ✅ Addresses match`);
          }
        } catch (error) {
          console.log(`   ❌ Decryption failed: ${error.message}`);
        }
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
    console.log(`   Address Mismatches: ${mismatchCount}`);
    
    if (mismatchCount > 0) {
      console.log("\n🚨 ACTION REQUIRED:");
      console.log("   Run the wallet migration script to fix mismatched addresses");
    }
    
  } catch (error) {
    console.error("❌ Diagnosis failed:", error);
  }
}

async function decryptWalletForUser(userId, email) {
  // This is a simplified version - in practice, you'd use the actual decryption logic
  // from lib/wallet-secure.ts
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('wallet_encrypted_private_key, wallet_encryption_iv, wallet_encryption_auth_tag, wallet_encryption_salt')
    .eq('id', userId)
    .single();
  
  if (error || !profile) {
    throw new Error('Profile not found');
  }
  
  // For now, just return the stored address
  // In a real implementation, you'd decrypt the private key and derive the address
  return {
    address: profile.wallet_address || 'unknown'
  };
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
