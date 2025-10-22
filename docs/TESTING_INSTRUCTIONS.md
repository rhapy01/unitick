# Testing Instructions - Vendor Notification Fix

## Overview
This document provides step-by-step instructions for testing the vendor notification fix for both internal and external wallet flows.

---

## Pre-Test Setup

### 1. Verify Supabase Function Deployment
```bash
# Check if verify-payment function is deployed with latest changes
# Login to Supabase Dashboard > Edge Functions > verify-payment
# Verify last deployed timestamp is recent
```

### 2. Prepare Test Data

#### Create Test Vendor with Email
```sql
-- Ensure test vendor has contact_email
UPDATE vendors 
SET contact_email = 'test-vendor@example.com'
WHERE business_name = 'kakaki tours';

-- Or create new test vendor
INSERT INTO vendors (user_id, business_name, contact_email, is_verified)
VALUES 
  ('YOUR_USER_ID', 'Test Vendor', 'vendor@test.com', true);
```

#### Create Test Listing
```sql
-- Ensure vendor has an active listing
SELECT id, title, price, is_active 
FROM listings 
WHERE vendor_id = (SELECT id FROM vendors WHERE business_name = 'kakaki tours');
```

### 3. Check Email Service Configuration
```bash
# Verify RESEND_API_KEY is set in Supabase Edge Functions
# Dashboard > Project Settings > Edge Functions > Environment Variables
```

---

## Test Scenario 1: Internal Wallet Payment (Primary)

### Test Steps

#### 1. Prepare Test User
1. Login to the application as a test customer
2. Verify user has an internal wallet (check profile)
3. Note user's wallet address

#### 2. Add Items to Cart
1. Navigate to vendor's listing
2. Add 2 items to cart
3. Select booking date
4. Verify cart shows items correctly

#### 3. Complete Payment
1. Go to checkout
2. Select "Use Internal Wallet" option
3. Click "Complete Payment"
4. Wait for confirmation

#### 4. Verify Customer Notifications ✅
**Expected Results**:
- Customer sees success message
- Customer receives payment confirmation email within 1 minute
- Customer can view order in dashboard

**Verification**:
```bash
# Check customer email inbox for:
Subject: "Payment Confirmed - Your Tickets Are Ready"
From: UniTick
Contains: Order ID, transaction details, booking information
```

#### 5. Verify Vendor Notifications ✅
**Expected Results**:
- Vendor receives booking notification email within 2 minutes
- Vendor has in-app notification

**Verification - Email**:
```bash
# Check vendor email inbox for:
Subject: "New Booking: 2 service(s) booked"
From: UniTick
Contains: Customer name, email, booking details, order ID
```

**Verification - In-App**:
```sql
-- Check database for notification
SELECT * FROM notifications 
WHERE user_id = (SELECT user_id FROM vendors WHERE business_name = 'kakaki tours')
AND type = 'new_booking'
ORDER BY created_at DESC 
LIMIT 1;

-- Should return a row with:
-- - title: "New Booking: X service(s)"
-- - message: Contains customer info
-- - data: JSON with order details
```

#### 6. Check Supabase Logs
```bash
# Go to: Supabase Dashboard > Edge Functions > verify-payment > Logs

# Look for these log messages:
✅ "ℹ️  Order already verified, will skip blockchain/database updates but send notifications..."
✅ "📧 Sending vendor notifications..."
✅ "📋 Found X bookings for vendor notifications"
✅ "📋 Grouped into X vendors"
✅ "📧 Attempting to send email to vendor@email.com..."
✅ "✅ Email notification sent successfully"
✅ "✅ In-app notification created successfully"

# Should NOT see:
❌ "Payment already verified" (followed by immediate return)
❌ "Vendor notification error"
```

---

## Test Scenario 2: Multi-Vendor Purchase

### Test Steps

#### 1. Prepare Multiple Vendors
```sql
-- Ensure 2+ vendors with contact emails
UPDATE vendors 
SET contact_email = 'vendor1@test.com'
WHERE business_name = 'Vendor 1';

UPDATE vendors 
SET contact_email = 'vendor2@test.com'
WHERE business_name = 'Vendor 2';
```

#### 2. Add Items from Multiple Vendors
1. Add 1 item from Vendor 1
2. Add 1 item from Vendor 2
3. Verify cart shows both items

#### 3. Complete Payment
1. Go to checkout
2. Complete payment with internal wallet

#### 4. Verify All Vendors Notified ✅
**Expected Results**:
- BOTH vendors receive separate emails
- BOTH vendors have in-app notifications
- Each email contains only that vendor's bookings

