import { z } from "zod"

// Base validation schemas
export const emailSchema = z.string().email("Invalid email format")
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")

export const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format")
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")

// User validation schemas
export const userRoleSchema = z.enum(["user", "vendor", "admin"])
export const serviceTypeSchema = z.enum(["accommodation", "car_hire", "tour", "cinema", "event"])
export const bookingStatusSchema = z.enum(["pending", "confirmed", "cancelled", "completed"])

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: emailSchema,
  full_name: z.string().min(2, "Full name must be at least 2 characters").nullable(),
  role: userRoleSchema,
  wallet_address: walletAddressSchema.nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const vendorSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().nullable(),
  contact_email: emailSchema,
  contact_phone: phoneSchema.nullable(),
  wallet_address: walletAddressSchema,
  is_verified: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const listingSchema = z.object({
  id: z.string().uuid(),
  vendor_id: z.string().uuid(),
  service_type: serviceTypeSchema,
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
  city: z.string().optional(),
  state_province: z.string().optional(),
  country_code: z.string().length(2).optional(),
  postal_code: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius_km: z.number().int().min(1).max(1000).optional(),
  price: z.number().min(0, "Price cannot be negative"),
  currency: z.string().default("USD"),
  available_from: z.string().datetime().nullable(),
  available_to: z.string().datetime().nullable(),
  capacity: z.number().int().positive().nullable(),
  total_tickets: z.number().int().positive().nullable(),
  images: z.array(z.string().url()).default([]),
  amenities: z.array(z.string()).default([]),
  available_dates: z.array(z.string().date()).nullable(),
  available_times: z.array(z.string()).nullable(),
  cancellation_days: z.number().int().min(0).max(30).nullable(),
  category_specific_data: z.record(z.any()).default({}), // JSONB field for category-specific data
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const bookingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  listing_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
  booking_date: z.string().datetime(),
  quantity: z.number().int().positive("Quantity must be positive"),
  subtotal: z.number().positive("Subtotal must be positive"),
  platform_fee: z.number().min(0, "Platform fee cannot be negative"),
  total_amount: z.number().positive("Total amount must be positive"),
  status: bookingStatusSchema,
  recipient_name: z.string().nullable(),
  recipient_email: emailSchema.nullable(),
  recipient_phone: phoneSchema.nullable(),
  is_gift: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const orderSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  total_amount: z.number().positive("Total amount must be positive"),
  platform_fee_total: z.number().min(0, "Platform fee cannot be negative"),
  transaction_hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).nullable(),
  wallet_address: walletAddressSchema,
  qr_code: z.string().nullable(),
  status: bookingStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const cartItemSchema = z.object({
  _id: z.string().optional(), // Database ID for cart operations
  listing: listingSchema,
  quantity: z.number().int().positive("Quantity must be positive").default(1),
  booking_date: z.string().date().optional(),
  is_gift: z.boolean().default(false).optional(),
  recipient_name: z.string().optional(),
  recipient_email: emailSchema.optional(),
  recipient_phone: phoneSchema.optional(),
  recipient_wallet: z.string().optional(),
})

// Form validation schemas
export const signupFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["user", "vendor"], {
    errorMap: () => ({ message: "Role must be either 'user' or 'vendor'" })
  })
})

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required")
})

export const walletUpdateFormSchema = z.object({
  walletAddress: walletAddressSchema
})

export const listingFormSchema = z.object({
  service_type: serviceTypeSchema,
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
  city: z.string().optional(),
  state_province: z.string().optional(),
  country_code: z.string().length(2).optional(),
  postal_code: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius_km: z.number().int().min(1).max(1000).optional(),
  price: z.number().min(0, "Price cannot be negative"),
  currency: z.string().default("USD"),
  available_from: z.string().datetime().optional(),
  available_to: z.string().datetime().optional(),
  capacity: z.number().int().positive().optional(),
  images: z.array(z.string().url()).default([]),
  amenities: z.array(z.string()).default([]),
  available_dates: z.array(z.string().date()).optional(),
  available_times: z.array(z.string()).optional(),
  cancellation_days: z.number().int().min(0).max(30).optional(),
})

export const vendorSetupFormSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  contact_email: emailSchema,
  contact_phone: phoneSchema.optional(),
  wallet_address: walletAddressSchema,
})

// API response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
})

// Search and filter schemas
export const searchQuerySchema = z.object({
  query: z.string().min(1, "Search query is required"),
  service_type: serviceTypeSchema.optional(),
  location: z.string().optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// Validation helper functions
export function validateAndParse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message)
    }
    throw error
  }
}

export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      return { success: false, error: result.error.errors[0].message }
    }
  } catch (error) {
    return { success: false, error: "Validation failed" }
  }
}

// Type exports for use in components
export type Profile = z.infer<typeof profileSchema>
export type Vendor = z.infer<typeof vendorSchema>
export type Listing = z.infer<typeof listingSchema>
export type Booking = z.infer<typeof bookingSchema>
export type Order = z.infer<typeof orderSchema>
export type CartItem = z.infer<typeof cartItemSchema>
export type UserRole = z.infer<typeof userRoleSchema>
export type ServiceType = z.infer<typeof serviceTypeSchema>
export type BookingStatus = z.infer<typeof bookingStatusSchema>

export type SignupForm = z.infer<typeof signupFormSchema>
export type LoginForm = z.infer<typeof loginFormSchema>
export type WalletUpdateForm = z.infer<typeof walletUpdateFormSchema>
export type ListingForm = z.infer<typeof listingFormSchema>
export type VendorSetupForm = z.infer<typeof vendorSetupFormSchema>
export type SearchQuery = z.infer<typeof searchQuerySchema>
export type ApiResponse<T = any> = z.infer<typeof apiResponseSchema> & { data?: T }
export type Pagination = z.infer<typeof paginationSchema>
