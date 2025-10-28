import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://unitick.app'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vendors`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    // Documentation pages
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/docs/what-is-unitick`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs/quick-start`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/docs/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  try {
    const supabase = await createClient()
    
    // Get dynamic pages - vendors
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, updated_at')
      .eq('is_verified', true)
      .limit(1000)

    const vendorPages = vendors?.map((vendor) => ({
      url: `${baseUrl}/vendor/${vendor.id}`,
      lastModified: new Date(vendor.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })) || []

    // Get dynamic pages - listings
    const { data: listings } = await supabase
      .from('listings')
      .select('id, updated_at')
      .eq('is_active', true)
      .limit(1000)

    const listingPages = listings?.map((listing) => ({
      url: `${baseUrl}/listing/${listing.id}`,
      lastModified: new Date(listing.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) || []

    // Get service type pages
    const serviceTypes = ['accommodation', 'car-hire', 'tours', 'cinema', 'events']
    const servicePages = serviceTypes.map((type) => ({
      url: `${baseUrl}/browse/${type}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    return [
      ...staticPages,
      ...vendorPages,
      ...listingPages,
      ...servicePages,
    ]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}
