const { ethers } = require("ethers");
const { createClient } = require("@supabase/supabase-js");
const crypto = require('crypto');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

async function fixWalletMismatches() {
  try {
    console.log("🔧 Fixing wallet mismatches...\n");
    
    // Get all users with wallets
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, wallet_address, wallet_encrypted_private_key, wallet_encryption_salt, wallet_encryption_iv, wallet_encryption_auth_tag')
      .not('wallet_address', 'is', null);
    
    if (error) {
      console.error("❌ Error fetching profiles:", error);
      return;
    }
    
    console.log(`📊 Found ${profiles.length} users with wallets\n`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const profile of profiles) {
      console.log(`👤 Processing: ${profile.email}`);
      console.log(`   📍 Stored Address: ${profile.wallet_address}`);
      
      if (!profile.wallet_encrypted_private_key) {
        console.log(`   ⚠️  No encrypted private key - skipping`);
        continue;
      }
      
      try {
        // Decrypt the private key
        const encryptionKey = deriveEncryptionKey(profile.id, profile.email, profile.wallet_encryption_salt);
        const decryptedPrivateKey = decrypt(
          profile.wallet_encrypted_private_key,
          encryptionKey,
          profile.wallet_encryption_iv,
          profile.wallet_encryption_auth_tag
        );
        
        // Get the wallet address from the private key
        const wallet = new ethers.Wallet(decryptedPrivateKey);
        const decryptedAddress = wallet.address;
        
        console.log(`   🔑 Decrypted Address: ${decryptedAddress}`);
        
        if (decryptedAddress.toLowerCase() !== profile.wallet_address.toLowerCase()) {
          console.log(`   ⚠️  MISMATCH DETECTED - Fixing...`);
          
          // Update the profile with the correct address
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              wallet_address: decryptedAddress
            })
            .eq('id', profile.id);
          
          if (updateError) {
            console.log(`   ❌ Failed to update address: ${updateError.message}`);
            errorCount++;
          } else {
            console.log(`   ✅ Address updated successfully`);
            fixedCount++;
          }
        } else {
          console.log(`   ✅ Addresses match - no fix needed`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error processing wallet: ${error.message}`);
        errorCount++;
      }
      
      console.log("");
    }
    
    console.log("📈 Summary:");
    console.log(`   Total Users Processed: ${profiles.length}`);
    console.log(`   Wallets Fixed: ${fixedCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    if (fixedCount > 0) {
      console.log("\n✅ Wallet mismatches have been fixed!");
      console.log("   Users should now be able to approve tokens successfully.");
    }
    
  } catch (error) {
    console.error("❌ Fix failed:", error);
  }
}

// Run the fix
if (require.main === module) {
  fixWalletMismatches()
    .then(() => {
      console.log("\n✅ Fix complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Fix failed:", error);
      process.exit(1);
    });
}

module.exports = { fixWalletMismatches };