**Verification**:
```sql
-- Should have 2 notifications (one per vendor)
SELECT 
  n.id,
  n.title,
  n.message,
  v.business_name,
  p.email
FROM notifications n
JOIN profiles p ON n.user_id = p.id
JOIN vendors v ON p.id = v.user_id
WHERE n.type = 'new_booking'
ORDER BY n.created_at DESC 
LIMIT 2;
```

---

## Test Scenario 3: Vendor Without Email

### Test Steps

#### 1. Create Vendor Without Email
```sql
-- Remove contact_email from test vendor
UPDATE vendors 
SET contact_email = NULL
WHERE business_name = 'Test Vendor No Email';
```

#### 2. Purchase Their Service
1. Add item to cart
2. Complete payment

#### 3. Verify Graceful Handling ✅
**Expected Results**:
- Customer payment succeeds normally
- Customer receives email
- Vendor receives in-app notification (but no email)
- Logs show warning about missing email

**Verification - Logs**:
```bash
# Supabase logs should show:
⚠️  "Vendor X (Business Name) has no contact_email, skipping email notification"
ℹ️  "Vendor should add contact_email to their profile to receive booking notifications"
ℹ️  "Skipping email (no contact_email), but creating in-app notification"
✅ "In-app notification created successfully"
```

**Verification - Database**:
```sql
-- In-app notification should still exist
SELECT * FROM notifications 
WHERE user_id = (SELECT user_id FROM vendors WHERE business_name = 'Test Vendor No Email')
AND type = 'new_booking'
ORDER BY created_at DESC 
LIMIT 1;
-- Should return 1 row
```

---

## Test Scenario 4: Idempotency Test

### Test Steps

#### 1. Complete Normal Payment
1. Make a test purchase
2. Note the order ID and transaction hash

#### 2. Manually Trigger verify-payment Again
```javascript
// Using Supabase client or REST API
const { data, error } = await supabase.functions.invoke('verify-payment', {
  body: {
    transactionHash: 'contract_XXX', // Use actual transaction hash
    orderId: 'YOUR_ORDER_ID',
    expectedAmount: '100000000000000000000',
    fromAddress: 'CUSTOMER_WALLET_ADDRESS',
    toAddress: process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS,
    chainId: 84532
  }
})
```

#### 3. Verify Behavior ✅
**Expected Results**:
- Function returns success
- Logs show "Order already verified"
- Vendor notifications are STILL sent (not skipped)
- Database is NOT updated again (no duplicate entries)
- Vendor receives notification email (possibly duplicate, which is acceptable)

**Verification - Logs**:
```bash
# Second invocation should show:
✅ "ℹ️  Order already verified, will skip blockchain/database updates but send notifications..."
✅ "ℹ️  Skipping blockchain verification (already verified)"
✅ "ℹ️  Skipping order/booking updates (already verified)"
✅ "📧 Sending vendor notifications..."
✅ "ℹ️  Re-verification: Yes"
✅ "✅ Email notification sent successfully"
```

---

## Test Scenario 5: External Wallet Payment

### Test Steps

**NOTE**: Based on code inspection, external wallet functionality appears to be referenced but may not be fully implemented.

#### 1. Check if External Wallet is Available
```bash
# Look for external wallet option in checkout UI
# If not available, skip this test
```

#### 2. If Available: Complete External Wallet Payment
1. Connect MetaMask or other external wallet
2. Add items to cart
3. Select "Use External Wallet" in checkout
4. Approve transaction in wallet
5. Wait for confirmation

#### 3. Verify Same Notification Flow ✅
**Expected Results**:
- Customer receives email
- Vendor receives email
- Vendor has in-app notification
- Flow identical to internal wallet

**Note**: If external wallet import fails in payment API (line 121 in process/route.ts), this feature may not be implemented yet.

---

## Common Issues & Troubleshooting

### Issue 1: No Vendor Email Received
**Possible Causes**:
1. Vendor missing `contact_email` in database
2. RESEND_API_KEY not configured
3. Domain not verified in Resend
4. Email in spam folder

**Debug Steps**:
```sql
-- Check vendor email
SELECT business_name, contact_email 
FROM vendors 
WHERE id = 'VENDOR_ID';

-- Check Supabase logs for email errors
-- Look for: "❌ Email notification failed"
```

**Solution**:
- Add contact_email to vendor profile
- Configure Resend API key
- Check spam folder
- Use verified email domain

### Issue 2: No In-App Notification
**Possible Causes**:
1. RLS policies blocking service role
2. Vendor user_id incorrect
3. Database connection issue

