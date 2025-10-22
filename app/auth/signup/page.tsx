"use client"

import type React from "react"

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
import { Wallet, CheckCircle2, User, Mail, Lock, Sparkles, Store, ShoppingBag } from "lucide-react"

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
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-background via-background to-accent/5">
      <div className="w-full max-w-lg">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4 shadow-lg">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Join UniTick
          </h1>
          <p className="text-muted-foreground mt-2">Start your crypto ticketing journey</p>
        </div>

        <Card className="border-border/50 shadow-xl backdrop-blur">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>Enter your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup}>
              <div className="flex flex-col gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                    />
                  </div>
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
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {passwordStrength.feedback.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label className="text-sm font-medium">Account Type</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value as "user" | "vendor")} className="grid grid-cols-2 gap-3">
                    <div>
                      <RadioGroupItem value="user" id="user" className="peer sr-only" />
                      <Label
                        htmlFor="user"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                      >
                        <ShoppingBag className="mb-2 h-6 w-6" />
                        <div className="text-center">
                          <div className="font-semibold">Customer</div>
                          <div className="text-xs text-muted-foreground mt-1">Book services & tickets</div>
                        </div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="vendor" id="vendor" className="peer sr-only" />
                      <Label
                        htmlFor="vendor"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                      >
                        <Store className="mb-2 h-6 w-6" />
                        <div className="text-center">
                          <div className="font-semibold">Vendor</div>
                          <div className="text-xs text-muted-foreground mt-1">List services & sell tickets</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {/* Vendor Setup Notice */}
                {role === "vendor" && (
                  <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200/50 dark:border-purple-800/50 rounded-xl p-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-3xl" />
                    <div className="relative flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                        <Store className="h-5 w-5 text-white" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                          Vendor Account Setup
                          <Sparkles className="h-4 w-4 text-yellow-500" />
                        </h4>
                        <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1.5">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                            <span>After signup, you'll complete your vendor profile</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Add business details and service categories</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Start listing services immediately after setup</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Wallet Creation Notice */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl" />
                  <div className="relative flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        Easy Wallet Setup
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                      </h4>
                      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1.5">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Create your wallet with one click after signup</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Ready to use in seconds</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Or connect your existing wallet anytime</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive" className="border-destructive/50">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-accent text-white hover:bg-accent/90" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="font-semibold text-primary hover:underline underline-offset-4 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
