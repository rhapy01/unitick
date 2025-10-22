// Platform fee is 0.5%
export const PLATFORM_FEE_PERCENTAGE = 0.005

export const SERVICE_TYPES = {
  accommodation: "Accommodation",
  car_hire: "Car Hire",
  tour: "Tours",
  cinema: "Cinema",
  event: "Events",
} as const

import { DEFAULT_CONTRACT_ADDRESSES, SUPPORTED_CHAINS } from "./addresses"

// Default chain and contract configuration (fallbacks)
export const DEFAULT_CHAIN = "baseSepolia"
export const DEFAULT_BASE_SEPOLIA_RPC = SUPPORTED_CHAINS.BASE_SEPOLIA.rpc
export const DEFAULT_TICKET_CONTRACT_ADDRESS = DEFAULT_CONTRACT_ADDRESSES.UNILABOOK
export const DEFAULT_UNITICK_CONTRACT_ADDRESS = DEFAULT_CONTRACT_ADDRESSES.UNITICK
