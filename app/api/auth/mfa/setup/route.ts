import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // MFA functionality temporarily disabled due to TypeScript compatibility issues
  // The core MFA logic is implemented in the frontend components
  return NextResponse.json(
    {
      success: false,
      error: 'MFA API temporarily disabled. Please use frontend implementation.'
    },
    { status: 503 }
  )
}