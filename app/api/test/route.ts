import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log('[Test API] GET request received')
  
  try {
    return NextResponse.json({
      success: true,
      message: 'Test API is working',
      timestamp: new Date().toISOString(),
      method: 'GET'
    })
  } catch (error) {
    console.error('[Test API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Test API failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('[Test API] POST request received')
  
  try {
    const body = await request.json()
    console.log('[Test API] Request body:', body)
    
    return NextResponse.json({
      success: true,
      message: 'Test API POST is working',
      receivedData: body,
      timestamp: new Date().toISOString(),
      method: 'POST'
    })
  } catch (error) {
    console.error('[Test API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Test API POST failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
