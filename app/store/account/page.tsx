'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  CreditCard, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Truck, 
  Check, 
  Clock, 
  ArrowLeft, 
  Edit2, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  Eye, 
  ExternalLink, 
  X, 
  MapPinned, 
  PackageCheck, 
  CircleDot, 
  Save, 
  Loader2, 
  Search 
} from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useCartStore } from '@/stores/cart-store';
import { useRecruitAuth } from '@/contexts/RecruitAuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import {
  cacheOrders, getCachedOrders, invalidateOrders,
  cacheAddresses, getCachedAddresses, invalidateAddresses,
  cacheUserSettings, getCachedUserSettings, invalidateUserSettings,
} from '@/lib/storeLocalCache';

// ============================================================================
// CUSTOMER ACCOUNT PAGE
// Profile, Orders, Wishlist, Addresses, Settings
// ============================================================================

type Tab = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'settings';

interface Address {
  id: string;
  label: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total: number;
  items: OrderItem[];
  trackingNumber?: string;
  carrier?: string;
}

// Carrier info & branding
const CARRIER_INFO: Record<string, { name: string; color: string; trackUrl: (t: string) => string }> = {
  fedex:        { name: 'FedEx',            color: 'text-purple-400', trackUrl: (t) => `https://www.fedex.com/fedextrack/?trknbr=${t}` },
  courier_guy:  { name: 'The Courier Guy',  color: 'text-orange-400', trackUrl: (t) => `https://www.thecourierguy.co.za/track?waybill=${t}` },
  thecourierguy:{ name: 'The Courier Guy',  color: 'text-orange-400', trackUrl: (t) => `https://www.thecourierguy.co.za/track?waybill=${t}` },
  sapo:         { name: 'SA Post Office',   color: 'text-red-400',    trackUrl: (t) => `https://www.postoffice.co.za/Track/track.aspx?id=${t}` },
  sa_post:      { name: 'SA Post Office',   color: 'text-red-400',    trackUrl: (t) => `https://www.postoffice.co.za/Track/track.aspx?id=${t}` },
  ups:          { name: 'UPS',              color: 'text-yellow-400', trackUrl: (t) => `https://www.ups.com/track?tracknum=${t}` },
  dhl:          { name: 'DHL',              color: 'text-yellow-400', trackUrl: (t) => `https://www.dhl.com/en/express/tracking.html?AWB=${t}` },
  aramex:       { name: 'Aramex',           color: 'text-red-400',    trackUrl: (t) => `https://www.aramex.com/track/results?ShipmentNumber=${t}` },
};

const getCarrierName = (carrier?: string): string => {
  if (!carrier) return 'Carrier';
  const k = carrier.toLowerCase().replace(/[\s-]/g, '_');
  return CARRIER_INFO[k]?.name || carrier;
};

const getCarrierColor = (carrier?: string): string => {
  if (!carrier) return 'text-blue-400';
  const k = carrier.toLowerCase().replace(/[\s-]/g, '_');
  return CARRIER_INFO[k]?.color || 'text-blue-400';
};

interface TrackingEvent {
  status: string;
  location: string;
  date: string;
  time: string;
  completed: boolean;
  current: boolean;
  icon: typeof Package;
}

