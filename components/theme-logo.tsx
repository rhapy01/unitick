"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface ThemeLogoProps {
  width?: number
  height?: number
  className?: string
  alt?: string
}

export function ThemeLogo({ 
  width = 32, 
  height = 32, 
  className = "h-8 w-8",
  alt = "UniTick Logo"
}: ThemeLogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder during SSR to prevent hydration mismatch
    return (
      <div 
        className={className}
        style={{ width, height }}
      />
    )
  }

  // Determine which logo to use based on theme
  const logoSrc = resolvedTheme === 'dark' ? '/darklogo.png' : '/logo.png'

  return (
    <Image 
      src={logoSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  )
}
