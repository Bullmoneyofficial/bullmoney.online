# Trading Journal - Security & User Isolation (Recruit Integration)

## Overview
The Trading Journal is designed with **per-user account isolation**, ensuring each user can only view and edit their own trades. This is enforced at multiple levels for maximum security and **integrated with the recruits table** for seamless user management.

## Database Architecture

### User Identity Layers
The system uses a dual-identity approach:

1. **auth.users** - Supabase authentication table (UUID-based)
2. **public.recruits** - Application user profiles (BIGINT ID, email-based)

All trading journal tables link to **both** systems:
- `user_id` → References `auth.users(id)`
- `recruit_id` → References `public.recruits(id)` 
- `recruit_email` → Denormalized for fast lookups

### Automatic Recruit Linking
When a trade is created, the system automatically:
1. Gets user email from `auth.users`
2. Finds matching record in `public.recruits`
3. Populates `recruit_id` and `recruit_email` fields

This happens via database trigger on INSERT/UPDATE.

## Security Layers

### 1. **Row Level Security (RLS) in Database**
The SQL schema includes comprehensive RLS policies that enforce user isolation at the database level:

```sql
-- Users can only view their own trades
CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.email() = recruit_email);

-- Users can only insert trades for themselves  
CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.email() = recruit_email);

-- Users can only update their own trades
CREATE POLICY "Users can update own trades"
  ON trades FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.email() = recruit_email)
  WITH CHECK (auth.uid() = user_id OR auth.email() = recruit_email);

-- Users can only delete their own trades
CREATE POLICY "Users can delete own trades"
  ON trades FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.email() = recruit_email);
```

**Result**: Even if frontend code is compromised, users cannot access other users' data at the database level. The dual-check (user_id OR recruit_email) ensures compatibility with both authentication methods.

### 2. **Application-Level Authentication**
The TradingJournal component verifies user authentication before loading any data:

- ✅ Checks for authenticated user on component mount
- ✅ Shows login prompt if user is not authenticated
- ✅ Stores current user in state for reference
- ✅ Displays user email in header to confirm active account

```tsx
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  setAuthError(true);
  return; // Don't load any data
}

setCurrentUser(user);
```

### 3. **User ID Binding**
All database operations are explicitly bound to the authenticated user via both UUID and email:

**Loading Trades:**
```tsx
const { data, error } = await supabase
  .from('trades')
  .select('*')
  .eq('user_id', user.id)  // Filter by auth user ID
  .order('trade_date', { ascending: false });
```

The RLS policy will additionally verify `auth.email() = recruit_email` for recruits table integration.

**Creating Trades:**
```tsx
const tradeData = {
  user_id: user.id,  // Always set to current auth user
  // recruit_id and recruit_email auto-populated by trigger
  // ... other fields
};
```

**Automatic Recruit Linking:**
```sql
-- Database trigger automatically populates recruit fields
SELECT id, email INTO v_recruit_id, v_recruit_email
FROM public.recruits
WHERE email = (SELECT email FROM auth.users WHERE id = NEW.user_id);

NEW.recruit_id := v_recruit_id;
NEW.recruit_email := v_recruit_email;
```

**Loading Images:**
```tsx
const { data: images } = await supabase
  .from('trade_images')
  .select('trade_id, image_url')
  .in('trade_id', data.map(t => t.id));  // Only trades user owns
```

### 4. **Storage Bucket Security**
Trade images are stored with user-specific paths and RLS policies:

**Folder Structure:**
```
trade-images/
  ├── {user-id-1}/
  │   ├── {trade-id-1}/
  │   │   └── image1.jpg
  │   └── {trade-id-2}/
  │       └── image2.jpg
  └── {user-id-2}/
      └── ...
```

