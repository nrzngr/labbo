# Laboratory Equipment Inventory Management System

A comprehensive laboratory equipment inventory management system built with Next.js, TypeScript, Supabase, and shadcn/ui components. This system automates equipment tracking, borrowing/returning processes, and reporting for educational institutions.

## Features

- **Equipment Management**: Full CRUD operations for laboratory equipment
- **User Management**: Role-based access control (admin, lab staff, lecturer, student)
- **Borrowing System**: Equipment borrowing request with approval workflow
- **Real-time Dashboard**: Statistics and recent activities
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## Technology Stack

- **Frontend**: Next.js 14 with App Router
- **UI Components**: shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lab-inventory-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   a. Create a new Supabase project at [supabase.com](https://supabase.com)

   b. Run the database schema:
   ```sql
   -- Copy and execute the contents of database/schema.sql in your Supabase SQL editor
   ```

   c. Get your Supabase URL and anon key from the Supabase dashboard

4. **Environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   DATABASE_URL=your_database_url_here
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The system uses the following main tables:

- `categories` - Equipment categories
- `equipment` - Laboratory equipment items
- `user_profiles` - User information and roles
- `borrowing_transactions` - Equipment borrowing records
- `maintenance_records` - Equipment maintenance logs

See `database/schema.sql` for the complete schema definition.

## User Roles

- **Admin**: Full access to all features and user management
- **Lab Staff**: Can manage equipment and approve borrowing requests
- **Lecturer**: Can borrow equipment and view reports
- **Student**: Can borrow equipment and view available items

## Usage

### For Admins

1. Register an account with the admin role
2. Set up equipment categories
3. Add laboratory equipment
4. Manage user accounts
5. Monitor borrowing activities

### For Lab Staff

1. Register an account with the lab_staff role
2. Add and manage equipment
3. Approve borrowing requests
4. Track equipment maintenance

### For Students and Lecturers

1. Register an account with the appropriate role
2. Browse available equipment
3. Submit borrowing requests
4. Return equipment on time

## Project Structure

```
lab-inventory-system/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── (dashboard)/      # Dashboard pages
│   ├── api/             # API routes
│   ├── components/      # Reusable components
│   ├── lib/             # Utilities and configurations
│   └── globals.css      # Global styles
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Authentication components
│   ├── equipment/       # Equipment management components
│   └── ...              # Other feature components
├── database/
│   └── schema.sql       # Database schema
└── public/              # Static assets
```

## Current Status

✅ **Completed Features:**
- Next.js project setup with TypeScript
- Supabase configuration and database schema
- Authentication system with role-based access
- Equipment management CRUD operations
- shadcn/ui components integration
- Responsive design foundation

🚧 **In Progress:**
- Borrowing transactions system
- Advanced dashboard with statistics
- User management interface
- Reporting functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

---

**Note**: This is a comprehensive laboratory inventory management system. Make sure to properly configure Supabase and run the database schema before using the application.
