/**
 * Centralized contract addresses for the UniTick platform
 * Updated automatically by deployment scripts
 */

// Base Sepolia Testnet Contract Addresses
export const CONTRACT_ADDRESSES = {
  // Main payment and NFT contract
  UNILABOOK: "0xf3b0fc3021a28e75deEe5c1bbba3A7a714eE9C79",

  // Stablecoin contract
  UNITICK: "0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7",
} as const

// Default addresses (fallback when env vars not set)
export const DEFAULT_CONTRACT_ADDRESSES = {
  UNILABOOK: "0xc4e90Dcd9Da001Dc463570d66d8281821De58D5C",
  UNITICK: "0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7",
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