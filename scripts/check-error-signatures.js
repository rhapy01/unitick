#!/usr/bin/env node

/**
 * Script to check error signatures from the createOrder function
 */

const crypto = require('crypto')

console.log('Checking error signatures from createOrder function:')
console.log('Target error signature: 0xe450d38c')
console.log('')

const errors = [
  'UniTick transfer failed',
  'Vendor token transfer failed', 
  'Platform fee token transfer failed',
  'Amount overflow',
  'Fee calculation overflow',
  'Invalid vendor address',
  'Amount must be greater than 0',
  'No vendor payments',
  'Too many vendors',
  'Mismatched service names',
  'Mismatched booking dates',
  'Vendor not whitelisted'
]

errors.forEach(err => {
  const hash = crypto.createHash('sha3-256').update(err).digest('hex').substring(0, 8)
  const matches = hash === 'e450d38c'
  console.log(`${err}: ${hash} ${matches ? '🎯 MATCH!' : ''}`)
})

console.log('')
console.log('Note: Ethereum uses keccak256, not sha3-256. Let me check with keccak256...')

// Try with keccak256 (which is what Ethereum actually uses)
const { keccak256, toHex } = require('viem')

errors.forEach(err => {
  const hash = keccak256(toHex(err)).substring(2, 10) // Remove 0x and take first 8 chars
  const matches = hash === 'e450d38c'
  console.log(`${err}: ${hash} ${matches ? '🎯 MATCH!' : ''}`)
})
