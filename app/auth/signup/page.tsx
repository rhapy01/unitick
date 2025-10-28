"use client"

import type React from "react"
import Image from "next/image"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { validateSignup, checkPasswordStrength } from "@/lib/auth-validation-client"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<"user" | "vendor">("user")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string[] }>({ score: 0, feedback: [] })
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Additional validation to ensure role is valid
      if (role !== "user" && role !== "vendor") {
        throw new Error("Invalid account type selected")
      }

      // Validate input data
      const validatedData = await validateSignup({
        email,
        password,
        fullName,
        role
      })

      console.log("[Signup] Creating account with role:", validatedData.role)

      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/`,
          data: {
            full_name: validatedData.fullName,
            role: validatedData.role,
          },
        },
      })
      if (error) throw error
      
      console.log("[Signup] Account created successfully with role:", validatedData.role)
      router.push("/auth/signup-success")
    } catch (error: unknown) {
      console.error("[Signup] Error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword)
    setPasswordStrength(checkPasswordStrength(newPassword))
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-black overflow-y-auto">
      <div className="w-full max-w-2xl py-8">
        {/* Logo/Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-5">
            <Image 
              src="/darklogo.png" 
              alt="UniTick Logo" 
              width={64} 
              height={64}
              className="w-16 h-16"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Join UniTick
          </h1>
          <p className="text-gray-400">Start your crypto ticketing journey</p>
        </div>

        <Card className="border-gray-800 bg-gray-950 shadow-2xl">
          <CardHeader className="space-y-1 pb-6 border-b border-gray-800 bg-gray-950">
            <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
            <CardDescription className="text-gray-400">Enter your details to get started</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 bg-gray-950">
            <form onSubmit={handleSignup}>
              <div className="flex flex-col gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-300">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-300">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary"
                    required
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                  />
                  {password && passwordStrength.feedback.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              level <= passwordStrength.score
                                ? level <= 2
                                  ? "bg-red-500"
                                  : level <= 3
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                                : "bg-gray-700"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">
                        {passwordStrength.feedback.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label className="text-sm font-medium text-gray-300">Account Type</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value as "user" | "vendor")} className="grid grid-cols-2 gap-3">
                    <div>
                      <RadioGroupItem value="user" id="user" className="peer sr-only" />
                      <Label
                        htmlFor="user"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-gray-700 bg-gray-900 p-5 hover:border-primary/50 hover:bg-gray-800 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-gray-800 cursor-pointer transition-all"
                      >
                        <div className="text-2xl mb-2">🛍️</div>
                        <div className="text-center">
                          <div className="font-semibold text-white">Customer</div>
                          <div className="text-xs text-gray-400 mt-1">Book services & tickets</div>
                        </div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="vendor" id="vendor" className="peer sr-only" />
                      <Label
                        htmlFor="vendor"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-gray-700 bg-gray-900 p-5 hover:border-primary/50 hover:bg-gray-800 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-gray-800 cursor-pointer transition-all"
                      >
                        <div className="text-2xl mb-2">🏪</div>
                        <div className="text-center">
                          <div className="font-semibold text-white">Vendor</div>
                          <div className="text-xs text-gray-400 mt-1">List services & sell tickets</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {/* Vendor Setup Notice */}
                {role === "vendor" && (
                  <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                    <div className="relative space-y-3">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        Vendor Account Setup
                      </h4>
                      <div className="text-sm text-gray-300 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>After signup, you'll complete your vendor profile</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>Add business details and service categories</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>Start listing services immediately after setup</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Wallet Creation Notice */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                  <div className="relative space-y-3">
                    <h4 className="font-semibold text-white">
                      Easy Wallet Setup
                    </h4>
                    <div className="text-sm text-gray-300 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Create your wallet with one click after signup</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Ready to use in seconds</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Or connect your existing wallet anytime</span>
                      </div>
                    </div>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive" className="border-red-800 bg-red-950">
                    <AlertDescription className="text-sm text-red-300">{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90 text-white" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="font-semibold text-primary hover:text-primary/80 underline-offset-4 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
