#!/usr/bin/env node

/**
 * Script to check ERC20 error signatures
 */

const { keccak256, toHex } = require('viem')

console.log('Checking ERC20 error signatures:')
console.log('Target error signature: 0xe450d38c')
console.log('')

const errors = [
  'ERC20: transfer amount exceeds balance',
  'ERC20: insufficient allowance', 
  'ERC20InsufficientBalance',
  'ERC20InsufficientAllowance',
  'ERC20: transfer to the zero address',
  'ERC20: transfer from the zero address',
  'ERC20: approve to the zero address',
  'ERC20: burn amount exceeds balance',
  'ERC20: mint to the zero address'
]

errors.forEach(err => {
  const hash = keccak256(toHex(err)).substring(2, 10)
  const matches = hash === 'e450d38c'
  console.log(`${err}: ${hash} ${matches ? '🎯 MATCH!' : ''}`)
})