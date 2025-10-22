import { ethers } from 'ethers'
import { createClient } from '@/lib/supabase/server'

/**
 * Fund Loss Prevention System
 * Monitors wallet balances and provides alerts for potential fund loss
 */

export interface FundMonitoringResult {
  walletAddress: string
  balance: string
  balanceEth: number
  lastChecked: Date
  alerts: FundAlert[]
  recommendations: string[]
}

export interface FundAlert {
  type: 'low_balance' | 'suspicious_activity' | 'backup_needed' | 'security_warning'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
}

/**
 * Monitors wallet balance and generates alerts
 */
export async function monitorWalletFunds(
  walletAddress: string,
  providerUrl?: string
): Promise<FundMonitoringResult> {
  try {
    // Use provided provider or default to Base Sepolia
    const provider = new ethers.JsonRpcProvider(
      providerUrl || process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'
    )
    
    // Get current balance
    const balance = await provider.getBalance(walletAddress)
    const balanceEth = parseFloat(ethers.formatEther(balance))
    
    const alerts: FundAlert[] = []
    const recommendations: string[] = []
    
    // Check for low balance
    if (balanceEth < 0.001) {
      alerts.push({
        type: 'low_balance',
        severity: 'medium',
        message: `Low balance detected: ${balanceEth.toFixed(6)} ETH`,
        timestamp: new Date()
      })
      recommendations.push('Consider adding funds to your wallet for transaction fees')
    }
    
    // Check for very low balance (critical)
    if (balanceEth < 0.0001) {
      alerts.push({
        type: 'low_balance',
        severity: 'critical',
        message: `Critical low balance: ${balanceEth.toFixed(6)} ETH - Unable to pay gas fees`,
        timestamp: new Date()
      })
      recommendations.push('URGENT: Add funds immediately to prevent transaction failures')
    }
    
    // Check for backup needs
    if (balanceEth > 0.01) {
      alerts.push({
        type: 'backup_needed',
        severity: 'medium',
        message: 'Wallet contains significant funds - ensure backup is available',
        timestamp: new Date()
      })
      recommendations.push('Export your wallet to external application for backup')
    }
    
    return {
      walletAddress,
      balance: balance.toString(),
      balanceEth,
      lastChecked: new Date(),
      alerts,
      recommendations
    }
    
  } catch (error) {
    console.error('[Fund Monitoring] Error monitoring wallet:', error)
    throw new Error('Failed to monitor wallet funds')
  }
}

/**
 * Checks wallet security and provides recommendations
 */
export async function checkWalletSecurity(walletAddress: string): Promise<{
  securityScore: number
  vulnerabilities: string[]
  recommendations: string[]
}> {
  const vulnerabilities: string[] = []
  const recommendations: string[] = []
  let securityScore = 100
  
  try {
    const supabase = await createClient()
    
    // Check if wallet exists in the new secure system
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address, wallet_encrypted_private_key, wallet_encryption_salt, wallet_connected_at')
      .eq('wallet_address', walletAddress)
      .single()
    
    if (profile) {
      // New secure wallet system
      if (profile.wallet_encrypted_private_key) {
        recommendations.push('✅ Using secure encrypted wallet system')
        recommendations.push('✅ Private keys encrypted with AES-256-GCM')
        recommendations.push('✅ Keys protected with PBKDF2 derivation')
      } else {
        vulnerabilities.push('Wallet not properly encrypted')
        recommendations.push('Contact support to secure your wallet')
        securityScore -= 30
      }
      
      // Check if encryption salt is present
      if (profile.wallet_encryption_salt) {
        recommendations.push('✅ Wallet uses cryptographic salt for encryption')
      } else {
        vulnerabilities.push('No encryption salt found')
        recommendations.push('Wallet may not be properly secured')
        securityScore -= 20
      }
      
      // Check wallet age
      if (profile.wallet_connected_at) {
        const walletAge = Date.now() - new Date(profile.wallet_connected_at).getTime()
        const daysOld = walletAge / (1000 * 60 * 60 * 24)
        
        if (daysOld > 30) {
          recommendations.push('✅ Wallet has been stable for over 30 days')
        } else if (daysOld > 7) {
          recommendations.push('✅ Wallet has been stable for over a week')
        } else {
          recommendations.push('⚠️ New wallet - ensure proper backup')
        }
      }
    } else {
      vulnerabilities.push('Wallet not found in system')
      recommendations.push('Register wallet with the platform for monitoring')
      securityScore -= 50
    }
    
    return {
      securityScore: Math.max(0, securityScore),
      vulnerabilities,
      recommendations
    }
    
  } catch (error) {
    console.error('[Security Check] Error checking wallet security:', error)
    return {
      securityScore: 0,
      vulnerabilities: ['Unable to check security'],
      recommendations: ['Contact support for security assessment']
    }
  }
}

