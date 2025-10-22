export interface WalletProvider {
  isMetaMask?: boolean
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: WalletProvider
  }
}

// Validation utilities
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0 && num <= 1000000 // Max 1M ETH per transaction
}

// Rate limiting for wallet operations
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(identifier)
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (limit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }
  
  limit.count++
  return true
}

export async function connectWallet(): Promise<string | null> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
  }

  // Rate limiting check
  if (!checkRateLimit("connect_wallet")) {
    throw new Error("Too many connection attempts. Please wait a minute before trying again.")
  }

  try {
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[]

    if (accounts.length > 0) {
      const address = accounts[0]
      if (!isValidEthereumAddress(address)) {
        throw new Error("Invalid wallet address received")
      }
      return address
    }
    return null
  } catch (error) {
    console.error("[v0] Error connecting wallet:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to connect wallet. Please try again.")
  }
}

export async function getWalletAddress(): Promise<string | null> {
  if (typeof window.ethereum === "undefined") {
    return null
  }

  try {
    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[]

    if (accounts.length > 0) {
      const address = accounts[0]
      if (!isValidEthereumAddress(address)) {
        console.error("[v0] Invalid wallet address format:", address)
        return null
      }
      return address
    }
    return null
  } catch (error) {
    console.error("[v0] Error getting wallet address:", error)
    return null
  }
}

export async function sendPayment(toAddress: string, amountInEth: string): Promise<string> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
  }

  // Input validation
  if (!isValidEthereumAddress(toAddress)) {
    throw new Error("Invalid recipient wallet address format")
  }

  if (!isValidAmount(amountInEth)) {
    throw new Error("Invalid payment amount. Amount must be a positive number.")
  }

  // Rate limiting check
  if (!checkRateLimit("send_payment")) {
    throw new Error("Too many payment attempts. Please wait a minute before trying again.")
  }

  try {
    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[]

    if (accounts.length === 0) {
      throw new Error("No wallet connected. Please connect your wallet first.")
    }

    const fromAddress = accounts[0]
    if (!isValidEthereumAddress(fromAddress)) {
      throw new Error("Invalid sender wallet address")
    }

    // Validate sender and recipient are different
    if (fromAddress.toLowerCase() === toAddress.toLowerCase()) {
      throw new Error("Cannot send payment to the same wallet address")
    }

    const amount = Number.parseFloat(amountInEth)
    const amountInWei = (amount * 1e18).toString(16)

    // Get current gas price for better transaction estimation
    const gasPrice = await window.ethereum.request({
      method: "eth_gasPrice",
    }) as string

    const transactionHash = (await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: fromAddress,
          to: toAddress,
          value: `0x${amountInWei}`,
          gasPrice: gasPrice,
        },
      ],
    })) as string

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      throw new Error("Invalid transaction hash received")
    }

    return transactionHash
  } catch (error) {
    console.error("[v0] Error sending payment:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Payment failed. Please check your wallet and try again.")
  }
}

export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Crypto price utilities
export interface CryptoPrice {
  eth: number
  btc: number
  usd: number
  lastUpdated: number
}

const priceCache = new Map<string, { price: CryptoPrice; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

export async function getCryptoPrice(): Promise<CryptoPrice> {
  const cacheKey = "crypto_prices"
  const cached = priceCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price
  }

  try {
    // Using CoinGecko API for real-time prices
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd",
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch crypto prices: ${response.status}`)
    }

    const data = await response.json()
    const price: CryptoPrice = {
      eth: data.ethereum.usd,
      btc: data.bitcoin.usd,
      usd: 1,
      lastUpdated: Date.now(),
    }

    priceCache.set(cacheKey, { price, timestamp: Date.now() })
    return price
  } catch (error) {
    console.error("[v0] Error fetching crypto prices:", error)
    
    // Fallback to cached price if available
    if (cached) {
      return cached.price
    }
    
    // Final fallback to hardcoded price
    return {
      eth: 2000,
      btc: 45000,
      usd: 1,
      lastUpdated: Date.now(),
    }
  }
}

export async function convertUsdToEth(usdAmount: number): Promise<number> {
  const prices = await getCryptoPrice()
  return usdAmount / prices.eth
}

export async function convertEthToUsd(ethAmount: number): Promise<number> {
  const prices = await getCryptoPrice()
  return ethAmount * prices.eth
}
