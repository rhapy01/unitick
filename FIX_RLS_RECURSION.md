# Fix for "infinite recursion detected in policy for relation 'vendors'"

## The Problem

The error `infinite recursion detected in policy for relation "vendors"` occurs because RLS policies on other tables (like `listings`, `bookings`) query the `vendors` table, which triggers RLS policies on vendors. If those policies also query tables that reference vendors, it creates an infinite loop.

## The Solution

Run the SQL script `scripts/sql/056_fix_vendors_rls_final.sql` in your Supabase SQL Editor to fix this issue.

### How to Apply the Fix:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `scripts/sql/056_fix_vendors_rls_final.sql`
4. Paste and run it in the SQL Editor
5. The script will:
   - Simplify all RLS policies on vendors table
   - Remove recursive queries that reference vendors
   - Ensure all tables can be queried without triggering recursion

### What This Fix Does:

- **Vendors table**: Makes it publicly readable (no recursion)
- **Listings table**: Only checks `is_active` flag, no vendor queries
- **Cart items**: Simple user-based policies
- **Bookings**: Simple user-based policies
- **Unila miles**: Simple user-based policies (if exists)

### After Running:

Your application should work normally. The shop page will be able to query listings, vendors, cart items, and bookings without triggering recursion errors.

## Alternative: Manual Quick Fix

If you prefer to fix it manually, go to Supabase Dashboard → Authentication → Policies and:

1. On the `vendors` table, ensure you have a simple SELECT policy: `USING (true)`
2. On all other tables, avoid querying the vendors table in policy USING clauses

