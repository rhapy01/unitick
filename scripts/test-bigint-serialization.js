#!/usr/bin/env node

/**
 * Simple BigInt Serialization Test
 * Tests the BigInt conversion logic without requiring authentication
 */

console.log('🧪 Testing BigInt Serialization Fix...\n')

// Mock transaction receipt with BigInt values (similar to what viem returns)
const mockReceipt = {
  transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
  gasUsed: BigInt('21000'),
  effectiveGasPrice: BigInt('20000000000'), // 20 gwei
  blockNumber: BigInt('12345678'),
  cumulativeGasUsed: BigInt('21000'),
  status: 'success',
  logs: [
    {
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000001234567890abcdef1234567890abcdef12345678'
      ],
      data: '0x00000000000000000000000000000000000000000000000000000000000003e8',
      blockNumber: BigInt('12345678'),
      logIndex: BigInt('0'),
      transactionIndex: BigInt('0'),
      removed: false
    }
  ],
  transactionIndex: BigInt('0'),
  type: 'legacy',
  from: '0x1234567890abcdef1234567890abcdef12345678',
  to: '0xabcdef1234567890abcdef1234567890abcdef12'
}

console.log('1️⃣ Created mock receipt with BigInt values:')
console.log('   gasUsed:', mockReceipt.gasUsed, '(type:', typeof mockReceipt.gasUsed, ')')
console.log('   blockNumber:', mockReceipt.blockNumber, '(type:', typeof mockReceipt.blockNumber, ')')
console.log('   effectiveGasPrice:', mockReceipt.effectiveGasPrice, '(type:', typeof mockReceipt.effectiveGasPrice, ')')

// Test the conversion function (same as in the API)
const convertBigIntToString = (obj) => {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString()
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString)
  }
  
  if (typeof obj === 'object') {
    const converted = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value)
    }
    return converted
  }
  
  return obj
}

console.log('\n2️⃣ Converting BigInt values to strings...')
const convertedReceipt = convertBigIntToString(mockReceipt)

console.log('   gasUsed:', convertedReceipt.gasUsed, '(type:', typeof convertedReceipt.gasUsed, ')')
console.log('   blockNumber:', convertedReceipt.blockNumber, '(type:', typeof convertedReceipt.blockNumber, ')')
console.log('   effectiveGasPrice:', convertedReceipt.effectiveGasPrice, '(type:', typeof convertedReceipt.effectiveGasPrice, ')')

console.log('\n3️⃣ Testing JSON serialization...')
try {
  const jsonString = JSON.stringify(convertedReceipt)
  console.log('✅ JSON.stringify() succeeded!')
  console.log('   JSON length:', jsonString.length, 'characters')
  
  // Test parsing back
  const parsedBack = JSON.parse(jsonString)
  console.log('✅ JSON.parse() succeeded!')
  
  // Verify the conversion worked
  console.log('\n4️⃣ Verifying conversion:')
  console.log('   Parsed gasUsed:', parsedBack.gasUsed, '(type:', typeof parsedBack.gasUsed, ')')
  console.log('   Parsed blockNumber:', parsedBack.blockNumber, '(type:', typeof parsedBack.blockNumber, ')')
  console.log('   Parsed effectiveGasPrice:', parsedBack.effectiveGasPrice, '(type:', typeof parsedBack.effectiveGasPrice, ')')
  
  // Test that we can access nested BigInt values
  if (parsedBack.logs && parsedBack.logs[0]) {
    console.log('   Log blockNumber:', parsedBack.logs[0].blockNumber, '(type:', typeof parsedBack.logs[0].blockNumber, ')')
    console.log('   Log logIndex:', parsedBack.logs[0].logIndex, '(type:', typeof parsedBack.logs[0].logIndex, ')')
  }
  
  console.log('\n🎉 SUCCESS: BigInt serialization fix is working correctly!')
  console.log('   - All BigInt values converted to strings ✅')
  console.log('   - JSON serialization works ✅')
  console.log('   - JSON parsing works ✅')
  console.log('   - Nested objects handled correctly ✅')
  
} catch (error) {
  console.error('❌ JSON serialization failed:', error.message)
  console.error('   This means the BigInt conversion is not working properly')
}

console.log('\n5️⃣ Testing error case (original BigInt serialization)...')
try {
  const jsonString = JSON.stringify(mockReceipt) // This should fail
  console.log('❌ Unexpected: JSON.stringify() succeeded with BigInt values')
} catch (error) {
  console.log('✅ Expected error occurred:', error.message)
  console.log('   This confirms that BigInt values cannot be serialized directly')
}

console.log('\n🏁 Test completed!')
console.log('The BigInt serialization fix in the faucet API should now work properly.')