/**
 * Provides fund loss prevention recommendations
 */
export function getFundLossPreventionRecommendations(balanceEth: number): string[] {
  const recommendations: string[] = []
  
  if (balanceEth > 0) {
    recommendations.push('🔒 Keep your account password secure and unique')
    recommendations.push('📱 Enable two-factor authentication when available')
    recommendations.push('💾 Export your wallet to external application for backup')
    recommendations.push('🔍 Monitor your wallet activity regularly')
    recommendations.push('⚠️ Never share your private keys or seed phrases')
  }
  
  if (balanceEth > 0.1) {
    recommendations.push('🏦 Consider using a hardware wallet for large amounts')
    recommendations.push('📊 Set up balance alerts for unusual activity')
    recommendations.push('🔄 Regularly backup your wallet data')
  }
  
  if (balanceEth > 1.0) {
    recommendations.push('🚨 HIGH VALUE: Use multiple security layers')
    recommendations.push('🔐 Consider multi-signature wallet for maximum security')
    recommendations.push('📋 Document your recovery procedures')
  }
  
  return recommendations
}

/**
 * Logs wallet operation for audit trail
 */
export async function logWalletOperation(
  userId: string,
  operation: string,
  walletAddress?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.rpc('log_wallet_operation', {
      p_user_id: userId,
      p_operation: operation,
      p_wallet_address: walletAddress,
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    })
    
    if (error) {
      console.error('[Audit Log] Error logging wallet operation:', error)
    }
  } catch (error) {
    console.error('[Audit Log] Error logging wallet operation:', error)
  }
}

/**
 * Gets comprehensive wallet health report
 */
export async function getWalletHealthReport(walletAddress: string): Promise<{
  fundMonitoring: FundMonitoringResult
  securityCheck: {
    securityScore: number
    vulnerabilities: string[]
    recommendations: string[]
  }
  fundLossPrevention: string[]
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
}> {
  try {
    // Get fund monitoring data
    const fundMonitoring = await monitorWalletFunds(walletAddress)
    
    // Get security check data
    const securityCheck = await checkWalletSecurity(walletAddress)
    
    // Get fund loss prevention recommendations
    const fundLossPrevention = getFundLossPreventionRecommendations(fundMonitoring.balanceEth)
    
    // Calculate overall health
    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' = 'excellent'
    
    if (securityCheck.securityScore < 50 || fundMonitoring.alerts.some(a => a.severity === 'critical')) {
      overallHealth = 'critical'
    } else if (securityCheck.securityScore < 70 || fundMonitoring.alerts.some(a => a.severity === 'high')) {
      overallHealth = 'poor'
    } else if (securityCheck.securityScore < 85 || fundMonitoring.alerts.some(a => a.severity === 'medium')) {
      overallHealth = 'fair'
    } else if (securityCheck.securityScore < 95 || fundMonitoring.alerts.some(a => a.severity === 'low')) {
      overallHealth = 'good'
    }
    
    return {
      fundMonitoring,
      securityCheck,
      fundLossPrevention,
      overallHealth
    }
    
  } catch (error) {
    console.error('[Wallet Health] Error generating health report:', error)
    throw new Error('Failed to generate wallet health report')
  }
}
