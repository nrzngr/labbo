'use client'

import { CalibrationTracker } from '@/components/maintenance/calibration-tracker'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { Target, AlertTriangle, TrendingUp } from 'lucide-react'

export default function CalibrationPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calibration Management</h1>
          <p className="text-gray-600 mt-2">Track and manage equipment calibration schedules</p>
        </div>

        <ModernButton
          onClick={() => window.location.href = '/dashboard/equipment'}
          variant="outline"
        >
          View Equipment
        </ModernButton>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calibration Tracker */}
        <div className="lg:col-span-2">
          <CalibrationTracker />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <ModernCard variant="default" padding="lg">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <ModernButton
                variant="outline"
                className="w-full justify-start"
                leftIcon={<Target className="w-4 h-4" />}
              >
                Schedule Calibration
              </ModernButton>
              <ModernButton
                variant="outline"
                className="w-full justify-start"
                leftIcon={<AlertTriangle className="w-4 h-4" />}
              >
                Report Calibration Issue
              </ModernButton>
              <ModernButton
                variant="outline"
                className="w-full justify-start"
                leftIcon={<TrendingUp className="w-4 h-4" />}
              >
                Calibration Analytics
              </ModernButton>
            </div>
          </ModernCard>

          {/* Calibration Tips */}
          <ModernCard variant="outline" padding="lg">
            <h3 className="text-lg font-semibold mb-4">Calibration Guidelines</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-blue-500 mt-0.5" />
                <p>Regular calibration ensures measurement accuracy and compliance</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <p>Schedule calibrations 30 days before expiry to avoid delays</p>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                <p>Keep calibration certificates for audit and quality assurance</p>
              </div>
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  )
}