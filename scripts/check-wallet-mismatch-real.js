const { ethers } = require("ethers");
const { createClient } = require("@supabase/supabase-js");
const crypto = require('crypto');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ecnzzjfjtrkplmzawbji.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnp6amZqdHJrcGxtemF3YmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDY4MjMsImV4cCI6MjA3NTk4MjgyM30.EOU8EzLHiuOzn47cgvqwMMR5oHCTclrqvP-x6DlX2WU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Encryption functions (matching lib/wallet-secure.ts)
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function deriveEncryptionKey(userId, email, salt) {
  const input = `${userId}:${email.toLowerCase()}`;
  return crypto.pbkdf2Sync(input, salt, 100000, KEY_LENGTH, 'sha256');
}

function decrypt(encrypted, key, iv, authTag) {
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

async function checkWalletMismatch() {
  try {
    console.log("🔍 Checking wallet address mismatch...\n");
    
    // Get users with encrypted wallets
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, wallet_address, wallet_encrypted_private_key, wallet_encryption_iv, wallet_encryption_auth_tag, wallet_encryption_salt')
      .not('wallet_address', 'is', null)
      .not('wallet_encrypted_private_key', 'is', null);
    
    if (error) {
      console.error("❌ Error fetching profiles:", error.message);
      return;
    }
    
    console.log(`📊 Found ${profiles.length} users with encrypted wallets\n`);
    
    for (const profile of profiles) {
      console.log(`👤 User: ${profile.email}`);
      console.log(`   📍 Database Address: ${profile.wallet_address}`);
      
      try {
        // Decrypt the private key
        const encryptionKey = deriveEncryptionKey(profile.id, profile.email, profile.wallet_encryption_salt);
        const decryptedPrivateKey = decrypt(
          profile.wallet_encrypted_private_key,
          encryptionKey,
          profile.wallet_encryption_iv,
          profile.wallet_encryption_auth_tag
        );
        
        // Get wallet address from private key
        const wallet = new ethers.Wallet(decryptedPrivateKey);
        const decryptedAddress = wallet.address;
        
        console.log(`   🔑 Decrypted Address: ${decryptedAddress}`);
        
        if (decryptedAddress.toLowerCase() === profile.wallet_address.toLowerCase()) {
          console.log(`   ✅ Addresses match - no issue`);
        } else {
          console.log(`   ⚠️  MISMATCH! This will cause token approval failures`);
          console.log(`   🔧 Fix: Update database address to: ${decryptedAddress}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Decryption failed: ${error.message}`);
      }
      
      console.log("");
    }
    
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

// Run the check
if (require.main === module) {
  checkWalletMismatch()
    .then(() => {
      console.log("\n✅ Check complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Check failed:", error);
      process.exit(1);
    });
}

module.exports = { checkWalletMismatch };
