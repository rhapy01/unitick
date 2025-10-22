# Supabase Authentication Debug Guide

## The 400 Bad Request Error

The error `POST https://ecnzzjfjtrkplmzawbji.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)` indicates that Supabase is rejecting the authentication request.

## 🔍 **Common Causes & Solutions:**

### **1. User Account Issues**
- **User doesn't exist** in Supabase Auth
- **Wrong email/password**
- **Account disabled or suspended**

### **2. Email Confirmation Required**
- **Check Supabase Dashboard** → Authentication → Settings
- **Look for "Enable email confirmations"**
- **If enabled, user must confirm email before login**

### **3. Password Policy Issues**
- **Check Supabase password requirements**
- **May require specific complexity**

### **4. Supabase SSR Client Issues**
- **I've switched to regular Supabase client** (not SSR)
- **This should fix client-side auth issues**

## 🛠️ **Debug Steps:**

### **Step 1: Check Browser Console**
After the changes I made, you should see:
```
🔍 Supabase Client Config: { url: "...", hasAnonKey: true, anonKeyLength: 123 }
🔍 Login attempt: { email: "...", hasPassword: true, rememberMe: false }
```

### **Step 2: Check Supabase Dashboard**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Users**
4. Check if your test user exists
5. Check if email is confirmed

### **Step 3: Test with Known Good Account**
Try logging in with an account you know exists and works.

### **Step 4: Check Authentication Settings**
In Supabase Dashboard → **Authentication** → **Settings**:
- Check if "Enable email confirmations" is ON
- Check password requirements
- Check if any restrictions are set

## 🔧 **Quick Fixes:**

### **Fix 1: Disable Email Confirmation (if needed)**
1. Supabase Dashboard → Authentication → Settings
2. Turn OFF "Enable email confirmations"
3. Try login again

### **Fix 2: Create Test User**
1. Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Create a test user with known credentials
4. Try logging in with those credentials

### **Fix 3: Check User Status**
In Supabase Dashboard → Authentication → Users:
- Look for your user
- Check if status is "Active"
- Check if email is "Confirmed"

## 📋 **What I Changed:**

1. ✅ **Switched from SSR client to regular Supabase client**
2. ✅ **Added detailed logging** to see exact error
3. ✅ **Added configuration logging** to verify env vars

## 🎯 **Next Steps:**

1. **Restart your dev server** (to pick up the client changes)
2. **Try logging in** and check browser console
3. **Look for the detailed error message**
4. **Check Supabase Dashboard** for user status

The detailed logging will show us exactly what's going wrong!





