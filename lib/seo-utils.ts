import type { Metadata } from 'next'

interface Listing {
  id: string
  title: string
  description: string
  price: number
  location: string
  service_type: string
  images?: string[]
  vendor?: {
    company_name: string
    physical_address: string
  }
}

interface Vendor {
  id: string
  company_name: string
  description: string
  physical_address: string
  logo_url?: string
}

export function generateListingMetadata(listing: Listing): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://unitick.app'
  const serviceTypeLabels = {
    accommodation: 'Accommodation',
    'car-hire': 'Car Hire',
    tours: 'Tours',
    cinema: 'Cinema',
    events: 'Events'
  }

  const serviceLabel = serviceTypeLabels[listing.service_type as keyof typeof serviceTypeLabels] || 'Service'
  const title = `${listing.title} - ${serviceLabel} | UniTick`
  const description = `${listing.description.substring(0, 150)}... Book ${serviceLabel.toLowerCase()} in ${listing.location} with crypto payments.`

  return {
    title,
    description,
    keywords: [
      listing.title,
      serviceLabel.toLowerCase(),
      listing.location,
      'crypto booking',
      'NFT tickets',
      'blockchain payments',
      'UniTick',
      listing.vendor?.company_name || ''
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/listing/${listing.id}`,
      images: listing.images?.length ? [
        {
          url: listing.images[0],
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ] : [
        {
          url: '/og-listing.jpg',
          width: 1200,
          height: 630,
          alt: `${serviceLabel} - ${listing.title}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: listing.images?.length ? [listing.images[0]] : ['/og-listing.jpg'],
    },
    alternates: {
      canonical: `/listing/${listing.id}`,
    },
  }
}

export function generateVendorMetadata(vendor: Vendor): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://unitick.app'
  const title = `${vendor.company_name} - Verified Service Provider | UniTick`
  const description = `${vendor.description.substring(0, 150)}... Book with ${vendor.company_name} in ${vendor.physical_address} using crypto payments.`

  return {
    title,
    description,
    keywords: [
      vendor.company_name,
      'verified vendor',
      'service provider',
      vendor.physical_address,
      'crypto booking',
      'NFT tickets',
      'blockchain payments',
      'UniTick'
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/vendor/${vendor.id}`,
      images: vendor.logo_url ? [
        {
          url: vendor.logo_url,
          width: 1200,
          height: 630,
          alt: vendor.company_name,
        },
      ] : [
        {
          url: '/og-vendor.jpg',
          width: 1200,
          height: 630,
          alt: `${vendor.company_name} - Verified Service Provider`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: vendor.logo_url ? [vendor.logo_url] : ['/og-vendor.jpg'],
    },
    alternates: {
      canonical: `/vendor/${vendor.id}`,
    },
  }
}

export function generateServiceTypeMetadata(serviceType: string): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://unitick.app'
  const serviceTypeLabels = {
    accommodation: 'Accommodation Booking',
    'car-hire': 'Car Hire Services',
    tours: 'Tour Booking',
    cinema: 'Cinema Tickets',
    events: 'Event Tickets'
  }

  const serviceLabel = serviceTypeLabels[serviceType as keyof typeof serviceTypeLabels] || 'Services'
  const title = `${serviceLabel} - Book with Crypto | UniTick`
  const description = `Browse and book ${serviceLabel.toLowerCase()} with cryptocurrency payments. NFT tickets, secure blockchain transactions, and verified service providers.`

  return {
    title,
    description,
    keywords: [
      serviceLabel.toLowerCase(),
      'crypto booking',
      'NFT tickets',
      'blockchain payments',
      'verified providers',
      'UniTick',
      'cryptocurrency payments'
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/browse/${serviceType}`,
      images: [
        {
          url: `/og-${serviceType}.jpg`,
          width: 1200,
          height: 630,
          alt: `${serviceLabel} - UniTick`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/og-${serviceType}.jpg`],
    },
    alternates: {
      canonical: `/browse/${serviceType}`,
    },
  }
}