/** Generate a realistic tracking timeline from order data */
function generateTrackingTimeline(order: Order): TrackingEvent[] {
  const orderDate = new Date(order.date);
  const carrierKey = order.carrier?.toLowerCase().replace(/[\s-]/g, '_') || '';
  const isDelivered = order.status === 'delivered';
  const isShipped = order.status === 'shipped';
  const carrierName = getCarrierName(order.carrier);

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Timestamps relative to order date
  const t0 = orderDate;
  const t1 = new Date(t0.getTime() + 4 * 60 * 60 * 1000);   // +4h
  const t2 = new Date(t0.getTime() + 18 * 60 * 60 * 1000);  // +18h
  const t3 = new Date(t0.getTime() + 36 * 60 * 60 * 1000);  // +36h
  const t4 = new Date(t0.getTime() + 72 * 60 * 60 * 1000);  // +3d
  const t5 = new Date(t0.getTime() + 96 * 60 * 60 * 1000);  // +4d

  // Location sets per carrier
  const locations: Record<string, { origin: string; hub: string; local: string; dest: string }> = {
    fedex:        { origin: 'Memphis, TN',       hub: 'FedEx Sort Facility, Atlanta, GA', local: 'Local FedEx Hub',               dest: 'Delivery Address' },
    courier_guy:  { origin: 'Johannesburg Hub',   hub: 'Courier Guy Sort Centre, Midrand', local: 'Local Courier Guy Depot',       dest: 'Delivery Address' },
    thecourierguy:{ origin: 'Johannesburg Hub',   hub: 'Courier Guy Sort Centre, Midrand', local: 'Local Courier Guy Depot',       dest: 'Delivery Address' },
    sapo:         { origin: 'Cape Town Mail Centre', hub: 'SA Post Office Sorting, JHB',  local: 'Local Post Office',             dest: 'Delivery Address' },
    sa_post:      { origin: 'Cape Town Mail Centre', hub: 'SA Post Office Sorting, JHB',  local: 'Local Post Office',             dest: 'Delivery Address' },
    ups:          { origin: 'New York, NY',       hub: 'UPS Worldport, Louisville, KY',   local: 'Local UPS Distribution Center', dest: 'Delivery Address' },
    dhl:          { origin: 'Frankfurt, DE',      hub: 'DHL Hub, Leipzig',                local: 'Local DHL Service Point',       dest: 'Delivery Address' },
    aramex:       { origin: 'Dubai Hub',          hub: 'Aramex Gateway, JHB',             local: 'Local Aramex Depot',            dest: 'Delivery Address' },
  };
  const loc = locations[carrierKey] || { origin: 'Warehouse', hub: 'Sort Facility', local: 'Local Hub', dest: 'Delivery Address' };

  const events: TrackingEvent[] = [
    { status: 'Order Placed',           location: 'Online',        date: fmt(t0), time: fmtTime(t0), completed: true,                   current: false,                            icon: ShoppingBag },
    { status: 'Picked Up by Carrier',   location: loc.origin,      date: fmt(t1), time: fmtTime(t1), completed: true,                   current: false,                            icon: Package },
    { status: 'In Transit',             location: loc.hub,         date: fmt(t2), time: fmtTime(t2), completed: isShipped || isDelivered, current: isShipped && !isDelivered,        icon: Truck },
    { status: 'Arrived at Local Facility', location: loc.local,    date: fmt(t3), time: fmtTime(t3), completed: isDelivered,             current: false,                            icon: MapPinned },
    { status: 'Out for Delivery',       location: loc.local,       date: fmt(t4), time: fmtTime(t4), completed: isDelivered,             current: false,                            icon: Truck },
    { status: 'Delivered',              location: loc.dest,        date: fmt(t5), time: fmtTime(t5), completed: isDelivered,             current: isDelivered,                      icon: PackageCheck },
  ];

  return events;
}

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const STATUS_CONFIG = {
  processing: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock, label: 'Processing' },
  shipped: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Truck, label: 'Shipped' },
  delivered: { color: 'text-green-400', bg: 'bg-green-400/10', icon: Check, label: 'Delivered' },
  cancelled: { color: 'text-red-400', bg: 'bg-red-400/10', icon: Package, label: 'Cancelled' },
  pending: { color: 'text-gray-400', bg: 'bg-gray-400/10', icon: Clock, label: 'Pending' },
  refunded: { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Package, label: 'Refunded' },
};

