# Demo Account Setup

## 🎯 Quick Testing (Development Mode)

The application now includes **development mode** that allows you to test with demo accounts without setting up Supabase Auth first!

### Demo Accounts Available:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@example.com` | `admin123` | Full system access |
| **Student** | `student@example.com` | `student123` | Student dashboard |
| **Lecturer** | `lecturer@example.com` | `lecturer123` | Lecturer features |
| **Lab Staff** | `labstaff@example.com` | `labstaff123` | Lab management |

### How to Test:

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Click on any demo account** in the login page - it will auto-fill the form

3. **Click "Masuk"** - You'll be logged in immediately (bypasses Supabase Auth in dev mode)

4. **Test the enhanced features**:
   - **Real-time Analytics**: Visit `/dashboard/analytics`
   - **Notifications**: Check the sidebar notification bell
   - **Role-based Navigation**: Different menus for different user types

## 🔧 Production Setup

When you're ready to deploy to production, you'll need to:

### 1. Create Real Users in Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication → Users**
3. Click "Add user" for each demo account:
   - Email: `admin@example.com`, Password: `admin123`
   - Email: `student@example.com`, Password: `student123`
   - etc.

### 2. Create User Profiles

Run the SQL in `CREATE_DEMO_USERS.sql` (after updating the UUIDs from step 1):

```sql
-- Replace with actual UUIDs from Supabase Auth users
INSERT INTO public.users (id, email, password_hash, full_name, role, department, nim, nip) VALUES
('ACTUAL_ADMIN_UUID', 'admin@example.com', 'supabase_auth_managed', 'Administrator', 'admin', 'System Administration', null, 'ADMIN001');
```

**Important Notes**:
- The `password_hash` field contains a dummy value `'supabase_auth_managed'` because actual password authentication is handled by Supabase Auth
- **NIM (Student ID)**: Required for student role, leave as null for staff roles
- **NIP (Staff ID)**: Required for admin/lecturer/lab_staff roles, leave as null for students
- The database has a constraint ensuring proper ID assignment based on user role

### 3. Update Environment Variables

Ensure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Features to Test

### For All Users:
- ✅ **Login/Logout functionality**
- ✅ **Real-time analytics dashboard** (if user has access)
- ✅ **Notification system** (check sidebar bell)
- ✅ **Responsive design**

### Admin Access:
- ✅ **Full system management**
- ✅ **User management**
- ✅ **Analytics dashboard**
- ✅ **System settings**

### Student Access:
- ✅ **View equipment catalog**
- ✅ **Submit borrowing requests**
- ✅ **View borrowing history**
- ✅ **Receive notifications**

### Lab Staff Access:
- ✅ **Manage equipment**
- ✅ **Approve/deny requests**
- ✅ **Maintenance records**
- ✅ **Analytics dashboard**

### Lecturer Access:
- ✅ **Borrow equipment**
- ✅ **View student activity**
- ✅ **Manage class-related equipment**

## 🔍 Troubleshooting

**Login not working?**
- Ensure you're in development mode (`npm run dev`)
- Check the console for any errors
- Try refreshing the page and logging in again

**Real-time features not working?**
- Go to Supabase Dashboard → Settings → API
- Enable "Realtime" and add tables to publications

**Notifications not showing?**
- Check browser console for connection errors
- Ensure realtime is enabled in Supabase

## 📝 Notes

- The development mode bypasses Supabase Auth completely
- Production mode will require proper Supabase Auth setup
- All other features (real-time, notifications, analytics) work in both modes
- Demo users will have mock data for testing purposes

Happy testing! 🎯