**Debug Steps**:
```sql
-- Verify RLS policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'notifications' 
AND policyname LIKE '%service_role%';

-- Check vendor user_id
SELECT id, user_id FROM vendors WHERE business_name = 'Test Vendor';

-- Try manual insert
INSERT INTO notifications (user_id, type, priority, title, message)
VALUES ('VENDOR_USER_ID', 'new_booking', 'high', 'Test', 'Test message');
```

**Solution**:
- Run `scripts/036_fix_edge_function_rls.sql` if not applied
- Verify vendor user_id is correct
- Check Supabase connection

### Issue 3: Customer Email Not Received
**Possible Causes**:
1. Payment API error before email step
2. Email service configuration issue
3. Wrong customer email in profile

**Debug Steps**:
```bash
# Check payment API logs (server console)
# Look for: "[Payment API] Confirmation email sent successfully"

# Check customer email
SELECT email FROM profiles WHERE id = 'USER_ID';
```

**Solution**:
- Check server logs for errors
- Verify email service configuration
- Update customer email in profile

### Issue 4: Duplicate Notifications
**Expected Behavior**: If verify-payment is called multiple times, vendors may receive duplicate notifications. This is acceptable and better than missing notifications.

**If Duplicates are a Problem**:
```sql
-- Add deduplication logic to track sent notifications
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, vendor_id, notification_type)
);
```

---

## Success Criteria

### ✅ All Tests Pass When:
1. Customer receives payment confirmation email for every purchase
2. Vendor receives booking notification email for every purchase (if they have contact_email)
3. Vendor has in-app notification for every purchase (regardless of email)
4. Multi-vendor purchases notify ALL vendors
5. Vendors without email still get in-app notifications
6. Function logs show clear success/warning messages
7. Idempotency works (no duplicate database entries, notifications may duplicate)
8. No errors in Supabase function logs
9. No payment failures

### ⚠️ Acceptable Issues:
- Vendors without contact_email don't receive email (logged as warning)
- Multiple verify-payment calls may create duplicate notifications (acceptable)
- Notification delivery delay up to 2 minutes (email service dependent)

### ❌ Failure Conditions:
- Customer payment succeeds but vendor never notified
- Function returns error and stops payment
- Database corruption or duplicate orders
- Customer doesn't receive email
- RLS policy blocks notification creation

---

## Reporting Results

### Test Report Template
```markdown
## Test Results - [Date]

### Environment
- Deployment: [Production/Staging/Development]
- Tester: [Name]
- Function Version: [Timestamp from Supabase]

### Test Scenario 1: Internal Wallet
- [x] Customer email received
- [x] Vendor email received
- [x] In-app notification created
- [x] Logs show success
- Issues: None

### Test Scenario 2: Multi-Vendor
- [x] All vendors notified
- [x] Correct bookings per vendor
- Issues: None

### Test Scenario 3: No Email Vendor
- [x] Warning logged correctly
- [x] In-app notification created
- Issues: None

### Test Scenario 4: Idempotency
- [x] No duplicate database entries
- [x] Notifications still sent
- Issues: None

### Test Scenario 5: External Wallet
- [ ] Not tested (feature not implemented)

### Overall Status
**PASS** - All critical tests passed

### Recommendations
- Monitor first 10 production transactions
- Add email to all vendors
- Consider implementing external wallet
```

---

## Rollback Procedure

If tests fail and you need to rollback:

### 1. Immediate Rollback
```bash
# In Supabase Dashboard > Edge Functions > verify-payment
# Click "Deployments" tab
# Find previous working version
# Click "Redeploy" on that version
```

### 2. Verify Rollback
```bash
# Make test purchase
# Verify previous behavior (even if broken)
# Confirm no new errors introduced
```

### 3. Investigate Issue
```bash
# Review Supabase logs for errors
# Check test report for failure details
# Review code changes
# Fix issue and redeploy
```

---

## Next Steps After Testing

1. **If All Tests Pass**:
   - Deploy to production
   - Monitor first 24 hours
   - Collect vendor feedback
   - Update documentation
   - Mark task as complete

2. **If Tests Fail**:
   - Document specific failures
   - Rollback if critical
   - Fix issues
   - Retest
   - Repeat until pass

3. **Future Enhancements**:
   - Implement notification deduplication
   - Add notification retry logic
   - Implement external wallet support
   - Add notification templates for more event types
   - Create vendor notification preferences

---

**Test Coordinator**: [Your Name]
**Last Updated**: [Date]
**Status**: Ready for Testing

