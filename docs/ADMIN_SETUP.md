# Admin Dashboard Setup Guide

## Overview

The admin dashboard is located at `/admin` and provides administrative tools for managing the platform.

## Admin Dashboard Features

The admin dashboard includes the following sections:

1. **Verifications** - Approve or reject vendor verification applications
2. **Users** - View all users and their roles
3. **Vendors** - Manage vendor accounts and verification status
4. **Listings** - View and manage all service listings
5. **Whitelist** - Manage vendor wallet addresses authorized to receive payments

## Setting Up an Admin User

Currently, there is no admin user in the database. To create an admin user:

### Method 1: Via Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the following SQL script to set your email as admin:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

4. Verify the change:

```sql
SELECT email, role FROM profiles WHERE role = 'admin';
```

### Method 2: Set First User as Admin

If you want to make the first registered user an admin:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
    SELECT id 
    FROM profiles 
    ORDER BY created_at ASC 
    LIMIT 1
);
```

### Method 3: Using the Setup Script

Run the provided SQL script:

```bash
# The script is located at database/setup-admin-user.sql
# You can copy and paste it into Supabase SQL Editor
```

## Access Control

The admin dashboard has built-in access control:

- **Authentication Check**: Must be logged in
- **Role Check**: Must have `role = 'admin'` in the `profiles` table
- **Redirect**: Non-admin users are redirected to `/dashboard`

## Admin Dashboard Location

- **File**: `app/admin/page.tsx`
- **Route**: `/admin`
- **Component**: `AdminDashboardPage`

## Admin API Endpoints

The admin dashboard uses these API endpoints:

- `/api/admin/vendor-whitelist` - Manage vendor wallet whitelist
- `/api/admin/vendor-whitelist` - Check whitelist status
- `/api/admin/vendor-whitelist` - Add/remove addresses

## Database Schema

Admins are identified by the `role` field in the `profiles` table:

```sql
CREATE TYPE user_role AS ENUM ('user', 'vendor', 'admin');
```

## Security Notes

- Admin role is checked on the client side and server side
- Only users with `role = 'admin'` can access admin features
- Make sure to use a secure email address for admin accounts
- Consider implementing additional security measures for production

## Troubleshooting

### Can't Access Admin Dashboard

1. Check you're logged in: Visit `/auth/login`
2. Verify your role: Run `SELECT email, role FROM profiles WHERE email = 'your-email@example.com'`
3. Ensure role is exactly 'admin' (case-sensitive)

### Admin User Not Found

If you see "Access denied":
- The user doesn't exist in the database
- The user's role is not set to 'admin'
- Check your email address matches exactly

