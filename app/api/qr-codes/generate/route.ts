import { NextRequest, NextResponse } from 'next/server'
import { QRCodeService } from '@/lib/qr-service'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { equipment_id } = await request.json()

    if (!equipment_id) {
      return NextResponse.json(
        { error: 'Equipment ID is required' },
        { status: 400 }
      )
    }

    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select(`
        *,
        categories (name)
      `)
      .eq('id', equipment_id)
      .single()

    if (equipmentError || !equipment) {
      return NextResponse.json(
        { error: 'Equipment not found' },
        { status: 404 }
      )
    }

    const qrCode = await QRCodeService.generateEquipmentQR({
      equipment_id: (equipment as any).id,
      name: (equipment as any).name,
      serial_number: (equipment as any).serial_number,
      category: (equipment as any).categories?.name,
      location: (equipment as any).location
    })

    return NextResponse.json({
      success: true,
      qr_code: qrCode,
      equipment: {
        id: (equipment as any).id,
        name: (equipment as any).name,
        serial_number: (equipment as any).serial_number
      }
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}