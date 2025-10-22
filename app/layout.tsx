import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "UniTick",
  description:
    "Book accommodation, car hire, tours, cinema, and events with crypto - Earn Unila Miles with every booking!",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased dark`} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            :root, .dark {
              --background: #000000 !important;
              --foreground: #ffffff !important;
              --card: #0a0a0a !important;
              --card-foreground: #ffffff !important;
              --popover: #0a0a0a !important;
              --popover-foreground: #ffffff !important;
              --primary: #ffffff !important;
              --primary-foreground: #000000 !important;
              --secondary: #18181b !important;
              --secondary-foreground: #ffffff !important;
              --muted: #27272a !important;
              --muted-foreground: #a1a1aa !important;
              --accent: #3b82f6 !important;
              --accent-foreground: #ffffff !important;
              --destructive: #ef4444 !important;
              --destructive-foreground: #ffffff !important;
              --border: #27272a !important;
              --input: #27272a !important;
              --ring: #3b82f6 !important;
              --radius: 0.5rem !important;
            }
            body {
              background-color: #000000 !important;
              color: #ffffff !important;
            }
                   /* Blue accents ONLY for specific accent elements - NOT primary text */
                   :root:not(.gradient) .text-accent,
                   :root:not(.gradient) [class*="text-accent"] {
                     color: #3b82f6 !important;
                   }
                   :root:not(.gradient) .bg-accent,
                   :root:not(.gradient) [class*="bg-accent"] {
                     background-color: #3b82f6 !important;
                     color: #ffffff !important;
                   }
                   :root:not(.gradient) .border-accent,
                   :root:not(.gradient) [class*="border-accent"] {
                     border-color: #3b82f6 !important;
                   }
                   :root:not(.gradient) .ring-accent,
                   :root:not(.gradient) [class*="ring-accent"] {
                     --tw-ring-color: #3b82f6 !important;
                   }
                   /* Primary elements should be WHITE, not blue */
                   :root:not(.gradient) .text-primary,
                   :root:not(.gradient) [class*="text-primary"] {
                     color: #ffffff !important;
                   }
                   :root:not(.gradient) .bg-primary,
                   :root:not(.gradient) [class*="bg-primary"] {
                     background-color: #ffffff !important;
                     color: #000000 !important;
                   }
                   :root:not(.gradient) .border-primary,
                   :root:not(.gradient) [class*="border-primary"] {
                     border-color: #ffffff !important;
                   }
                   :root:not(.gradient) .ring-primary,
                   :root:not(.gradient) [class*="ring-primary"] {
                     --tw-ring-color: #ffffff !important;
                   }
                   /* GRADIENT THEME - Black background, White primary, Pink accent only */
                   html.gradient {
                     --background: #000000 !important;
                     --foreground: #ffffff !important;
                     --card: #0a0a0a !important;
                     --card-foreground: #ffffff !important;
                     --popover: #0a0a0a !important;
                     --popover-foreground: #ffffff !important;
                     --primary: #ffffff !important;
                     --primary-foreground: #000000 !important;
                     --secondary: #18181b !important;
                     --secondary-foreground: #ffffff !important;
                     --muted: #27272a !important;
                     --muted-foreground: #ffffff !important;
                     --accent: #E4405F !important;
                     --accent-foreground: #ffffff !important;
                     --destructive: #ef4444 !important;
                     --destructive-foreground: #ffffff !important;
                     --border: #27272a !important;
                     --input: #27272a !important;
                     --ring: #E4405F !important;
                   }
                   /* Pink accents ONLY for specific accent elements - NOT primary text */
                   html.gradient .text-accent,
                   html.gradient [class*="text-accent"] {
                     color: #E4405F !important;
                   }
                   html.gradient .bg-accent,
                   html.gradient [class*="bg-accent"] {
                     background-color: #E4405F !important;
                     color: #ffffff !important;
                   }
                   html.gradient .border-accent,
                   html.gradient [class*="border-accent"] {
                     border-color: #E4405F !important;
                   }
                   html.gradient .ring-accent,
                   html.gradient [class*="ring-accent"] {
                     --tw-ring-color: #E4405F !important;
                   }
                   /* Primary elements should be WHITE, not pink */
                   html.gradient .text-primary,
                   html.gradient [class*="text-primary"] {
                     color: #ffffff !important;
                   }
                   html.gradient .bg-primary,
                   html.gradient [class*="bg-primary"] {
                     background-color: #ffffff !important;
                     color: #000000 !important;
                   }
                   html.gradient .border-primary,
                   html.gradient [class*="border-primary"] {
                     border-color: #ffffff !important;
                   }
                   html.gradient .ring-primary,
                   html.gradient [class*="ring-primary"] {
                     --tw-ring-color: #ffffff !important;
                   }
                   /* ALL text elements should be WHITE in both themes */
                   :root:not(.gradient) h1,
                   :root:not(.gradient) h2,
                   :root:not(.gradient) h3,
                   :root:not(.gradient) h4,
                   :root:not(.gradient) h5,
                   :root:not(.gradient) h6,
                   :root:not(.gradient) p,
                   :root:not(.gradient) span,
                   :root:not(.gradient) div {
                     color: #ffffff !important;
                   }
                   html.gradient h1,
                   html.gradient h2,
                   html.gradient h3,
                   html.gradient h4,
                   html.gradient h5,
                   html.gradient h6,
                   html.gradient p,
                   html.gradient span,
                   html.gradient div {
                     color: #ffffff !important;
                   }
                   html.gradient .text-sm,
                   html.gradient .text-xs {
                     color: #ffffff !important;
                   }
          `
        }} />
      </head>
      <body>
        <ErrorBoundary>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
