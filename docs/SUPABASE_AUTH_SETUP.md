# Supabase Authentication Setup Guide

## The Issue
You're getting "Invalid login credentials" errors because the Supabase environment variables are not configured.

## Quick Fix

### Step 1: Create Environment File
Create a file named `.env.local` in your project root with the following content:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Development redirect URL
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/
```

### Step 2: Get Your Supabase Credentials
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Replace `https://your-project-id.supabase.co`
   - **anon public** key → Replace `your-anon-key-here`

### Step 3: Restart Development Server
```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
# or
pnpm dev
```

## Testing the Fix

### Option 1: Run Diagnostic Script
```bash
node scripts/diagnose-supabase-config.js
```

### Option 2: Test Login
1. Go to `/auth/signup` and create a new account
2. Then try logging in at `/auth/login`

## Common Issues

### Issue 1: Still Getting "Invalid login credentials"
- **Cause**: No users exist in your Supabase project
- **Solution**: Create a user account first via the signup page

### Issue 2: "Failed to fetch" Error
- **Cause**: Wrong Supabase URL or project is paused
- **Solution**: Check Supabase dashboard - ensure project is active

### Issue 3: CORS Errors
- **Cause**: Domain not allowed in Supabase settings
- **Solution**: Add `localhost:3000` to allowed origins in Supabase

## Your Current Error
```
POST https://ecnzzjfjtrkplmzawbji.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
❌ Supabase auth error: AuthApiError: Invalid login credentials
```

This indicates:
1. ✅ Supabase URL is configured (ecnzzjfjtrkplmzawbji.supabase.co)
2. ❌ Either no users exist OR wrong credentials

## Next Steps
1. Create `.env.local` file with your Supabase credentials
2. Restart your development server
3. Create a test user account via signup
4. Try logging in with the test account

## Need Help?
If you don't have a Supabase project yet:
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for it to initialize
4. Get your credentials from Settings → API
5. Follow the steps above
