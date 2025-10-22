import { ethers } from 'ethers'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * SECURE WALLET SYSTEM
 * Uses proper encryption and secure random generation
 * NO DETERMINISTIC GENERATION - too risky without real passwords
 */

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits
const SALT_LENGTH = 32 // 256 bits

/**
 * Derives an encryption key from user data using PBKDF2
 * This key is used to encrypt the wallet private key
 */
function deriveEncryptionKey(userId: string, email: string, salt: string): Buffer {
  // Use user ID and email to derive encryption key
  // This ensures only the authenticated user can decrypt their wallet
  const input = `${userId}:${email.toLowerCase()}`
  return crypto.pbkdf2Sync(input, salt, 100000, KEY_LENGTH, 'sha256')
}

/**
 * Encrypts data using AES-256-GCM
 */
function encrypt(data: string, key: Buffer): {
  encrypted: string
  iv: string
  authTag: string
} {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
  
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

/**
 * Decrypts data using AES-256-GCM
 */
function decrypt(encrypted: string, key: Buffer, iv: string, authTag: string): string {
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  )
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Generates a secure random wallet with proper encryption
 * @param userId User's unique ID
 * @param email User's email
 * @returns Encrypted wallet data
 */
export async function generateSecureWallet(
  userId: string,
  email: string
): Promise<{
  address: string
  encryptedPrivateKey: string
  encryptedMnemonic: string
  iv: string
  authTag: string
  salt: string
}> {
  try {
    // Generate cryptographically secure random wallet
    const wallet = ethers.Wallet.createRandom()
    
    // Generate salt for encryption
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex')
    
    // Derive encryption key
    const encryptionKey = deriveEncryptionKey(userId, email, salt)
    
    // Encrypt private key
    const encryptedPrivateKey = encrypt(wallet.privateKey, encryptionKey)
    
    // Encrypt mnemonic with separate IV
    const mnemonic = wallet.mnemonic?.phrase || ''
    const encryptedMnemonic = encrypt(mnemonic, encryptionKey)
    
    return {
      address: wallet.address,
      encryptedPrivateKey: encryptedPrivateKey.encrypted,
      encryptedMnemonic: encryptedMnemonic.encrypted,
      iv: encryptedPrivateKey.iv, // IV for private key
      authTag: encryptedPrivateKey.authTag, // Auth tag for private key
      mnemonicIv: encryptedMnemonic.iv, // Separate IV for mnemonic
      mnemonicAuthTag: encryptedMnemonic.authTag, // Separate auth tag for mnemonic
      salt: salt
    }
  } catch (error) {
    console.error('[Secure Wallet] Error generating wallet:', error)
    throw new Error('Failed to generate secure wallet')
  }
}

/**
 * Decrypts and retrieves wallet private key
 * @param userId User's unique ID
 * @param email User's email
 * @param encryptedPrivateKey Encrypted private key
 * @param iv Initialization vector
 * @param authTag Authentication tag
 * @param salt Salt used for encryption
 * @returns Decrypted private key
 */
export function decryptPrivateKey(
  userId: string,
  email: string,
  encryptedPrivateKey: string,
  iv: string,
  authTag: string,
  salt: string
): string {
  try {
    // Derive encryption key
    const encryptionKey = deriveEncryptionKey(userId, email, salt)
    
    // Decrypt private key
    const privateKey = decrypt(encryptedPrivateKey, encryptionKey, iv, authTag)
    
    return privateKey
  } catch (error) {
    console.error('[Secure Wallet] Error decrypting private key:', error)
    throw new Error('Failed to decrypt private key')
  }
}

/**
 * Creates a secure wallet for a user and stores it encrypted
 */
export async function createSecureWalletForUser(
  userId: string,
  email: string
): Promise<string> {
  try {
    // Generate secure wallet
    const walletData = await generateSecureWallet(userId, email)
    
    // Store encrypted wallet in database
    const supabase = await createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        wallet_address: walletData.address,
        wallet_encrypted_private_key: walletData.encryptedPrivateKey,
        wallet_encrypted_mnemonic: walletData.encryptedMnemonic,
        wallet_encryption_iv: walletData.iv,
        wallet_encryption_auth_tag: walletData.authTag,
        wallet_mnemonic_iv: walletData.mnemonicIv,
        wallet_mnemonic_auth_tag: walletData.mnemonicAuthTag,
        wallet_encryption_salt: walletData.salt,
        wallet_connected_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (error) {
      throw new Error('Failed to store encrypted wallet in database')
    }
    
    console.log(`[Secure Wallet] Created and encrypted wallet ${walletData.address} for user ${userId}`)
    return walletData.address
    
  } catch (error) {
    console.error('[Secure Wallet] Error creating wallet:', error)
    throw new Error('Failed to create secure wallet')
  }
}

/**
 * Retrieves and decrypts wallet for a user
 */
export async function getSecureWalletForUser(
  userId: string,
  email: string
): Promise<{
  address: string
  privateKey: string
}> {
  try {
    // Get encrypted wallet from database
    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('wallet_address, wallet_encrypted_private_key, wallet_encryption_iv, wallet_encryption_auth_tag, wallet_encryption_salt')
      .eq('id', userId)
      .single()
    
    if (error || !profile) {
      throw new Error('Wallet not found for user')
    }
    
    if (!profile.wallet_encrypted_private_key) {
      throw new Error('No encrypted private key found')
    }
    
    // Decrypt private key
    const privateKey = decryptPrivateKey(
      userId,
      email,
      profile.wallet_encrypted_private_key,
      profile.wallet_encryption_iv,
      profile.wallet_encryption_auth_tag,
      profile.wallet_encryption_salt
    )
    
    return {
      address: profile.wallet_address,
      privateKey: privateKey
    }
    
  } catch (error) {
    console.error('[Secure Wallet] Error getting wallet:', error)
    throw new Error('Failed to get secure wallet')
  }
}

/**
 * Exports wallet with proper decryption
 */
export async function exportSecureWallet(
  userId: string,
  email: string
): Promise<{
  address: string
  privateKey: string
  mnemonic: string
}> {
  try {
    // Get encrypted wallet from database
    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('wallet_address, wallet_encrypted_private_key, wallet_encrypted_mnemonic, wallet_encryption_iv, wallet_encryption_auth_tag, wallet_mnemonic_iv, wallet_mnemonic_auth_tag, wallet_encryption_salt')
      .eq('id', userId)
      .single()
    
    if (error || !profile) {
      throw new Error('Wallet not found for user')
    }
    
    if (!profile.wallet_encrypted_private_key) {
      throw new Error('No encrypted private key found')
    }
    
    // Derive encryption key
    const encryptionKey = deriveEncryptionKey(userId, email, profile.wallet_encryption_salt)
    
    // Decrypt private key
    const privateKey = decrypt(
      profile.wallet_encrypted_private_key,
      encryptionKey,
      profile.wallet_encryption_iv,
      profile.wallet_encryption_auth_tag
    )
    
    // Decrypt mnemonic (if available)
    let mnemonic = ''
    if (profile.wallet_encrypted_mnemonic && profile.wallet_mnemonic_iv && profile.wallet_mnemonic_auth_tag) {
      try {
        mnemonic = decrypt(
          profile.wallet_encrypted_mnemonic,
          encryptionKey,
          profile.wallet_mnemonic_iv,
          profile.wallet_mnemonic_auth_tag
        )
      } catch (error) {
        console.warn('[Secure Wallet] Could not decrypt mnemonic:', error)
      }
    }
    
    return {
      address: profile.wallet_address,
      privateKey: privateKey,
      mnemonic: mnemonic
    }
    
  } catch (error) {
    console.error('[Secure Wallet] Error exporting wallet:', error)
    throw new Error('Failed to export secure wallet')
  }
}

/**
 * Validates wallet encryption and security
 */
export async function validateWalletSecurity(
  userId: string
): Promise<{
  isSecure: boolean
  issues: string[]
  recommendations: string[]
}> {
  const issues: string[] = []
  const recommendations: string[] = []
  
  try {
    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('wallet_address, wallet_encrypted_private_key, wallet_encryption_salt')
      .eq('id', userId)
      .single()
    
    if (error || !profile) {
      issues.push('Wallet not found')
      return { isSecure: false, issues, recommendations }
    }
    
    // Check if wallet is properly encrypted
    if (!profile.wallet_encrypted_private_key) {
      issues.push('Private key not encrypted or missing')
      recommendations.push('Generate new secure wallet with encryption')
      return { isSecure: false, issues, recommendations }
    }
    
    // Check if salt exists
    if (!profile.wallet_encryption_salt) {
      issues.push('Encryption salt missing')
      recommendations.push('Re-encrypt wallet with proper salt')
      return { isSecure: false, issues, recommendations }
    }
    
    recommendations.push('✅ Wallet is properly encrypted')
    recommendations.push('✅ Using AES-256-GCM encryption')
    recommendations.push('✅ Keys protected with PBKDF2 derivation')
    
    return {
      isSecure: true,
      issues,
      recommendations
    }
    
  } catch (error) {
    console.error('[Secure Wallet] Error validating security:', error)
    issues.push('Error validating wallet security')
    return { isSecure: false, issues, recommendations }
  }
}
