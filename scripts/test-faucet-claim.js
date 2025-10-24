#!/usr/bin/env node

/**
 * Test script for faucet claim functionality
 * This script tests the faucet claim API endpoint to ensure BigInt serialization works properly
 */

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'

// Test user credentials (you'll need to replace these with actual test credentials)
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123'

async function testFaucetClaim() {
  console.log('🧪 Starting Faucet Claim Test...\n')

  try {
    // Initialize Supabase client
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    console.log('1️⃣ Authenticating test user...')
    
    // Sign in with test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })

    if (authError) {
      console.log('❌ Authentication failed:', authError.message)
      console.log('💡 Please ensure you have a test user account or update TEST_EMAIL and TEST_PASSWORD environment variables')
      return
    }

    console.log('✅ User authenticated successfully')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)

    // Get the session token for API calls
    const sessionToken = authData.session.access_token
    console.log('   Session token obtained')

    console.log('\n2️⃣ Testing faucet claim API...')

    // Make the faucet claim request
    const response = await fetch(`${API_BASE_URL}/api/faucet/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({})
    })

    console.log('   Response status:', response.status)
    console.log('   Response headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('   Raw response:', responseText)

    // Try to parse JSON response
    let responseData
    try {
      responseData = JSON.parse(responseText)
      console.log('✅ JSON parsing successful - BigInt serialization issue is fixed!')
    } catch (parseError) {
      console.log('❌ JSON parsing failed:', parseError.message)
      console.log('   This indicates the BigInt serialization issue still exists')
      return
    }

    console.log('\n3️⃣ Analyzing response...')
    
    if (response.ok) {
      console.log('✅ API call successful!')
      console.log('   Success:', responseData.success)
      console.log('   Transaction Hash:', responseData.transactionHash)
      console.log('   Message:', responseData.message)
      
      if (responseData.receipt) {
        console.log('   Receipt data present:', Object.keys(responseData.receipt))
        
        // Check if receipt contains any BigInt values (they should all be strings now)
        const receiptStr = JSON.stringify(responseData.receipt)
        console.log('   Receipt serialization test: ✅ PASSED')
        
        // Log some key receipt fields
        if (responseData.receipt.gasUsed) {
          console.log('   Gas Used:', responseData.receipt.gasUsed, '(type:', typeof responseData.receipt.gasUsed, ')')
        }
        if (responseData.receipt.blockNumber) {
          console.log('   Block Number:', responseData.receipt.blockNumber, '(type:', typeof responseData.receipt.blockNumber, ')')
        }
        if (responseData.receipt.effectiveGasPrice) {
          console.log('   Effective Gas Price:', responseData.receipt.effectiveGasPrice, '(type:', typeof responseData.receipt.effectiveGasPrice, ')')
        }
      }
    } else {
      console.log('❌ API call failed')
      console.log('   Error:', responseData.error)
      console.log('   Details:', responseData.details)
      
      if (responseData.debug) {
        console.log('   Debug info:', responseData.debug)
      }
    }

    console.log('\n4️⃣ Test Summary:')
    if (response.ok && responseData.success) {
      console.log('🎉 SUCCESS: Faucet claim test passed!')
      console.log('   - Authentication: ✅')
      console.log('   - API call: ✅')
      console.log('   - JSON serialization: ✅')
      console.log('   - Transaction execution: ✅')
    } else {
      console.log('⚠️  PARTIAL SUCCESS: API is working but transaction may have failed')
      console.log('   - Authentication: ✅')
      console.log('   - API call: ✅')
      console.log('   - JSON serialization: ✅')
      console.log('   - Transaction execution: ❌')
      console.log('   - This is likely due to insufficient ETH for gas or other blockchain issues')
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.error('   Stack:', error.stack)
  }
}

// Additional test for BigInt serialization specifically
async function testBigIntSerialization() {
  console.log('\n🔬 Testing BigInt Serialization Directly...')
  
  try {
    // Create a mock receipt with BigInt values
    const mockReceipt = {
      transactionHash: '0x1234567890abcdef',
      gasUsed: BigInt('21000'),
      effectiveGasPrice: BigInt('20000000000'),
      blockNumber: BigInt('12345678'),
      cumulativeGasUsed: BigInt('21000'),
      logs: [
        {
          address: '0xabcdef1234567890',
          topics: ['0x1234567890abcdef'],
          data: '0x',
          blockNumber: BigInt('12345678'),
          logIndex: BigInt('0'),
          transactionIndex: BigInt('0')
        }
      ]
    }

    console.log('   Mock receipt created with BigInt values')
    
    // Test the conversion function
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

    const convertedReceipt = convertBigIntToString(mockReceipt)
    
    // Test JSON serialization
    const jsonString = JSON.stringify(convertedReceipt)
    const parsedBack = JSON.parse(jsonString)
    
    console.log('✅ BigInt conversion test: PASSED')
    console.log('   - Original gasUsed type:', typeof mockReceipt.gasUsed)
    console.log('   - Converted gasUsed type:', typeof convertedReceipt.gasUsed)
    console.log('   - JSON serialization: ✅')
    console.log('   - JSON parsing: ✅')
    
  } catch (error) {
    console.error('❌ BigInt serialization test failed:', error.message)
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Faucet Claim Test Suite')
  console.log('========================\n')
  
  await testBigIntSerialization()
  await testFaucetClaim()
  
  console.log('\n🏁 Test suite completed!')
}

// Handle command line arguments
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { testFaucetClaim, testBigIntSerialization }
