/**
 * Sanitization utilities to prevent XSS attacks
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  
  return String(text).replace(/[&<>"'/]/g, (char) => map[char] || char)
}

/**
 * Sanitize user input for safe display
 */
export function sanitizeUserInput(input: string | null | undefined): string {
  if (!input) return ''
  
  // Escape HTML
  let sanitized = escapeHtml(input)
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')
  
  // Limit length to prevent DOS
  const MAX_LENGTH = 1000
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH) + '...'
  }
  
  return sanitized.trim()
}

/**
 * Sanitize transaction hash (hex string validation)
 */
export function sanitizeTransactionHash(txHash: string | null | undefined): string {
  if (!txHash) return ''
  
  // Allow only valid transaction hash format
  // Ethereum: 0x followed by 64 hex characters
  const match = String(txHash).match(/^(0x[a-fA-F0-9]{64}|contract_\d+)$/)
  
  return match ? match[0] : ''
}

/**
 * Sanitize wallet address (hex string validation)
 */
export function sanitizeWalletAddress(address: string | null | undefined): string {
  if (!address) return ''
  
  // Allow only valid Ethereum address format
  // 0x followed by 40 hex characters
  const match = String(address).match(/^0x[a-fA-F0-9]{40}$/)
  
  return match ? match[0] : ''
}

/**
 * Sanitize number input
 */
export function sanitizeNumber(value: any): number {
  const num = Number(value)
  return isNaN(num) || !isFinite(num) ? 0 : num
}

/**
 * Sanitize price (must be positive number)
 */
export function sanitizePrice(price: any): number {
  const num = sanitizeNumber(price)
  return num < 0 ? 0 : num
}

/**
 * Sanitize quantity (must be positive integer)
 */
export function sanitizeQuantity(quantity: any): number {
  const num = Math.floor(sanitizeNumber(quantity))
  return num < 0 ? 0 : num
}

/**
 * Sanitize email
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return ''
  
  const sanitized = String(email).trim().toLowerCase()
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  return emailRegex.test(sanitized) ? sanitized : ''
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return ''
  
  try {
    const parsed = new URL(url)
    // Only allow http and https
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
  } catch {
    return ''
  }
  
  return ''
}

/**
 * Safe JSON stringify (prevents circular references)
 */
export function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      // Sanitize string values
      if (typeof value === 'string') {
        return sanitizeUserInput(value)
      }
      // Sanitize numbers
      if (typeof value === 'number') {
        return sanitizeNumber(value)
      }
      return value
    })
  } catch {
    return '{}'
  }
}
