"use client"

import type React from "react"
import Image from "next/image"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { validateLogin } from "@/lib/auth-validation-client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate input data
      const validatedData = await validateLogin({
        email,
        password
      })

      const supabase = createClient()
      
      console.log('🔍 Login attempt:', {
        email: validatedData.email,
        hasPassword: !!validatedData.password,
        rememberMe
      })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          persistSession: rememberMe,
        },
      })

      if (error) {
        console.error('❌ Supabase auth error:', error)
        throw error
      }
      
      console.log('✅ Login successful:', data)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-black">
      <div className="w-full max-w-md">
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
            Welcome Back
          </h1>
          <p className="text-gray-400">Sign in to continue to UniTick</p>
        </div>

        <Card className="border-gray-800 bg-gray-950 shadow-2xl">
          <CardHeader className="space-y-1 pb-6 text-center border-b border-gray-800 bg-gray-950">
            <CardTitle className="text-2xl font-bold text-white">Sign In</CardTitle>
            <CardDescription className="text-gray-400">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 bg-gray-950">
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-5">
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-300">Password</Label>
                    <Link href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-gray-800 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-sm font-medium text-gray-300 leading-none cursor-pointer select-none"
                  >
                    Keep me signed in
                  </label>
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
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/signup" className="font-semibold text-primary hover:text-primary/80 underline-offset-4 transition-colors">
                    Create account
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Secured with industry-standard encryption
        </p>
      </div>
    </div>
  )
}
