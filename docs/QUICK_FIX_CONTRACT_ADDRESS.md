# Quick Fix: Missing Contract Address Issue

## 🚨 Issue Identified

**Error**: `❌ Missing required fields: { toAddress: "" }`

**Root Cause**: The `NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS` environment variable is not set, causing `toAddress` to be empty string, which fails validation in the verify-payment function.

## ✅ Fix Applied

### File: `app/api/payment/process/route.ts` (Line 263)

**Before**:
```typescript
toAddress: process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS || '',
```

**After**:
```typescript
toAddress: process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS || '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08',
```

### File: `supabase/functions/verify-payment/index.ts` (Lines 41-63)

**Enhanced error logging** to show exactly which fields are missing and their values.

## 📋 Contract Address Reference

From `lib/addresses.ts`, the fallback addresses are:
- **UnilaBook Contract**: `0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08`
- **UniTick Contract**: `0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7`

## 🔧 Environment Variable Setup (Recommended)

Add to your `.env.local` file:
```bash
NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS=0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08
NEXT_PUBLIC_UNITICK_CONTRACT_ADDRESS=0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7
```

## ✅ Status

**FIXED** - The verify-payment function will now receive a valid contract address and proceed with vendor notifications.

**Next Step**: Test the payment flow again to verify vendor notifications are now working.
