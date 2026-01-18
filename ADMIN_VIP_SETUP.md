# Admin VIP Panel & Telegram Multi-Channel Setup

## Overview

This system provides:
1. **Multi-Channel Telegram Feed** - Display messages from multiple Telegram channels (main, shop, VIP)
2. **VIP Access Control** - VIP-only channels that check status every 5 seconds
3. **Admin Panel** - Full user/recruit management with authentication
4. **Responsive Design** - Works on all screen sizes with double-tap/outside-click close

---

## Environment Variables Required

Add these to your `.env.local`:

```env
# Admin Authentication
ADMIN_EMAIL=mrbullmoney@gmail.com
ADMIN_PASSWORD=your_secure_password_here

# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Database Setup (Supabase)

### 1. Ensure your `profiles` table has these columns:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_document_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes TEXT;
```

### 2. Create recruits table (if not exists):

```sql
CREATE TABLE IF NOT EXISTS recruits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  telegram_username TEXT,
  discord_username TEXT,
  referral_code TEXT,
  status TEXT DEFAULT 'pending',
  payment_screenshot_url TEXT,
  id_document_url TEXT,
  notes TEXT,
  is_vip BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Files Created/Modified

### New Files:
- `/components/AdminPanelVIP.tsx` - Full admin panel with VIP management
- `/hooks/useVipStatus.ts` - VIP status hook with 5-second polling
- `/app/api/admin/route.ts` - Admin authentication & user management API
- `/app/api/vip/status/route.ts` - VIP status check endpoint
- `/app/api/auth/session/route.ts` - Session verification endpoint
- `/app/api/telegram/channel/route.ts` - Multi-channel Telegram scraping

### Modified Files:
- `/components/CommunityQuickAccess.tsx` - Added channel tabs and VIP checks

---

## Telegram Channels Configuration

The system supports these channels:

| Channel Key | Name | Handle | VIP Required |
|-------------|------|--------|--------------|
| `main` | BullMoney FX | @bullmoneyfx | No |
| `shop` | Shop | @Bullmoneyshop | No |
| `vip` | VIP | @bullmoneyvip | Yes |

To add more channels, edit the `CHANNELS` object in:
- `/app/api/telegram/channel/route.ts`
- `/components/CommunityQuickAccess.tsx`

---

## Usage

### Opening Admin Panel

The admin panel can be opened via:

1. **Event dispatch:**
```javascript
window.dispatchEvent(new CustomEvent('openAdminModal'));
```

2. **Using UIStateContext:**
```typescript
const { openAdminModal } = useUIState();
openAdminModal();
```

3. **Direct component usage:**
```tsx
import { AdminPanel } from '@/components/AdminPanelVIP';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Admin</button>
      <AdminPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
```

### VIP Status Hook

```typescript
import { useVipStatus, useCurrentUserVipStatus } from '@/hooks/useVipStatus';

// For specific user
const { isVip, loading, error, lastChecked } = useVipStatus({ 
  userId: 'user-uuid',
  pollingInterval: 5000 // 5 seconds
});

// For current logged-in user
const { isVip, loading, userId } = useCurrentUserVipStatus(5000);
```

---

## Admin Panel Features

### Authentication
- Email/password login
- Validates against ADMIN_EMAIL and ADMIN_PASSWORD env vars
- Session persists in localStorage

### User Management
- View all users with search
- Toggle VIP status instantly
- Edit user details (name, phone, telegram, discord, notes)
- View uploaded documents (payment screenshots, ID)

### Tabs
1. **All Users** - Complete user list
2. **Recruits** - Recruit applications
3. **VIP Members** - Filter to VIP-only users

### Mobile Optimizations
- Responsive layout
- Back button on user detail view
- Double-tap backdrop to close
- Outside click to close
- Swipe-friendly scrolling

---

## API Endpoints

### POST /api/admin

Actions:
- `login` - Authenticate admin
- `get_users` - Fetch all users
- `get_recruits` - Fetch all recruits
- `update_user` - Update user data
- `toggle_vip` - Toggle VIP status

### GET /api/vip/status

Query params:
- `userId` - User UUID to check

Returns: `{ isVip: boolean }`

### GET /api/telegram/channel

Query params:
- `channel` - Channel key (main, shop, vip)

Returns: `{ success: boolean, posts: TelegramPost[], channel: string }`

---

## Security Notes

1. **Admin credentials** are stored in environment variables, not in code
2. **Service role key** is only used server-side for admin operations
3. **VIP status** is checked every 5 seconds for real-time access control
4. **Session tokens** should be replaced with proper JWT in production

---

## Troubleshooting

### Telegram feed not loading
- Channels must be public (t.me/s/{channel} accessible)
- Private groups cannot be scraped
- Check API response in Network tab

### VIP status not updating
- Verify SUPABASE_SERVICE_ROLE_KEY is set
- Check profiles table has is_vip column
- Confirm user ID is being passed correctly

### Admin login failing
- Verify ADMIN_EMAIL and ADMIN_PASSWORD in .env.local
- Restart dev server after env changes
- Check browser console for errors
