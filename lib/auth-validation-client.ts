import { z } from "zod"

// Schemas
export const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["user", "vendor"], {
    errorMap: () => ({ message: "Role must be either 'user' or 'vendor'" }),
  }),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

export const walletUpdateSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format"),
})

// Client-safe validators (no server imports)
export async function validateSignup(data: unknown) {
  return signupSchema.parse(data)
}

export async function validateLogin(data: unknown) {
  return loginSchema.parse(data)
}

export async function validateWalletUpdate(data: unknown, _userId?: string) {
  // Only schema validation on the client; server-side timing checks are handled in UI
  return walletUpdateSchema.parse(data)
}

// Password strength checker (pure client)
export function checkPasswordStrength(password: string): { score: number; feedback: string[] } {
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


