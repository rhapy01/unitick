# Supabase Configuration Fix Guide

## The "Failed to fetch" Error

This error occurs when Supabase client cannot connect to your Supabase project. Here are the most common causes and solutions:

## 🔧 **Quick Fix Steps:**

### 1. **Check Environment Variables**
Create a `.env.local` file in your project root with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. **Get Your Supabase Credentials**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. **Restart Development Server**
```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
# or
pnpm dev
```

## 🔍 **Diagnostic Steps:**

### Run the diagnostic script:
```bash
node scripts/diagnose-supabase-config.js
```

### Check browser console for:
- Network errors
- CORS issues
- Invalid URLs

## 🚨 **Common Issues:**

### **Issue 1: Missing Environment Variables**
**Symptoms:** `Failed to fetch` on login
**Solution:** Add `.env.local` file with correct Supabase credentials

### **Issue 2: Wrong URL Format**
**Symptoms:** Connection refused
**Solution:** Ensure URL starts with `https://` and ends with `.supabase.co`

### **Issue 3: Invalid Anon Key**
**Symptoms:** Authentication errors
**Solution:** Copy the correct `anon public` key from Supabase dashboard

### **Issue 4: Project Paused/Inactive**
**Symptoms:** Connection timeout
**Solution:** Check Supabase dashboard - ensure project is active

### **Issue 5: CORS Issues**
**Symptoms:** CORS errors in browser console
**Solution:** Add your domain to Supabase allowed origins

## 📋 **Environment File Template:**

Create `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔄 **After Fixing:**

1. **Restart your development server**
2. **Clear browser cache**
3. **Test login again**
4. **Check browser network tab** for successful requests

## 📞 **Still Having Issues?**

If the problem persists:
1. Check Supabase project status
2. Verify network connectivity
3. Check browser console for specific error messages
4. Try incognito/private browsing mode
5. Check if your Supabase project has any usage limits

## 🎯 **Quick Test:**

After setting up environment variables, test with:
```bash
# Run diagnostic
node scripts/diagnose-supabase-config.js

# Check if variables are loaded
echo $NEXT_PUBLIC_SUPABASE_URL
```
