import QRCode from 'qrcode'
import { supabase } from './supabase'

export interface QRCodeData {
  equipment_id: string
  name: string
  serial_number: string
  category?: string
  location?: string
}

export interface GeneratedQRCode {
  qr_code_data: string
  qr_code_url: string
  equipment_id: string
}

export class QRCodeService {
  /**
   * Generate QR code data for equipment
   */
  static generateQRData(equipment: QRCodeData): string {
    return JSON.stringify({
      id: equipment.equipment_id,
      name: equipment.name,
      serial: equipment.serial_number,
      category: equipment.category,
      location: equipment.location,
      type: 'lab-equipment',
      generated: new Date().toISOString()
    })
  }

  /**
   * Generate QR code image as data URL
   */
  static async generateQRImage(data: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
      return qrCodeDataURL
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * Generate and save QR code for equipment
   */
  static async generateEquipmentQR(equipment: QRCodeData): Promise<GeneratedQRCode> {
    try {
      const qrData = this.generateQRData(equipment)
      const qrImageUrl = await this.generateQRImage(qrData)

      const { data, error } = await (supabase as any)
        .from('equipment_qr_codes')
        .insert({
          equipment_id: equipment.equipment_id,
          qr_code_data: qrData,
          qr_code_url: qrImageUrl
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving QR code:', error)
        throw new Error('Failed to save QR code to database')
      }

      return {
        qr_code_data: qrData,
        qr_code_url: qrImageUrl,
        equipment_id: equipment.equipment_id
      }
    } catch (error) {
      console.error('Error generating equipment QR code:', error)
      throw error
    }
  }

  /**
   * Get QR code for equipment
   */
  static async getEquipmentQR(equipmentId: string): Promise<GeneratedQRCode | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('equipment_qr_codes')
        .select('*')
        .eq('equipment_id', equipmentId)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return {
        qr_code_data: data.qr_code_data,
        qr_code_url: data.qr_code_url,
        equipment_id: data.equipment_id
      }
    } catch (error) {
      console.error('Error getting equipment QR code:', error)
      return null
    }
  }

  /**
   * Parse QR code data
   */
  static parseQRData(qrData: string): any {
    try {
      return JSON.parse(qrData)
    } catch (error) {
      console.error('Error parsing QR data:', error)
      throw new Error('Invalid QR code data format')
    }
  }

  /**
   * Validate QR code data
   */
  static validateQRData(qrData: any): boolean {
    try {
      return (
        qrData &&
        qrData.type === 'lab-equipment' &&
        qrData.id &&
        qrData.name &&
        qrData.serial &&
        qrData.generated
      )
    } catch (error) {
      return false
    }
  }

  /**
   * Generate QR codes for multiple equipment
   */
  static async generateBulkQRCodes(equipmentList: QRCodeData[]): Promise<GeneratedQRCode[]> {
    const results: GeneratedQRCode[] = []

    for (const equipment of equipmentList) {
      try {
        const qrCode = await this.generateEquipmentQR(equipment)
        results.push(qrCode)
      } catch (error) {
        console.error(`Failed to generate QR for equipment ${equipment.name}:`, error)
      }
    }

    return results
  }

  /**
   * Deactivate QR code for equipment
   */
  static async deactivateQR(equipmentId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('equipment_qr_codes')
        .update({ is_active: false })
        .eq('equipment_id', equipmentId)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error deactivating QR code:', error)
      throw error
    }
  }

  /**
   * Regenerate QR code for equipment
   */
  static async regenerateEquipmentQR(equipment: QRCodeData): Promise<GeneratedQRCode> {
    try {
      await this.deactivateQR(equipment.equipment_id)
      return await this.generateEquipmentQR(equipment)
    } catch (error) {
      console.error('Error regenerating equipment QR code:', error)
      throw error
    }
  }
}