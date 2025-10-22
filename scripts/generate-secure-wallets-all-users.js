const { ethers } = require("ethers");
const { createClient } = require("@supabase/supabase-js");
const crypto = require('crypto');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ecnzzjfjtrkplmzawbji.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnp6amZqdHJrcGxtemF3YmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDY4MjMsImV4cCI6MjA3NTk4MjgyM30.EOU8EzLHiuOzn47cgvqwMMR5oHCTclrqvP-x6DlX2WU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Encryption configuration (matching lib/wallet-secure.ts)
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

function deriveEncryptionKey(userId, email, salt) {
  const input = `${userId}:${email.toLowerCase()}`;
  return crypto.pbkdf2Sync(input, salt, 100000, KEY_LENGTH, 'sha256');
}

function encrypt(data, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

async function generateSecureWalletsForAllUsers() {
  try {
    console.log("🔧 Generating secure wallets for all users...\n");
    
    // Get all users without wallets
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, wallet_address')
      .is('wallet_address', null);
    
    if (error) {
      console.error("❌ Error fetching profiles:", error.message);
      return;
    }
    
    console.log(`📊 Found ${profiles.length} users without wallets\n`);
    
    if (profiles.length === 0) {
      console.log("✅ All users already have wallets!");
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const profile of profiles) {
      console.log(`👤 Processing: ${profile.email}`);
      
      try {
        // Generate secure random wallet
        const wallet = ethers.Wallet.createRandom();
        
        // Generate salt for encryption
        const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
        
        // Derive encryption key
        const encryptionKey = deriveEncryptionKey(profile.id, profile.email, salt);
        
        // Encrypt private key
        const encryptedPrivateKey = encrypt(wallet.privateKey, encryptionKey);
        
        // Encrypt mnemonic
        const mnemonic = wallet.mnemonic?.phrase || '';
        const encryptedMnemonic = encrypt(mnemonic, encryptionKey);
        
        console.log(`   📍 New Address: ${wallet.address}`);
        console.log(`   🔐 Encrypting wallet data...`);
        
        // Update the profile with encrypted wallet data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            wallet_address: wallet.address,
            wallet_encrypted_private_key: encryptedPrivateKey.encrypted,
            wallet_encrypted_mnemonic: encryptedMnemonic.encrypted,
            wallet_encryption_iv: encryptedPrivateKey.iv,
            wallet_encryption_auth_tag: encryptedPrivateKey.authTag,
            wallet_encryption_salt: salt,
            wallet_connected_at: new Date().toISOString()
          })
          .eq('id', profile.id);
        
        if (updateError) {
          console.log(`   ❌ Failed to update: ${updateError.message}`);
          console.log(`   💡 This is expected - anon key can't update database`);
          errorCount++;
        } else {
          console.log(`   ✅ Successfully created secure wallet`);
          successCount++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
      
      console.log("");
    }
    
    console.log("📈 Summary:");
    console.log(`   Total Users: ${profiles.length}`);
    console.log(`   Successfully Created: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log("\n💡 To complete the wallet creation:");
      console.log("   1. Run the cleanup SQL script first");
      console.log("   2. Use service role key for database updates");
      console.log("   3. Or use the wallet creation API endpoints");
    }
    
  } catch (error) {
    console.error("❌ Generation failed:", error.message);
  }
}

// Run the generation
if (require.main === module) {
  generateSecureWalletsForAllUsers()
    .then(() => {
      console.log("\n✅ Generation complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Generation failed:", error);
      process.exit(1);
    });
}

module.exports = { generateSecureWalletsForAllUsers };
