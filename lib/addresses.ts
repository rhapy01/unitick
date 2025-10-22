/**
 * Centralized contract addresses for the UniTick platform
 * Updated automatically by deployment scripts
 */

// Base Sepolia Testnet Contract Addresses
export const CONTRACT_ADDRESSES = {
  // Main payment and NFT contract
  UNILABOOK: process.env.NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS || "0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08",

  // Stablecoin contract
  UNITICK: process.env.NEXT_PUBLIC_UNITICK_CONTRACT_ADDRESS || "0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7",
} as const

// Default addresses (fallback when env vars not set)
export const DEFAULT_CONTRACT_ADDRESSES = {
  UNILABOOK: "0x7C02cBd8095137B3Ed9BDB694bB32F14F701276f",
  UNITICK: "0x39ce927711825eE0588AA1424f8792E53C55Ea8c",
} as const

// Chain configuration
export const SUPPORTED_CHAINS = {
  BASE_SEPOLIA: {
    id: 84532,
    name: "Base Sepolia",
    rpc: "https://sepolia.base.org",
  },
} as const

// Helper functions
export function getContractAddress(contract: keyof typeof CONTRACT_ADDRESSES): string {
  return CONTRACT_ADDRESSES[contract]
}

export function isContractDeployed(contract: keyof typeof CONTRACT_ADDRESSES): boolean {
  const address = getContractAddress(contract)
  return address !== "" && address.startsWith("0x") && address.length === 42
}

// Direct exports for convenience
export const UNITICK_ADDRESS = CONTRACT_ADDRESSES.UNITICK
export const UNILABOOK_ADDRESS = CONTRACT_ADDRESSES.UNILABOOK

// Helper function for UnilaBook contract address
export function getUnilaBookAddress(): string {
  return CONTRACT_ADDRESSES.UNILABOOK
}