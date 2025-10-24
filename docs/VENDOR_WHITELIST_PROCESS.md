# Vendor Wallet Whitelist Process

## Overview

The UniTick platform uses a **whitelist system** to ensure only verified vendor wallet addresses can receive payments through our smart contracts. This is a critical security measure that prevents unauthorized addresses from receiving funds.

## Why Whitelisting is Required

### Security Benefits
- **Prevents unauthorized payments**: Only verified vendor addresses can receive funds
- **Protects against fraud**: Ensures payments go to legitimate business addresses
- **Smart contract compliance**: Our UnilaBook contract enforces whitelist checks
- **Regulatory compliance**: Helps maintain proper vendor verification records

### Technical Requirements
- All vendor wallet addresses must be whitelisted on the blockchain
- Smart contract automatically checks whitelist status before processing payments
- Non-whitelisted addresses will cause payment transactions to fail

## Vendor Onboarding Process

### 1. Vendor Registration
When vendors sign up, they must provide:
- Business information (name, description, contact details)
- Service categories they offer
- **Crypto wallet address** for receiving payments
- Jurisdiction/country of operation

### 2. Wallet Address Submission
- Vendors enter their wallet address during profile setup
- Address must be a valid Ethereum address (0x...)
- Vendor must have full control/access to this wallet
- Address cannot be changed after whitelisting without admin approval

### 3. Verification Process
- Vendor profile is reviewed by admin team
- Business verification includes:
  - Business registration validation
  - Contact information verification
  - Jurisdiction compliance check
  - Service category appropriateness

### 4. Whitelist Application Process
After completing vendor profile setup:
- Vendor must submit whitelist application form at: https://formspree.io/f/xrgnzlog
- Form requires: business details, external wallet address, in-app wallet address
- Admin reviews application and approves whitelist
- System adds wallet address to smart contract whitelist
- Vendor receives email notification of whitelist status
- Vendor can now receive payments through the platform

## Whitelist Application Form

### Formspree Integration
The whitelist application process uses Formspree for easy form submission:

**Form URL**: https://formspree.io/f/xrgnzlog

### Required Information
The whitelist application form requires vendors to provide:

1. **Business Information**
   - Company/Business name (as filled in the app)
   - Business description
   - Contact email and phone
   - Jurisdiction/country

2. **Wallet Addresses**
   - **External Wallet Address**: For receiving payments (MetaMask, Trust Wallet, etc.)
   - **In-App Wallet Address**: Created through the platform for internal features

3. **Verification Status**
   - Confirmation that vendor profile is complete
   - Agreement to platform terms and conditions

### Form Submission Process
1. Vendor completes profile setup in the app
2. Vendor creates in-app wallet through platform
3. Vendor submits whitelist application form with both addresses
4. Admin reviews application and business details
5. Admin approves and adds external wallet to blockchain whitelist
6. Vendor receives confirmation email
7. Vendor can now receive payments

## Whitelist Status Tracking

### Vendor Dashboard
Vendors can check their whitelist status in their dashboard:
- **Green Badge**: "Wallet Whitelisted" - Ready to receive payments
- **Red Badge**: "Wallet Not Whitelisted" - Cannot receive payments yet

### Status Information Displayed
- Wallet address (truncated for security)
- Whitelist status (whitelisted/not whitelisted)
- Action required notifications
- Payment eligibility status

## Admin Whitelist Management

### Admin Dashboard Features
Admins can manage vendor whitelists through the admin panel:

#### Whitelist Operations
- **Add Address**: Manually add vendor wallet to whitelist
- **Remove Address**: Remove vendor wallet from whitelist
- **Batch Add**: Add multiple addresses at once
- **Check Status**: Verify if address is whitelisted
- **View Count**: See total number of whitelisted vendors

#### Automatic Whitelisting
- System automatically whitelists verified vendors
- API endpoint: `/api/vendor-whitelist`
- Checks database for verified vendors
- Adds to blockchain whitelist automatically

### Whitelist API Endpoints

#### Check Whitelist Status
```typescript
POST /api/admin/vendor-whitelist
{
  "action": "check",
  "address": "0x..."
}
```

#### Add to Whitelist
```typescript
POST /api/admin/vendor-whitelist
{
  "action": "add",
  "address": "0x..."
}
```

#### Batch Add
```typescript
POST /api/admin/vendor-whitelist
{
  "action": "batchAdd",
  "addresses": ["0x...", "0x..."]
}
```

## Smart Contract Integration

### UnilaBook Contract
The whitelist is enforced at the smart contract level:

```solidity
// Vendor whitelist mapping
mapping(address => bool) public whitelistedVendors;

// Check before processing payments
require(whitelistedVendors[vendorAddress], "Vendor not whitelisted");
```

### Whitelist Functions
- `addVendorToWhitelist(address)`: Add single vendor
- `batchAddVendorsToWhitelist(address[])`: Add multiple vendors
- `removeVendorFromWhitelist(address)`: Remove vendor
- `isVendorWhitelisted(address)`: Check status
- `getWhitelistedVendorsCount()`: Get total count

## Troubleshooting

### Common Issues

#### "Vendor not whitelisted" Error
- **Cause**: Vendor wallet address not in whitelist
- **Solution**: Admin must add address to whitelist
- **Prevention**: Automatic whitelisting after verification

#### Payment Failures
- **Cause**: Whitelist check fails during transaction
- **Solution**: Verify whitelist status and re-add if needed
- **Monitoring**: Check transaction logs for whitelist errors

#### Address Mismatch
- **Cause**: Vendor provided wrong wallet address
- **Solution**: Update vendor profile and re-whitelist
- **Prevention**: Address validation during registration

### Support Process
1. Vendor contacts support about payment issues
2. Support checks whitelist status
3. If not whitelisted, admin adds address
4. Vendor receives confirmation email
5. Payment processing resumes

## Best Practices

### For Vendors
- Use a dedicated business wallet address
- Keep wallet secure and accessible
- Don't change address after whitelisting
- Contact support if whitelist issues occur

### For Admins
- Verify vendor information before whitelisting
- Monitor whitelist status regularly
- Respond quickly to whitelist requests
- Keep whitelist records updated

### For Developers
- Always check whitelist status before payments
- Implement proper error handling
- Log whitelist operations for audit
- Test whitelist functionality thoroughly

## Security Considerations

### Access Control
- Only contract owner can modify whitelist
- Admin panel requires proper authentication
- API endpoints protected with authorization

### Audit Trail
- All whitelist changes are logged
- Blockchain events track whitelist modifications
- Database records maintain whitelist history

### Monitoring
- Regular whitelist status checks
- Payment failure analysis
- Unauthorized access attempts logging

## Future Enhancements

### Planned Features
- Multi-signature whitelist management
- Automated compliance checks
- Integration with KYC services
- Advanced vendor verification workflows

### Scalability
- Batch operations for large vendor lists
- Optimized smart contract functions
- Efficient whitelist checking mechanisms
- Caching for improved performance

---

## Summary

The vendor whitelist system is essential for:
- **Security**: Preventing unauthorized payments
- **Compliance**: Ensuring proper vendor verification
- **Trust**: Building confidence in the platform
- **Functionality**: Enabling secure payment processing

All vendors must understand that their wallet address must be whitelisted before they can receive payments through the UniTick platform. The process is designed to be automatic after verification approval, with clear status tracking and support for any issues that arise.