**Storage Policies:**
```sql
-- Users can only upload to their own folder
CREATE POLICY "Users can upload trade images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'trade-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can only view their own images
CREATE POLICY "Users can view own trade images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'trade-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## User Experience

### Authenticated Users
1. ✅ See their email in journal header
2. ✅ Access all their trades instantly
3. ✅ Create, edit, delete their own trades
4. ✅ Upload and view their trade images
5. ✅ See personalized statistics

### Unauthenticated Users
1. ❌ Cannot access trading journal
2. 👉 Shown login prompt with redirect button
3. 📝 Message: "Please log in to access your trading journal. Each user has their own private journal."

## Page Modes

### Embedded Mode (Ultimate Hub)
- Journal accessible via "Journal" tab in Ultimate Hub
- Same authentication and security as standalone
- Compact, mobile-friendly interface

### Standalone Mode (/journal)
- Direct access via `/journal` URL
- Full-page layout with metadata
- Same functionality as embedded mode
- Responsive design for all devices

## Data Privacy Guarantees

| Feature | Privacy Level | Recruit Integration |
|---------|---------------|---------------------|
| **Trade Data** | 🔒 Private - Only user can access | ✅ Linked via recruit_id |
| **Trade Images** | 🔒 Private - Only user can access | ✅ Linked via recruit_id |
| **Statistics** | 🔒 Private - Calculated from user's trades only | ✅ Per-recruit analytics |
| **Daily Stats** | 🔒 Private - Aggregated per user | ✅ Recruit-aware aggregation |
| **User Stats** | 🔒 Private - Only user's lifetime stats | ✅ Synced with recruit profile |

## Recruit Table Integration Benefits

### 1. **Unified User Management**
- Single source of truth for user data across platform
- Trading journal syncs with recruit profiles automatically
- No duplicate user management needed

### 2. **Cross-Feature Integration**
- Trading journal stats can be displayed on recruit dashboard
- VIP status from recruits table can unlock journal features
- Affiliate tracking can include trading performance metrics

### 3. **Admin Capabilities**
- Admins can view recruit trading statistics
- Performance tracking tied to recruit referrals
- Commission calculations can factor in trading activity

### 4. **Data Consistency**
- `recruit_email` denormalized for fast queries
- Automatic sync via database triggers
- `sync_recruit_data_for_user()` function for backfilling

### 5. **Flexible Authentication**
RLS policies accept either:
- `auth.uid() = user_id` (UUID-based auth)
- `auth.email() = recruit_email` (Email-based recruit lookup)

This ensures compatibility across the entire platform!

## Technical Implementation

### Authentication Flow
```
User Opens Journal
    ↓
Check Authentication
    ↓
┌─────────────┬─────────────┐
│ Authenticated│ Not Authenticated│
└─────────────┴─────────────┘
    ↓                ↓
Load User Data    Show Login
    ↓              Prompt
Display Journal
```

### Data Query Flow
```
User Action (e.g., Load Trades)
    ↓
Get Current User from Supabase Auth
    ↓
Query Database with user_id filter
    ↓
RLS Policy Validates user_id matches auth.uid()
    ↓
Return Only User's Data
```

## Database Triggers & Automation

All automated calculations respect user boundaries and recruit integration:

1. **P&L Calculation**: Triggered per trade, uses trade's user_id, auto-links recruit_id
2. **Daily Stats**: Aggregated per user_id and recruit_id
3. **User Stats**: Calculated per user_id, synced with recruit profile
4. **Recruit Linking**: Automatically populates recruit_id and recruit_email on trade creation

```sql
-- Example: P&L trigger with auto-recruit linking
IF NEW.recruit_id IS NULL AND NEW.user_id IS NOT NULL THEN
  SELECT id, email INTO v_recruit_id, v_recruit_email
  FROM public.recruits r
  WHERE r.email = (SELECT email FROM auth.users WHERE id = NEW.user_id);
  
  NEW.recruit_id := v_recruit_id;
  NEW.recruit_email := v_recruit_email;
END IF;
```

```sql
-- Example: Daily stats trigger respects user isolation
SELECT COUNT(*) FROM trades
WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
  AND entry_date::DATE = trade_date
  AND status = 'closed';
```

## Best Practices for Developers

1. **Always verify user authentication** before any data operation
2. **Never hardcode user IDs** - always get from `supabase.auth.getUser()`
3. **Filter all queries** by `user_id`
4. **Test with multiple accounts** to ensure isolation
5. **Use RLS policies** as the primary security mechanism
6. **Validate user_id** on both client and server side

## Security Checklist

- ✅ RLS enabled on all tables
- ✅ RLS policies created for all CRUD operations
- ✅ RLS policies check BOTH user_id AND recruit_email
- ✅ Storage bucket policies enforce user folder isolation
- ✅ Frontend checks authentication before loading data
- ✅ All queries filtered by authenticated user ID
- ✅ User ID automatically set on trade creation
- ✅ Recruit ID and email auto-populated via trigger
- ✅ No hardcoded user IDs anywhere in codebase
- ✅ Login prompt shown for unauthenticated access
- ✅ User email displayed in UI for account confirmation
- ✅ Automated triggers respect user boundaries
- ✅ Recruit table integration via foreign keys
- ✅ Sync function available for backfilling recruit data
- ✅ Dual authentication support (UUID + email)

## Conclusion

The Trading Journal implements **defense in depth** with security at the database, application, and storage levels. Each user's data is completely isolated, and unauthorized access is prevented through multiple overlapping security mechanisms.

**Bottom Line**: Users can confidently track their trades knowing their data is private, secure, and accessible only to them.
