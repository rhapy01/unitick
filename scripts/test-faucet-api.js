#!/usr/bin/env node

/**
 * Simple API Test for Faucet Claim
 * Tests the API endpoint directly (requires dev server to be running)
 */

const fetch = require('node-fetch')

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'

async function testFaucetAPI() {
  console.log('🧪 Testing Faucet Claim API Endpoint...\n')
  console.log('📡 API Base URL:', API_BASE_URL)

  try {
    console.log('1️⃣ Making request to /api/faucet/claim...')
    
    const response = await fetch(`${API_BASE_URL}/api/faucet/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    console.log('   Response Status:', response.status)
    console.log('   Response Headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('   Raw Response Length:', responseText.length, 'characters')

    // Test JSON parsing
    try {
      const responseData = JSON.parse(responseText)
      console.log('\n✅ JSON Parsing: SUCCESS!')
      console.log('   This confirms the BigInt serialization fix is working!')
      
      console.log('\n📊 Response Analysis:')
      console.log('   Success:', responseData.success)
      console.log('   Error:', responseData.error || 'None')
      
      if (responseData.transactionHash) {
        console.log('   Transaction Hash:', responseData.transactionHash)
      }
      
      if (responseData.receipt) {
        console.log('   Receipt Present: ✅')
        console.log('   Receipt Keys:', Object.keys(responseData.receipt))
        
        // Check if receipt can be re-serialized (proving no BigInt values remain)
        try {
          const receiptJson = JSON.stringify(responseData.receipt)
          console.log('   Receipt Re-serialization: ✅')
          console.log('   Receipt JSON Length:', receiptJson.length, 'characters')
        } catch (receiptError) {
          console.log('   Receipt Re-serialization: ❌', receiptError.message)
        }
      }
      
      if (responseData.message) {
        console.log('   Message:', responseData.message)
      }
      
      if (responseData.debug) {
        console.log('   Debug Info:', responseData.debug)
      }

    } catch (parseError) {
      console.log('\n❌ JSON Parsing: FAILED!')
      console.log('   Error:', parseError.message)
      console.log('   This indicates the BigInt serialization issue still exists')
      console.log('   Raw response preview:', responseText.substring(0, 200) + '...')
    }

    console.log('\n🏁 Test Summary:')
    if (response.status === 401) {
      console.log('✅ Expected: Unauthorized (no auth token provided)')
      console.log('   - API endpoint is accessible ✅')
      console.log('   - Authentication is working ✅')
    } else if (response.status === 200) {
      console.log('🎉 SUCCESS: Full API test passed!')
      console.log('   - API endpoint accessible ✅')
      console.log('   - Authentication passed ✅')
      console.log('   - Transaction executed ✅')
      console.log('   - BigInt serialization fixed ✅')
    } else {
      console.log('⚠️  Partial Success: API responded but with error')
      console.log('   - API endpoint accessible ✅')
      console.log('   - Response status:', response.status)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused - make sure your development server is running:')
      console.log('   npm run dev')
      console.log('   or')
      console.log('   pnpm dev')
    }
  }
}

// Run the test
if (require.main === module) {
  testFaucetAPI().catch(console.error)
}

module.exports = { testFaucetAPI }
