import { NextRequest, NextResponse } from 'next/server'
import { QRCodeService } from '@/lib/qr-service'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { qr_data } = await request.json()

    if (!qr_data) {
      return NextResponse.json(
        { error: 'QR data is required' },
        { status: 400 }
      )
    }

    // Parse and validate QR data
    let parsedData
    try {
      parsedData = QRCodeService.parseQRData(qr_data)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid QR code format' },
        { status: 400 }
      )
    }

    // Validate QR data structure
    if (!QRCodeService.validateQRData(parsedData)) {
      return NextResponse.json(
        { error: 'Invalid QR code data' },
        { status: 400 }
      )
    }

    // Get equipment details
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select(`
        *,
        categories (name),
        equipment_qr_codes!inner(qr_code_data, is_active)
      `)
      .eq('id', parsedData.id)
      .eq('equipment_qr_codes.is_active', true)
      .single()

    if (equipmentError || !equipment) {
      return NextResponse.json(
        { error: 'Equipment not found or QR code inactive' },
        { status: 404 }
      )
    }

    // Get current status
    const { data: statusData } = await supabase
      .from('equipment_comprehensive_status')
      .select('current_status, return_due_date, calibration_status')
      .eq('id', parsedData.id)
      .single()

    // Get recent maintenance records
    const { data: maintenanceRecords } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('equipment_id', parsedData.id)
      .order('maintenance_date', { ascending: false })
      .limit(5)

    // Get active reservations
    const { data: activeReservations } = await supabase
      .from('reservation_calendar')
      .select('*')
      .eq('equipment_id', parsedData.id)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(3)

    return NextResponse.json({
      success: true,
      equipment: {
        id: equipment.id,
        name: equipment.name,
        description: equipment.description,
        serial_number: equipment.serial_number,
        category: equipment.categories?.name,
        location: equipment.location,
        status: statusData?.current_status || 'available',
        return_due_date: statusData?.return_due_date,
        calibration_status: statusData?.calibration_status,
        qr_code_url: equipment.equipment_qr_codes[0]?.qr_code_url
      },
      recent_maintenance: maintenanceRecords || [],
      upcoming_reservations: activeReservations || []
    })

  } catch (error) {
    console.error('Error scanning QR code:', error)
    return NextResponse.json(
      { error: 'Failed to process QR code' },
      { status: 500 }
    )
  }
}