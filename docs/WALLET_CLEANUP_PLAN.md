# Wallet System Cleanup Plan

## 🎯 Goal
Standardize on the most secure wallet system (`lib/wallet-secure.ts`) and remove all conflicting implementations.

## 🔒 Most Secure System: `lib/wallet-secure.ts`
- **AES-256-GCM encryption**
- **PBKDF2 key derivation (100,000 iterations)**
- **Secure random wallet generation**
- **Proper encryption storage**

## 🗑️ Systems to Remove/Replace

### 1. `lib/wallet-consistency.ts` - REMOVE
- Uses deterministic generation (less secure)
- Conflicts with secure random generation
- **Action**: Delete this file

### 2. `lib/wallet-generation.ts` - REMOVE  
- Old wallet generation system
- **Action**: Delete this file

### 3. `lib/wallet-generation-secure.ts` - REMOVE
- Duplicate of wallet-secure.ts
- **Action**: Delete this file

### 4. Update All References
- Replace all imports to use `lib/wallet-secure.ts`
- Update all API endpoints to use `getSecureWalletForUser`
- Remove references to other wallet systems

## 🛠️ Implementation Steps

### Step 1: Clean Database
```sql
-- Run cleanup-wallet-database.sql
UPDATE profiles 
SET 
  wallet_address = NULL,
  wallet_encrypted_private_key = NULL,
  wallet_encrypted_mnemonic = NULL,
  wallet_encryption_iv = NULL,
  wallet_encryption_auth_tag = NULL,
  wallet_encryption_salt = NULL,
  wallet_connected_at = NULL,
  wallet_salt = NULL
WHERE wallet_address IS NOT NULL;
```

### Step 2: Remove Conflicting Files
- Delete `lib/wallet-consistency.ts`
- Delete `lib/wallet-generation.ts` 
- Delete `lib/wallet-generation-secure.ts`

### Step 3: Update All References
- Replace `getConsistentWalletForUser` with `getSecureWalletForUser`
- Replace `generateUniqueWallet` with `generateSecureWallet`
- Update all imports

### Step 4: Generate New Wallets
- Run `scripts/generate-secure-wallets-all-users.js`
- Or use the wallet creation API

## ✅ Benefits
- **Single source of truth** for wallet management
- **Maximum security** with AES-256-GCM encryption
- **No conflicts** between different systems
- **Consistent behavior** across all features
- **Easy maintenance** with one system

## 🚀 Result
All users will have properly encrypted wallets using the most secure system, and token approval will work perfectly!
