# Project Context

## Purpose
A comprehensive laboratory equipment inventory management system built for educational institutions. The system automates equipment tracking, borrowing/returning processes, and reporting to streamline laboratory operations. It provides role-based access control for administrators, lab staff, lecturers, and students, ensuring proper equipment management while facilitating academic research and learning activities.

## Tech Stack
- **Frontend Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript 5.x
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS 4.x with modern design patterns
- **Database**: Supabase (PostgreSQL) with RLS policies
- **Authentication**: Supabase Auth with role-based access control
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: Zustand for client-side state
- **Data Fetching**: TanStack Query (React Query) for server state
- **Charts**: Recharts for analytics dashboards
- **Date Handling**: date-fns for date manipulation
- **Icons**: Lucide React icon library

## Project Conventions

### Code Style
- **TypeScript**: Strict mode enabled with comprehensive type definitions
- **Component Structure**: Functional components with hooks, following composition patterns
- **File Organization**: Feature-based directory structure under `/components/`
- **Naming Conventions**:
  - Components: PascalCase (e.g., `EquipmentList.tsx`)
  - Files: kebab-case for utilities, PascalCase for components
  - Variables: camelCase
  - Database: snake_case for tables/columns

### Architecture Patterns
- **App Router**: Next.js 13+ App Router with nested layouts
- **Server Components**: RSC for data fetching where possible
- **API Routes**: RESTful endpoints under `/app/api/`
- **Database Design**: PostgreSQL with UUID primary keys, audit logging, and triggers
- **Security**: Row Level Security (RLS) policies in Supabase
- **State Management**: Combination of server state (React Query) and client state (Zustand)

### Testing Strategy
- **Type Checking**: TypeScript compiler (`npm run type-check`)
- **Linting**: ESLint with Next.js configuration
- **Testing**: Currently being implemented - Jest and React Testing Library recommended
- **Database Testing**: Supabase migrations for schema validation

### Git Workflow
- **Branching**: Feature-based branching from `master`
- **Commits**: Conventional commits format (feat:, fix:, docs:, etc.)
- **Code Review**: Pull requests required for all changes
- **Version Control**: Git with descriptive commit messages in Indonesian/English mix

## Domain Context

### Educational Institution Management
- **User Roles**: Hierarchical access control (admin > lab_staff > lecturer > student)
- **Academic Structure**: Department-based organization with student/lecturer identification
- **Equipment Categories**: Electronics, mechanical, chemical, optical, measurement, computer, general
- **Borrowing Workflow**: Request → Approval → Usage → Return with status tracking

### Laboratory Operations
- **Equipment Lifecycle**: Purchase → Usage → Maintenance → Retirement
- **Maintenance Types**: Routine, repair, calibration, replacement
- **Audit Trail**: Complete audit logging for all database operations
- **Status Management**: Real-time equipment availability tracking

## Important Constraints
- **Educational Compliance**: Must support academic scheduling and curriculum requirements
- **Data Privacy**: Student and staff information protection
- **Equipment Safety**: Proper tracking and maintenance scheduling
- **Multi-tenant**: Department-level data isolation
- **Performance**: Support concurrent users during peak academic periods
- **Accessibility**: WCAG compliance for educational accessibility requirements

## External Dependencies
- **Supabase**: Database, authentication, and real-time subscriptions
- **Node Package Registry**: All npm dependencies from registry.npmjs.org
- **Browser APIs**: Local storage for session management, browser geolocation (optional)
- **Email Service**: Through Supabase for notifications and reminders
- **File Storage**: Supabase Storage for equipment images and documents
