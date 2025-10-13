# Design Document: Lab Inventory System Enhancement

## Architecture Overview

This enhancement introduces three major capability areas to the existing Lab Inventory Management System:

1. **Equipment Scheduling & Reservation System**
2. **Preventive Maintenance & Calibration Management**
3. **Mobile Operations & QR Code Integration**

## System Architecture Impact

### Database Schema Extensions

#### New Tables
```sql
-- Equipment Reservations
CREATE TABLE equipment_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status reservation_status DEFAULT 'pending',
    approval_required BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservation Recurrence Patterns
CREATE TABLE reservation_recurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID REFERENCES equipment_reservations(id) NOT NULL,
    pattern_type recurrence_pattern NOT NULL,
    interval_value INTEGER NOT NULL,
    days_of_week TEXT[],
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Schedules
CREATE TABLE maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    maintenance_type maintenance_type NOT NULL,
    scheduled_date DATE NOT NULL,
    frequency_interval INTEGER,
    frequency_unit frequency_unit,
    assigned_to UUID REFERENCES users(id),
    estimated_duration_hours INTEGER,
    priority maintenance_priority DEFAULT 'medium',
    status maintenance_schedule_status DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calibration Records
CREATE TABLE calibration_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    calibration_date DATE NOT NULL,
    next_calibration_date DATE NOT NULL,
    performed_by TEXT NOT NULL,
    certificate_number TEXT,
    certificate_url TEXT,
    calibration_results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Parts Inventory
CREATE TABLE maintenance_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_name TEXT NOT NULL,
    part_number TEXT UNIQUE,
    supplier_id UUID,
    current_stock INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2),
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR Code Management
CREATE TABLE equipment_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    qr_code_data TEXT UNIQUE NOT NULL,
    qr_code_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    printed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- Waitlist Management
CREATE TABLE reservation_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    requested_start_time TIMESTAMPTZ NOT NULL,
    requested_end_time TIMESTAMPTZ NOT NULL,
    priority waitlist_priority DEFAULT 'normal',
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### New Enums
```sql
CREATE TYPE reservation_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'completed');
CREATE TYPE recurrence_pattern AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE frequency_unit AS ENUM ('days', 'weeks', 'months', 'years');
CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE maintenance_schedule_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE waitlist_priority AS ENUM ('low', 'normal', 'high', 'urgent');
```

### Frontend Architecture Enhancements

#### New Component Structure
```
components/
├── scheduling/
│   ├── calendar-view.tsx
│   ├── reservation-form.tsx
│   ├── reservation-list.tsx
│   ├── conflict-resolution.tsx
│   └── waitlist-manager.tsx
├── maintenance/
│   ├── maintenance-scheduler.tsx
│   ├── calibration-tracker.tsx
│   ├── maintenance-calendar.tsx
│   ├── parts-inventory.tsx
│   └── vendor-management.tsx
├── mobile/
│   ├── qr-scanner.tsx
│   ├── mobile-checkout.tsx
│   ├── offline-sync.tsx
│   └── push-notifications.tsx
└── analytics/
    ├── utilization-dashboard.tsx
    ├── maintenance-analytics.tsx
    └── cost-analysis.tsx
```

#### Service Layer Extensions
```typescript
// services/scheduling-service.ts
export class SchedulingService {
  async createReservation(reservation: ReservationData): Promise<Reservation>
  async checkAvailability(equipmentId: string, startTime: Date, endTime: Date): Promise<boolean>
  async createRecurringReservation(pattern: RecurrencePattern): Promise<Reservation[]>
  async addToWaitlist(waitlistEntry: WaitlistEntry): Promise<WaitlistEntry>
  async resolveConflicts(conflictId: string): Promise<ConflictResolution>
}

// services/maintenance-service.ts
export class MaintenanceService {
  async scheduleMaintenance(maintenance: MaintenanceSchedule): Promise<MaintenanceSchedule>
  async recordCalibration(calibration: CalibrationRecord): Promise<CalibrationRecord>
  async trackPartsUsage(usage: PartsUsage): Promise<void>
  async calculateMTBF(equipmentId: string): Promise<number>
  async predictMaintenance(equipmentId: string): Promise<MaintenancePrediction[]>
}

// services/mobile-service.ts
export class MobileService {
  async generateQRCode(equipmentId: string): Promise<QRCode>
  async processOfflineSync(data: OfflineData[]): Promise<void>
  async sendPushNotification(notification: PushNotification): Promise<void>
  async authenticateMobile(credentials: MobileCredentials): Promise<AuthToken>
}
```

## Technical Considerations

### Performance Implications
- **Calendar Views**: Implement virtual scrolling for large datasets
- **Real-time Updates**: Use WebSocket connections for live reservation status
- **Offline Support**: Implement IndexedDB for local data caching
- **QR Code Generation**: Use client-side generation to reduce server load

### Security Considerations
- **Mobile Authentication**: Implement JWT with refresh tokens
- **Offline Data**: Encrypt sensitive data stored on mobile devices
- **API Rate Limiting**: Protect against abuse of reservation endpoints
- **Data Validation**: Strict validation for all scheduling inputs

### Integration Points
- **Email Service**: Enhanced notification system for scheduling and maintenance
- **Calendar Integration**: Sync with institutional calendar systems
- **Push Notification Service**: Firebase or similar for mobile notifications
- **File Storage**: Enhanced support for calibration certificates and maintenance photos

## Implementation Phases

### Phase 1: Foundation (High Priority)
1. **Equipment Scheduling Core**
   - Basic reservation system
   - Calendar interface
   - Conflict detection
   - Approval workflows

2. **Mobile QR Code System**
   - QR code generation
   - Basic mobile scanning
   - Simple checkout process

### Phase 2: Advanced Features (Medium Priority)
1. **Preventive Maintenance**
   - Scheduling automation
   - Calibration tracking
   - Parts inventory
   - Cost tracking

2. **Enhanced Mobile Features**
   - Offline capabilities
   - Push notifications
   - Advanced scanning

### Phase 3: Optimization (Low Priority)
1. **Analytics & Reporting**
   - Utilization analytics
   - Predictive maintenance
   - Advanced reporting

2. **System Integration**
   - LMS integration
   - Financial system sync
   - Advanced APIs

## Data Migration Strategy

### Existing Data Enhancement
- Migrate current maintenance records to new maintenance system
- Generate QR codes for existing equipment
- Create default maintenance schedules based on equipment types
- Establish baseline utilization metrics

### Data Validation
- Validate existing equipment data for scheduling compatibility
- Ensure all equipment have proper categorization for maintenance scheduling
- Verify user permissions and roles for new workflows
- Test data integrity after migration

## Testing Strategy

### Unit Testing
- Reservation conflict detection algorithms
- Maintenance schedule generation
- QR code generation and validation
- Offline sync mechanisms

### Integration Testing
- Mobile app synchronization
- Email notification delivery
- Calendar integration
- Payment processing (if applicable)

### Performance Testing
- Calendar view rendering with large datasets
- Concurrent reservation processing
- Mobile app offline performance
- Database query optimization

### User Acceptance Testing
- Lab staff workflow testing
- Student reservation experience
- Mobile usability testing
- Maintenance process validation