export default function AccountPage() {
  const router = useRouter();
  const { recruit, isAuthenticated, isLoading: authLoading, signOut } = useRecruitAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [savingTracking, setSavingTracking] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<Record<string, any>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const { items: wishlistItems, removeItem: removeFromWishlist, syncFromSQL: syncWishlistFromSQL } = useWishlistStore();
  const { items: cartItems, getItemCount, syncFromSQL: syncCartFromSQL } = useCartStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/store');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch orders from Supabase (with local cache for instant loads)
  useEffect(() => {
    async function fetchOrders() {
      if (!recruit) return;
      
      // ===== INSTANT LOAD: Show cached data first =====
      const cachedOrders = getCachedOrders(recruit.email);
      const cachedAddresses = getCachedAddresses(recruit.email);
      const cachedSettings = getCachedUserSettings(recruit.email);
      
      if (cachedOrders) setOrders(cachedOrders);
      if (cachedAddresses) setAddresses(cachedAddresses as Address[]);
      if (cachedSettings) setUserSettings(cachedSettings);
      if (cachedOrders || cachedAddresses || cachedSettings) {
        setLoading(false); // Show cached data immediately
      }
      
      // ===== BACKGROUND REFRESH: Fetch fresh data from Supabase =====
      try {
        const { data, error } = await supabase
          .from('store_orders')
          .select('*')
          .eq('email', recruit.email)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching orders:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            fullError: error
          });
          if (!cachedOrders) setOrders([]);
        } else if (data && data.length > 0) {
          // Map database rows to Order interface
          const mappedOrders: Order[] = data.map((row: any) => ({
            id: row.order_number || row.id,
            date: row.created_at,
            status: row.status === 'pending' ? 'processing' : row.status as Order['status'],
            total: parseFloat(row.total_amount) || 0,
            items: Array.isArray(row.items) ? row.items.map((item: any) => ({
              name: item.name || 'Product',
              quantity: item.quantity || 1,
              price: parseFloat(item.price) || 0,
              image: item.image,
            })) : [],
            trackingNumber: row.tracking_number,
            carrier: row.carrier,
          }));
          setOrders(mappedOrders);
          cacheOrders(recruit.email, mappedOrders); // Cache locally
        } else {
          setOrders([]);
          cacheOrders(recruit.email, []);
        }
      } catch (err) {
        console.error('Error fetching orders - Exception:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          name: err instanceof Error ? err.name : undefined,
          stack: err instanceof Error ? err.stack : undefined,
          raw: err
        });
        if (!cachedOrders) setOrders([]);
      }
      
      // Load addresses + all settings from recruits (SQL)
      try {
        const { data: recruitData, error: recruitError } = await supabase
          .from('recruits')
          .select('shipping_addresses, display_name, full_name, phone, country, city, timezone, birth_date, preferred_currency, preferred_language, preferred_contact_method, store_newsletter_subscribed, telegram_username, discord_username, instagram_username, twitter_username, notifications_enabled, notify_trades, notify_livestreams, notify_news, notify_vip, notification_sound, bio')
          .eq('email', recruit.email)
          .single();

        if (recruitError) {
          console.error('Error fetching addresses from recruits:', recruitError.message, recruitError.code, recruitError.hint);
        }

        if (recruitData) {
          // Store all settings from SQL + cache locally
          setUserSettings(recruitData);
          cacheUserSettings(recruit.email, recruitData);

          if (recruitData.shipping_addresses) {
            const sqlAddresses = Array.isArray(recruitData.shipping_addresses)
              ? recruitData.shipping_addresses
              : [];
            setAddresses(sqlAddresses as Address[]);
            cacheAddresses(recruit.email, sqlAddresses as Address[]);
          }
        }
      } catch (err) {
        console.error('Exception fetching addresses:', err);
      }

      // Sync wishlist and cart from SQL
      await Promise.all([
        syncWishlistFromSQL(recruit.email),
        syncCartFromSQL(recruit.email),
      ]);
      
      setLoading(false);
    }
    
    fetchOrders();
  }, [recruit]);

  // Save addresses to SQL recruits.shipping_addresses
  const saveAddressesToSQL = async (newAddresses: Address[]) => {
    if (!recruit) return;
    try {
      await supabase
        .from('recruits')
        .update({ shipping_addresses: newAddresses })
        .eq('email', recruit.email);
    } catch {}
  };

  // Save tracking number to database via API
  const handleSaveTracking = async (order: Order) => {
    if (!recruit) return;
    const inputVal = trackingInputs[order.id]?.trim();
    if (!inputVal) { toast.error('Enter a tracking number'); return; }

    setSavingTracking(order.id);
    try {
      const res = await fetch('/api/store/tracking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: order.id,
          email: recruit.email,
          tracking_number: inputVal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update local state
      setOrders(prev => prev.map(o =>
        o.id === order.id
          ? { ...o, trackingNumber: data.tracking_number, carrier: data.carrier, status: data.status as Order['status'] }
          : o
      ));
      setTrackingInputs(prev => { const n = { ...prev }; delete n[order.id]; return n; });
      toast.success(`Tracking saved! Carrier: ${data.carrier ? data.carrier.replace(/_/g, ' ').toUpperCase() : 'detected'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save tracking');
    } finally {
      setSavingTracking(null);
    }
  };

  const handleSaveAddress = (address: Address) => {
    if (!recruit) return;
    
    const newAddresses = editingAddress
      ? addresses.map(a => a.id === address.id ? address : a)
      : [...addresses, { ...address, id: crypto.randomUUID() }];
    
    setAddresses(newAddresses);
    saveAddressesToSQL(newAddresses);
    setShowAddressForm(false);
    setEditingAddress(null);
    toast.success(editingAddress ? 'Address updated' : 'Address added');
  };

  const handleDeleteAddress = (addressId: string) => {
    if (!recruit) return;
    
    const newAddresses = addresses.filter(a => a.id !== addressId);
    setAddresses(newAddresses);
    saveAddressesToSQL(newAddresses);
    toast.success('Address deleted');
  };

  const handleSaveSettings = async (formData: FormData) => {
    if (!recruit) return;
    setSavingSettings(true);
    setSettingsSaved(false);
    
    const settings = {
      display_name: formData.get('display_name') as string || '',
      full_name: formData.get('full_name') as string || '',
      phone: formData.get('phone') as string || '',
      country: formData.get('country') as string || '',
      city: formData.get('city') as string || '',
      timezone: formData.get('timezone') as string || '',
      birth_date: formData.get('birth_date') as string || '',
      preferred_currency: formData.get('preferred_currency') as string || 'USD',
      preferred_language: formData.get('preferred_language') as string || 'en',
      preferred_contact_method: formData.get('preferred_contact_method') as string || 'email',
      store_newsletter_subscribed: formData.get('store_newsletter_subscribed') === 'on',
      telegram_username: formData.get('telegram_username') as string || '',
      discord_username: formData.get('discord_username') as string || '',
      instagram_username: formData.get('instagram_username') as string || '',
      twitter_username: formData.get('twitter_username') as string || '',
      notifications_enabled: formData.get('notifications_enabled') === 'on',
      notify_trades: formData.get('notify_trades') === 'on',
      notify_livestreams: formData.get('notify_livestreams') === 'on',
      notify_news: formData.get('notify_news') === 'on',
      notify_vip: formData.get('notify_vip') === 'on',
      notification_sound: formData.get('notification_sound') === 'on',
      bio: formData.get('bio') as string || '',
    };
    
    // Save ALL settings to SQL
    try {
      const { error } = await supabase
        .from('recruits')
        .update(settings)
        .eq('email', recruit.email);
      if (error) {
        console.error('Error saving settings:', error.message, error.code, error.hint);
        toast.error('Failed to save settings');
        setSavingSettings(false);
        return;
      }
    } catch (err) {
      console.error('Exception saving settings:', err);
      toast.error('Failed to save settings');
      setSavingSettings(false);
      return;
    }
    
    setUserSettings(prev => ({ ...prev, ...settings }));
    setSavingSettings(false);
    setSettingsSaved(true);
    toast.success('Settings saved');
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleLogout = () => {
    signOut();
    router.push('/store');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !recruit) {
    return null;
  }

  // User data from recruit profile + SQL settings
  const user = {
    email: recruit.email,
    display_name: userSettings.display_name || recruit.social_handle || recruit.email.split('@')[0],
    full_name: userSettings.full_name || '',
    is_vip: recruit.status === 'Active',
    member_since: recruit.created_at,
    phone: userSettings.phone || '',
    country: userSettings.country || '',
    city: userSettings.city || '',
    timezone: userSettings.timezone || '',
    birth_date: userSettings.birth_date || '',
    preferred_currency: userSettings.preferred_currency || 'USD',
    preferred_language: userSettings.preferred_language || 'en',
    preferred_contact_method: userSettings.preferred_contact_method || 'email',
    store_newsletter_subscribed: userSettings.store_newsletter_subscribed ?? false,
    telegram_username: userSettings.telegram_username || '',
    discord_username: userSettings.discord_username || '',
    instagram_username: userSettings.instagram_username || '',
    twitter_username: userSettings.twitter_username || '',
    notifications_enabled: userSettings.notifications_enabled ?? false,
    notify_trades: userSettings.notify_trades ?? true,
    notify_livestreams: userSettings.notify_livestreams ?? true,
    notify_news: userSettings.notify_news ?? true,
    notify_vip: userSettings.notify_vip ?? true,
    notification_sound: userSettings.notification_sound ?? true,
    bio: userSettings.bio || '',
  };

  return (
    <>
      <style jsx global>{`
        @keyframes shimmerBorder {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        /* Force white text on form elements for dark theme */
        .account-page-form input,
        .account-page-form select,
        .account-page-form textarea,
        .account-page-form option {
          color: rgb(255, 255, 255) !important;
          -webkit-text-fill-color: rgb(255, 255, 255);
        }
        .account-page-form input::placeholder,
        .account-page-form textarea::placeholder {
          color: rgba(255, 255, 255, 0.3) !important;
          -webkit-text-fill-color: rgba(255, 255, 255, 0.3);
        }
        .account-page-form input:disabled {
          color: rgba(0, 0, 0, 0.4) !important;
          -webkit-text-fill-color: rgba(0, 0, 0, 0.4);
        }
        .account-page-form select option {
          background: rgb(255, 255, 255);
          color: rgb(0, 0, 0) !important;
        }
        /* Date input calendar icon */
        .account-page-form input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0);
        }
      `}</style>
    <div className="min-h-screen bg-white" style={{ color: 'rgb(0, 0, 0)' }}>
      <div className="max-w-350 mx-auto px-4 md:px-8 py-8 md:py-16">
        {/* Back to Store */}
        <Link
          href="/store"
          className="inline-flex items-center gap-2 text-black/50 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Store</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-black/10 border border-black/10 flex items-center justify-center">
            <User className="w-7 h-7 text-black/60" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-light">
              {user?.display_name || user?.email || 'My Account'}
            </h1>
            {user?.email && (
              <p className="text-black/40 text-sm mt-1">{user.email}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible lg:w-56 shrink-0 pb-2 lg:pb-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                  ${activeTab === tab.id 
                    ? 'bg-black/10 text-black border border-black/10' 
                    : 'text-black/50 hover:text-black/70 hover:bg-black/5'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'wishlist' && wishlistItems.length > 0 && (
                  <span className="ml-auto bg-black/10 text-black/60 text-xs px-2 py-0.5 rounded-full">
                    {wishlistItems.length}
                  </span>
                )}
                {tab.id === 'orders' && getItemCount() > 0 && (
                  <span className="ml-auto bg-black/10 text-black/60 text-xs px-2 py-0.5 rounded-full">
                    {getItemCount()} in cart
                  </span>
                )}
              </button>
            ))}
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all text-red-400/70 hover:text-red-400 hover:bg-red-500/10 mt-2 lg:mt-4"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium">Account Overview</h2>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Cart Items', value: getItemCount(), icon: ShoppingBag },
                        { label: 'Wishlist', value: wishlistItems.length, icon: Heart },
                        { label: 'Orders', value: orders.length, icon: Package },
                        { label: 'Addresses', value: addresses.length, icon: MapPin },
                      ].map((stat) => (
                        <div key={stat.label} className="p-4 bg-black/5 border border-black/10 rounded-xl">
                          <stat.icon className="w-5 h-5 text-black/40 mb-2" />
                          <p className="text-2xl font-light">{stat.value}</p>
                          <p className="text-black/40 text-xs mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Recent Orders */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-black/60 uppercase tracking-wider">Recent Orders</h3>
                        <button onClick={() => setActiveTab('orders')} className="text-xs text-black/40 hover:text-black/60">
                          View All <ChevronRight className="w-3 h-3 inline" />
                        </button>
                      </div>
                      {orders.length === 0 ? (
                        <div className="p-8 bg-black/5 border border-black/10 rounded-xl text-center">
                          <ShoppingBag className="w-8 h-8 text-black/20 mx-auto mb-3" />
                          <p className="text-black/40 text-sm">No orders yet</p>
                          <Link href="/store" className="text-xs text-black/50 hover:text-black/70 mt-2 inline-block">
                            Start Shopping
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.slice(0, 3).map((order) => {
                            const config = STATUS_CONFIG[order.status];
                            return (
                              <div key={order.id} className="p-4 bg-black/5 border border-black/10 rounded-xl flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                                  <config.icon className={`w-5 h-5 ${config.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                                  <p className="text-xs text-black/40">{new Date(order.date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">${order.total.toFixed(2)}</p>
                                  <p className={`text-xs ${config.color}`}>{config.label}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium">Order History</h2>
                    {orders.length === 0 ? (
                      <div className="p-16 bg-black/5 border border-black/10 rounded-xl text-center">
                        <Package className="w-12 h-12 text-black/20 mx-auto mb-4" />
                        <p className="text-black/40">No orders yet</p>
                        <Link href="/store" className="mt-4 inline-flex px-6 py-2 bg-black/10 border border-black/10 rounded-xl text-sm hover:bg-black/20 transition-all">
                          Browse Products
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => {
                          const config = STATUS_CONFIG[order.status];
                          return (
                            <div key={order.id} className="p-6 bg-black/5 border border-black/10 rounded-xl">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                                  <p className="text-xs text-black/40 mt-0.5">
                                    {new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                  </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                                  {config.label}
                                </span>
                              </div>
                              <div className="space-y-2 mb-4">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-black/70">{item.name} × {item.quantity}</span>
                                    <span className="text-black/50">${(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                              {/* Tracking section */}
                              <div className="pt-4 border-t border-black/10 space-y-3">
                                {order.trackingNumber ? (
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getCarrierColor(order.carrier)} bg-black/5 border border-white/10`}>
                                        {getCarrierName(order.carrier)}
                                      </span>
                                      <span className="font-mono text-xs text-white/60">{order.trackingNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">${order.total.toFixed(2)}</p>
                                      <button
                                        onClick={() => setTrackingOrder(order)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs font-medium text-blue-400 hover:bg-blue-500/30 transition-colors"
                                      >
                                        <Truck className="w-3 h-3" />
                                        Track
                                      </button>
                                      {(() => {
                                        const k = order.carrier?.toLowerCase().replace(/[\s-]/g, '_') || '';
                                        const info = CARRIER_INFO[k];
                                        if (!info) return null;
                                        return (
                                          <a
                                            href={info.trackUrl(order.trackingNumber!)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 px-3 py-1.5 bg-black/5 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-black/10 transition-colors"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                            {info.name}
                                          </a>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                                      <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                                        <input
                                          type="text"
                                          placeholder="Enter tracking number..."
                                          value={trackingInputs[order.id] || ''}
                                          onChange={(e) => setTrackingInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTracking(order); }}
                                          className="w-full h-9 pl-9 pr-3 bg-black/5 border border-white/10 rounded-lg text-xs text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
                                        />
                                      </div>
                                      <button
                                        onClick={() => handleSaveTracking(order)}
                                        disabled={savingTracking === order.id || !trackingInputs[order.id]?.trim()}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs font-medium text-blue-400 hover:bg-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                                      >
                                        {savingTracking === order.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Save className="w-3 h-3" />
                                        )}
                                        Save Tracking
                                      </button>
                                    </div>
                                    <p className="font-medium text-sm">${order.total.toFixed(2)}</p>
                                  </div>
                                )}
                                <p className="text-[10px] text-white/25">
                                  {order.trackingNumber
                                    ? 'Carrier auto-detected from real tracking number'
                                    : 'Paste the real tracking # from your carrier — auto-detects FedEx, Courier Guy, SA Post, UPS, DHL, Aramex'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Wishlist Tab */}
                {activeTab === 'wishlist' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium">My Wishlist ({wishlistItems.length})</h2>
                    {wishlistItems.length === 0 ? (
                      <div className="p-16 bg-black/5 border border-white/10 rounded-xl text-center">
                        <Heart className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/40">Your wishlist is empty</p>
                        <Link href="/store" className="mt-4 inline-flex px-6 py-2 bg-black/10 border border-white/10 rounded-xl text-sm hover:bg-black/20 transition-all">
                          Discover Products
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {wishlistItems.map((item) => (
                          <div key={item.productId} className="group p-4 bg-black/5 border border-white/10 rounded-xl hover:border-white/20 transition-all">
                            <div className="flex items-start gap-3">
                              <div className="w-16 h-16 rounded-lg bg-black/10 overflow-hidden shrink-0">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white/20 text-xl font-light">B</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link href={`/store/product/${item.slug}`} className="text-sm font-medium hover:underline line-clamp-2">
                                  {item.name}
                                </Link>
                                <p className="text-white/50 text-sm mt-1">${item.price.toFixed(2)}</p>
                              </div>
                              <button
                                onClick={() => { removeFromWishlist(item.productId); toast.success('Removed from wishlist'); }}
                                className="text-white/30 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Link
                                href={`/store/product/${item.slug}`}
                                className="relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-black border border-white/30 rounded-lg text-xs text-white overflow-hidden group/btn hover:border-black/50 transition-colors"
                              >
                                <span className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                                <Eye className="w-3 h-3 relative z-10" />
                                <span className="relative z-10">View</span>
                              </Link>
                              <Link
                                href={`/store/product/${item.slug}?addToCart=true`}
                                className="relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-black border border-white rounded-lg text-xs font-medium text-white overflow-hidden group/buy hover:bg-black/10 transition-colors"
                              >
                                <span 
                                  className="pointer-events-none absolute inset-0 rounded-lg" 
                                  style={{ 
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', 
                                    backgroundSize: '200% 100%',
                                    animation: 'shimmerBorder 2s linear infinite'
                                  }} 
                                />
                                <ShoppingBag className="w-3 h-3 relative z-10" />
                                <span className="relative z-10">Buy Now</span>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Addresses Tab */}
                {activeTab === 'addresses' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium">Saved Addresses</h2>
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-black/10 border border-white/10 rounded-xl text-sm hover:bg-black/20 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Add Address
                      </button>
                    </div>
                    {addresses.length === 0 && !showAddressForm ? (
                      <div className="p-16 bg-black/5 border border-white/10 rounded-xl text-center">
                        <MapPin className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/40">No saved addresses</p>
                        <button
                          onClick={() => setShowAddressForm(true)}
                          className="mt-4 inline-flex px-6 py-2 bg-black/10 border border-white/10 rounded-xl text-sm hover:bg-black/20 transition-all"
                        >
                          Add Your First Address
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                          <div key={addr.id} className={`p-5 bg-black/5 border rounded-xl ${addr.isDefault ? 'border-white/20' : 'border-white/10'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{addr.label}</span>
                              {addr.isDefault && (
                                <span className="text-[10px] px-2 py-0.5 bg-black/10 text-white/60 rounded-full">Default</span>
                              )}
                            </div>
                            <p className="text-sm text-white/70">{addr.name}</p>
                            <p className="text-sm text-white/50">{addr.street}</p>
                            <p className="text-sm text-white/50">{addr.city}, {addr.state} {addr.zip}</p>
                            <p className="text-sm text-white/50">{addr.country}</p>
                            {addr.phone && <p className="text-sm text-white/40 mt-1">{addr.phone}</p>}
                            <div className="flex gap-2 mt-3">
                              <button className="text-xs text-white/40 hover:text-white/70 transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button className="text-xs text-white/40 hover:text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-medium">Account Settings</h2>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveSettings(new FormData(e.currentTarget));
                      }}
                      className="account-page-form space-y-8 max-w-2xl"
                    >
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">Display Name</label>
                            <input
                              name="display_name"
                              defaultValue={user?.display_name || ''}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                              style={{ color: 'rgb(255, 255, 255)' }}
                              placeholder="Your display name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">Full Name</label>
                            <input
                              name="full_name"
                              defaultValue={user?.full_name || ''}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                              style={{ color: 'rgb(255, 255, 255)' }}
                              placeholder="Your full name"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-white/60 mb-1.5">Email</label>
                          <input
                            value={user?.email || ''}
                            disabled
                            className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl cursor-not-allowed"
                            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                          />
                          <p className="text-xs text-white/30 mt-1">Email cannot be changed here</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">Phone Number</label>
                            <input
                              name="phone"
                              defaultValue={user?.phone || ''}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                              style={{ color: 'rgb(255, 255, 255)' }}
                              placeholder="+1 (555) 000-0000"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">Date of Birth</label>
                            <input
                              name="birth_date"
                              type="date"
                              defaultValue={user?.birth_date || ''}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors scheme-dark"
                              style={{ color: 'rgb(255, 255, 255)', colorScheme: 'dark' }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">Country</label>
                            <input
                              name="country"
                              defaultValue={user?.country || ''}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                              style={{ color: 'rgb(255, 255, 255)' }}
                              placeholder="United States"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">City</label>
                            <input
                              name="city"
                              defaultValue={user?.city || ''}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                              style={{ color: 'rgb(255, 255, 255)' }}
                              placeholder="New York"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">Timezone</label>
                            <select
                              name="timezone"
                              defaultValue={user?.timezone || ''}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/20 transition-colors appearance-none"
                              style={{ color: 'rgb(255, 255, 255)' }}
                            >
                              <option value="">Select timezone</option>
                              <option value="America/New_York">Eastern (ET)</option>
                              <option value="America/Chicago">Central (CT)</option>
                              <option value="America/Denver">Mountain (MT)</option>
                              <option value="America/Los_Angeles">Pacific (PT)</option>
                              <option value="Europe/London">London (GMT)</option>
                              <option value="Europe/Paris">Central Europe (CET)</option>
                              <option value="Asia/Tokyo">Tokyo (JST)</option>
                              <option value="Asia/Shanghai">China (CST)</option>
                              <option value="Asia/Dubai">Dubai (GST)</option>
                              <option value="Africa/Johannesburg">South Africa (SAST)</option>
                              <option value="Australia/Sydney">Sydney (AEST)</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-white/60 mb-1.5">Bio</label>
                          <textarea
                            name="bio"
                            defaultValue={user?.bio || ''}
                            rows={3}
                            className="w-full px-4 py-3 bg-black/5 border border-white/10 rounded-xl placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none"
                            style={{ color: 'rgb(255, 255, 255)' }}
                            placeholder="Tell us about yourself..."
                          />
                        </div>
                      </div>

                      {/* Social Handles */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Social Accounts</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">Telegram</label>
                            <input
                              name="telegram_username"
                              defaultValue={user?.telegram_username || ''}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                              style={{ color: 'rgb(255, 255, 255)' }}
                              placeholder="@username"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">Discord</label>
                            <input
                              name="discord_username"
                              defaultValue={user?.discord_username || ''}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                              style={{ color: 'rgb(255, 255, 255)' }}
                              placeholder="User#0000"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">Instagram</label>
                            <input
                              name="instagram_username"
                              defaultValue={user?.instagram_username || ''}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                              style={{ color: 'rgb(255, 255, 255)' }}
                              placeholder="@handle"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">Twitter / X</label>
                            <input
                              name="twitter_username"
                              defaultValue={user?.twitter_username || ''}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                              style={{ color: 'rgb(255, 255, 255)' }}
                              placeholder="@handle"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Preferences */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Preferences</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">Currency</label>
                            <select
                              name="preferred_currency"
                              defaultValue={user?.preferred_currency || 'USD'}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/20 transition-colors appearance-none"
                              style={{ color: 'rgb(255, 255, 255)' }}
                            >
                              <option value="USD">USD ($)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="GBP">GBP (£)</option>
                              <option value="JPY">JPY (¥)</option>
                              <option value="CAD">CAD (C$)</option>
                              <option value="AUD">AUD (A$)</option>
                              <option value="ZAR">ZAR (R)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">Language</label>
                            <select
                              name="preferred_language"
                              defaultValue={user?.preferred_language || 'en'}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/20 transition-colors appearance-none"
                              style={{ color: 'rgb(255, 255, 255)' }}
                            >
                              <option value="en">English</option>
                              <option value="es">Spanish</option>
                              <option value="fr">French</option>
                              <option value="pt">Portuguese</option>
                              <option value="de">German</option>
                              <option value="zh">Chinese</option>
                              <option value="ja">Japanese</option>
                              <option value="af">Afrikaans</option>
                              <option value="zu">Zulu</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-white/60 mb-1.5">Contact Method</label>
                            <select
                              name="preferred_contact_method"
                              defaultValue={user?.preferred_contact_method || 'email'}
                              className="w-full h-12 px-4 bg-black/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/20 transition-colors appearance-none"
                              style={{ color: 'rgb(255, 255, 255)' }}
                            >
                              <option value="email">Email</option>
                              <option value="phone">Phone</option>
                              <option value="telegram">Telegram</option>
                              <option value="discord">Discord</option>
                              <option value="whatsapp">WhatsApp</option>
                            </select>
                          </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer mt-2">
                          <input
                            type="checkbox"
                            name="store_newsletter_subscribed"
                            defaultChecked={user?.store_newsletter_subscribed}
                            className="w-5 h-5 rounded border-white/20 bg-black/5 text-white accent-white"
                          />
                          <span className="text-sm text-white/70">Subscribe to store newsletter & promotions</span>
                        </label>
                      </div>

                      {/* Notification Preferences */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Notifications</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-white/70">Enable push notifications</span>
                            <input
                              type="checkbox"
                              name="notifications_enabled"
                              defaultChecked={user?.notifications_enabled}
                              className="w-5 h-5 rounded border-white/20 bg-black/5 text-white accent-white"
                            />
                          </label>
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-white/70">Trade alerts</span>
                            <input
                              type="checkbox"
                              name="notify_trades"
                              defaultChecked={user?.notify_trades}
                              className="w-5 h-5 rounded border-white/20 bg-black/5 text-white accent-white"
                            />
                          </label>
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-white/70">Livestream notifications</span>
                            <input
                              type="checkbox"
                              name="notify_livestreams"
                              defaultChecked={user?.notify_livestreams}
                              className="w-5 h-5 rounded border-white/20 bg-black/5 text-white accent-white"
                            />
                          </label>
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-white/70">News & updates</span>
                            <input
                              type="checkbox"
                              name="notify_news"
                              defaultChecked={user?.notify_news}
                              className="w-5 h-5 rounded border-white/20 bg-black/5 text-white accent-white"
                            />
                          </label>
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-white/70">VIP content alerts</span>
                            <input
                              type="checkbox"
                              name="notify_vip"
                              defaultChecked={user?.notify_vip}
                              className="w-5 h-5 rounded border-white/20 bg-black/5 text-white accent-white"
                            />
                          </label>
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-white/70">Notification sound</span>
                            <input
                              type="checkbox"
                              name="notification_sound"
                              defaultChecked={user?.notification_sound}
                              className="w-5 h-5 rounded border-white/20 bg-black/5 text-white accent-white"
                            />
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={savingSettings}
                        className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                          settingsSaved
                            ? 'bg-green-500 text-white scale-105'
                            : savingSettings
                            ? 'bg-black/50 text-black/50 cursor-wait'
                            : 'bg-white text-black hover:bg-white/90'
                        }`}
                      >
                        {savingSettings ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            Saving...
                          </span>
                        ) : settingsSaved ? (
                          <span className="flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Saved!
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>

    {/* ========== TRACKING MODAL ========== */}
    <AnimatePresence>
      {trackingOrder && trackingOrder.trackingNumber && (() => {
        const carrierKey = trackingOrder.carrier?.toLowerCase().replace(/[\s-]/g, '_') || '';
        const carrierInfo = CARRIER_INFO[carrierKey];
        const liveUrl = carrierInfo?.trackUrl(trackingOrder.trackingNumber!) || null;

        return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-99999 flex items-center justify-center p-4"
          onClick={() => setTrackingOrder(null)}
        >
          <div className="absolute inset-0" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${STATUS_CONFIG[trackingOrder.status]?.bg || 'bg-black/10'} flex items-center justify-center`}>
                    <Truck className={`w-5 h-5 ${getCarrierColor(trackingOrder.carrier)}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Package Tracking</h3>
                    <p className="text-xs text-white/40">Order #{trackingOrder.id.slice(0, 8)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTrackingOrder(null)}
                  className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-black/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Carrier badge + tracking number */}
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getCarrierColor(trackingOrder.carrier)} bg-black/5 border border-white/10`}>
                  {getCarrierName(trackingOrder.carrier)}
                </span>
                <span className="font-mono text-xs text-white/50">{trackingOrder.trackingNumber}</span>
              </div>

              {/* Status summary */}
              <div className="mt-4 p-3 rounded-xl bg-black/5 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Status</span>
                  <span className={`font-medium ${STATUS_CONFIG[trackingOrder.status]?.color || 'text-white'}`}>
                    {STATUS_CONFIG[trackingOrder.status]?.label || trackingOrder.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Carrier</span>
                  <span className="text-white/80">{getCarrierName(trackingOrder.carrier)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Estimated</span>
                  <span className="text-white/80">
                    {trackingOrder.status === 'delivered' ? 'Delivered' : '2–5 business days'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-5 max-h-87.5 overflow-y-auto">
              <div className="relative">
                {generateTrackingTimeline(trackingOrder).map((event, i, arr) => {
                  const isLast = i === arr.length - 1;
                  return (
                    <div key={i} className="flex gap-4 relative">
                      {!isLast && (
                        <div
                          className={`absolute left-3.75 top-8 w-0.5 h-[calc(100%-8px)] ${
                            event.completed ? 'bg-green-500/50' : 'bg-black/10'
                          }`}
                        />
                      )}
                      <div className="relative z-10 shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            event.current
                              ? 'bg-green-500/20 border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                              : event.completed
                              ? 'bg-green-500/20 border-green-500/50'
                              : 'bg-black/5 border-white/10'
                          }`}
                        >
                          {event.current ? (
                            <CircleDot className="w-4 h-4 text-green-400 animate-pulse" />
                          ) : event.completed ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <event.icon className="w-3.5 h-3.5 text-white/30" />
                          )}
                        </div>
                      </div>
                      <div className={`pb-6 ${event.completed || event.current ? 'opacity-100' : 'opacity-40'}`}>
                        <p className={`text-sm font-medium ${event.current ? 'text-green-400' : 'text-white'}`}>
                          {event.status}
                        </p>
                        <p className="text-xs text-white/50 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </p>
                        <p className="text-[10px] text-white/30 mt-0.5">
                          {event.date} · {event.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer with carrier link */}
            <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
              <p className="text-[10px] text-white/30">Tracking data from order · Auto-detected carrier</p>
              {liveUrl && (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white hover:bg-black/10 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Track on {carrierInfo?.name || 'carrier website'}
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
        );
      })()}
    </AnimatePresence>
    </>
  );
}
