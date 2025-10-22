import { baseSepolia } from "wagmi/chains"

// Supported chains for the platform - only Base Sepolia
export const supportedChains = [baseSepolia]

// Note: wagmi config is handled in components/providers-dynamic.tsx
// This file only exports the supported chains for UI components
