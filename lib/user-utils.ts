// Utility functions for privacy-safe display of user information

export function truncateEmail(email: string): string {
  if (!email || email.length <= 10) return email
  
  const [localPart, domain] = email.split('@')
  if (!domain) return email
  
  if (localPart.length <= 3) {
    return `${localPart}@${domain}`
  }
  
  return `${localPart.slice(0, 3)}***@${domain}`
}

export function truncatePhone(phone: string): string {
  if (!phone || phone.length <= 8) return phone
  
  // Keep first 3 and last 3 digits, mask the middle
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length <= 6) return phone
  
  return `${cleaned.slice(0, 3)}***${cleaned.slice(-3)}`
}

export function formatDisplayName(name: string | null | undefined): string {
  if (!name) return 'No name provided'
  return name
}


