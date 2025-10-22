import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// Validation schemas
export const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["user", "vendor"], {
    errorMap: () => ({ message: "Role must be either 'user' or 'vendor'" })
  })
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
})

export const walletUpdateSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format")
})

// Rate limiting for authentication
const authAttempts = new Map<string, { count: number; resetTime: number }>()
const MAX_AUTH_ATTEMPTS = 5
const AUTH_RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes

export function checkAuthRateLimit(identifier: string): boolean {
  const now = Date.now()
  const attempt = authAttempts.get(identifier)
  
  if (!attempt || now > attempt.resetTime) {
    authAttempts.set(identifier, { count: 1, resetTime: now + AUTH_RATE_LIMIT_WINDOW })
    return true
  }
  
  if (attempt.count >= MAX_AUTH_ATTEMPTS) {
    return false
  }
  
  attempt.count++
  return true
}

// Server-side authentication validation
export async function validateSignup(data: unknown) {
  try {
    const validatedData = signupSchema.parse(data)
    
    // Check rate limiting
    if (!checkAuthRateLimit(`signup:${validatedData.email}`)) {
      throw new Error("Too many signup attempts. Please wait 15 minutes before trying again.")
    }
    
    // Check if email already exists
    const supabase = await createClient()
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", validatedData.email)
      .single()
    
    if (existingUser) {
      throw new Error("An account with this email already exists")
    }
    
    return validatedData
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message)
    }
    throw error
  }
}

export async function validateLogin(data: unknown) {
  try {
    const validatedData = loginSchema.parse(data)
    
    // Check rate limiting
    if (!checkAuthRateLimit(`login:${validatedData.email}`)) {
      throw new Error("Too many login attempts. Please wait 15 minutes before trying again.")
    }
    
    return validatedData
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message)
    }
    throw error
  }
}

export async function validateWalletUpdate(data: unknown, userId: string) {
  try {
    const validatedData = walletUpdateSchema.parse(data)

    // Check rate limiting
    if (!checkAuthRateLimit(`wallet_update:${userId}`)) {
      throw new Error("Too many wallet update attempts. Please wait 15 minutes before trying again.")
    }

    // Check wallet uniqueness - ensure this wallet isn't connected to another account
    const supabase = await createClient()
    const { data: existingWallet } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("wallet_address", validatedData.walletAddress)
      .neq("id", userId)
      .single()

    if (existingWallet) {
      throw new Error("This wallet address is already connected to another account. Each wallet can only be connected to one account.")
    }

    // Server-side wallet update restriction check
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_connected_at, wallet_address")
      .eq("id", userId)
      .single()

    // Check if user already has a different wallet connected
    if (profile?.wallet_address && profile.wallet_address !== validatedData.walletAddress) {
      throw new Error("You already have a wallet connected to this account. Please disconnect the current wallet before connecting a new one.")
    }

    if (profile?.wallet_connected_at) {
      const connectedDate = new Date(profile.wallet_connected_at)
      const now = new Date()
      const daysSinceConnection = Math.floor((now.getTime() - connectedDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceConnection < 80) {
        throw new Error(`Wallet address can only be updated once every 80 days. Please wait ${80 - daysSinceConnection} more days.`)
      }
    }

    return validatedData
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message)
    }
    throw error
  }
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  if (password.length >= 8) score++
  else feedback.push("Use at least 8 characters")
  
  if (/[a-z]/.test(password)) score++
  else feedback.push("Add lowercase letters")
  
  if (/[A-Z]/.test(password)) score++
  else feedback.push("Add uppercase letters")
  
  if (/\d/.test(password)) score++
  else feedback.push("Add numbers")
  
  if (/[@$!%*?&]/.test(password)) score++
  else feedback.push("Add special characters (@$!%*?&)")
  
  if (password.length >= 12) score++
  
  return { score, feedback }
}

// Session validation
export async function validateSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error("Invalid session")
  }
  
  return user
}

// Admin validation
export async function validateAdmin() {
  const user = await validateSession()
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (profile?.role !== "admin") {
    throw new Error("Admin access required")
  }
  
  return user
}
