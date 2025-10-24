"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { ThemeLogo } from "@/components/theme-logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShoppingCart, UserIcon, LogOut, LayoutDashboard, Award, Menu, Store, Settings, X, FileText, Home, UserCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { ThemeSwitcher } from "@/components/theme-switcher"

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [unilaMiles, setUnilaMiles] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const updateCartCount = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setCartCount(0)
        return
      }
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id)
      if (error) {
        setCartCount(0)
        return
      }
      const total = (data || []).reduce((sum: number, row: any) => sum + (row.quantity || 0), 0)
      setCartCount(total)
    } catch {
      setCartCount(0)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        if (profile?.role === "vendor") {
          const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", user.id).single()

          if (vendor) {
            const { data: milesData } = await supabase.from("unila_miles").select("miles").eq("vendor_id", vendor.id)

            const total = milesData?.reduce((sum, record) => sum + record.miles, 0) || 0
            setUnilaMiles(total)
          }
        } else {
          const { data: milesData } = await supabase.from("unila_miles").select("miles").eq("user_id", user.id)

          const total = milesData?.reduce((sum, record) => sum + record.miles, 0) || 0
          setUnilaMiles(total)
        }
      }
    }
    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    updateCartCount()

    window.addEventListener("storage", () => updateCartCount())
    window.addEventListener("cartUpdated", () => updateCartCount())

    return () => {
      subscription.unsubscribe()
      window.removeEventListener("storage", () => updateCartCount())
      window.removeEventListener("cartUpdated", () => updateCartCount())
    }
  }, [supabase.auth, pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex items-center gap-2">
            <ThemeLogo 
              width={32} 
              height={32}
              className="h-8 w-8"
              alt="UniTick Logo"
            />
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              BETA
            </Badge>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/shop" className="text-sm hover:text-primary transition-colors">
              Browse Services
            </Link>
            <Link href="/vendors" className="text-sm hover:text-primary transition-colors">
              Browse Vendors
            </Link>
            <Link href="/docs" className="text-sm hover:text-primary transition-colors">
              Docs
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {user && <NotificationBell />}
          
          <ThemeSwitcher />

          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-white text-xs flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {unilaMiles > 0 && (
                    <>
                      <div className="px-2 py-2">
                        <Badge variant="secondary" className="w-full justify-center">
                          <Award className="mr-2 h-3 w-3" />
                          {unilaMiles} Unila Miles
                        </Badge>
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-black border-gray-800 p-0">
              <div className="flex flex-col h-full">
                {/* Compact Header */}
                <div className="px-4 py-4 border-b border-gray-800">
                  <div className="flex items-center gap-2 mb-3">
                    <ThemeLogo 
                      width={24} 
                      height={24}
                      className="h-6 w-6"
                      alt="UniTick"
                    />
                    <span className="font-semibold text-sm">UniTick</span>
                  </div>
                  {user && (
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  )}
                </div>

                {/* Compact Navigation */}
                <nav className="flex-1 overflow-y-auto py-2">
                  {user && (
                    <>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-900 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Dashboard</span>
                      </Link>
                      <Link
                        href="/cart"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-900 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <ShoppingCart className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Cart</span>
                        {cartCount > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {cartCount}
                          </Badge>
                        )}
                      </Link>
                      {unilaMiles > 0 && (
                        <div className="flex items-center gap-3 px-4 py-2">
                          <Award className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-400">{unilaMiles} Miles</span>
                        </div>
                      )}
                      <div className="border-t border-gray-800 my-2"></div>
                    </>
                  )}
                  
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-900 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Home</span>
                  </Link>
                  <Link
                    href="/shop"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-900 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Store className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Browse Services</span>
                  </Link>
                  <Link
                    href="/vendors"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-900 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Browse Vendors</span>
                  </Link>
                  <Link
                    href="/docs"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-900 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Docs</span>
                  </Link>
                  
                  <div className="border-t border-gray-800 my-2"></div>
                  
                  <div className="flex items-center gap-3 px-4 py-2">
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span className="text-sm flex-1">Theme</span>
                    <ThemeSwitcher />
                  </div>

                  {user && (
                    <>
                      <div className="border-t border-gray-800 my-2"></div>
                      <button
                        onClick={() => {
                          handleSignOut()
                          setMobileMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-900 transition-colors w-full text-left text-red-400"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm">Sign out</span>
                      </button>
                    </>
                  )}
                  
                  {!user && (
                    <>
                      <div className="border-t border-gray-800 my-2"></div>
                      <Link
                        href="/auth/login"
                        className="flex items-center justify-center px-4 py-2 mb-2 hover:bg-gray-900 transition-colors text-sm"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="flex items-center justify-center px-4 py-2 bg-white text-black hover:bg-gray-100 transition-colors text-sm font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
