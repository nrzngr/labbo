import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QRPrintGridProps {
    items: Array<{
        id: string
        name: string
        serial_number: string
        qr_data: string
    }>
}

export function QRPrintGrid({ items }: QRPrintGridProps) {
    return (
        <div className="w-full max-w-[210mm] mx-auto bg-white p-[5mm]">
            <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

            <div className="grid grid-cols-3 gap-[2mm] auto-rows-[45mm]">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-lg break-inside-avoid"
                        style={{ height: '45mm' }}
                    >
                        <div className="mb-2">
                            <QRCodeSVG
                                value={item.qr_data}
                                size={100}
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                        <div className="text-center w-full overflow-hidden">
                            <div className="font-bold text-[10px] uppercase truncate px-1">
                                {item.name}
                            </div>
                            <div className="font-mono text-[8px] text-gray-600 truncate">
                                {item.serial_number}
                            </div>
                            <div className="text-[6px] text-gray-400 mt-1">
                                {item.id.split('-')[0]}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
