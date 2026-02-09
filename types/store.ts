// ============================================================================
// BULLMONEY STORE - TYPE DEFINITIONS
// ============================================================================

// Base Types
export type UUID = string;
export type ISODateString = string;

// Enums
export type OrderStatus = 
  | 'PENDING' 
  | 'PAID' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'REFUNDED';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export interface Category {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: UUID | null;
  sort_order: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ProductDetails {
  material?: string;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
  };
  weight?: string;
  care_instructions?: string;
  rating_stats?: {
    average: number;
    count: number;
    distribution: {
      '1': number;
      '2': number;
      '3': number;
      '4': number;
      '5': number;
    };
  };
  [key: string]: unknown;
}

export interface Product {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  base_price: number;
  compare_at_price: number | null;
  category_id: UUID | null;
  status: ProductStatus;
  featured: boolean;
  tags: string[];
  details: ProductDetails;
  seo_title: string | null;
  seo_description: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ProductImage {
  id: UUID;
  product_id: UUID;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: ISODateString;
}

// Product Media (Images + Videos)
export type MediaType = 'image' | 'video';

export interface ProductMedia {
  id: UUID;
  product_id: UUID;
  media_type: MediaType;
  url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  title: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  sort_order: number;
  is_primary: boolean;
  metadata: Record<string, unknown>;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface VariantOptions {
  media?: ProductMedia[]; // New: unified media array (images + videos)
  size?: string;
  color?: string;
  [key: string]: string | undefined;
}

export interface Variant {
  id: UUID;
  product_id: UUID;
  sku: string | null;
  name: string;
  options: VariantOptions;
  price_adjustment: number;
  inventory_count: number;
  low_stock_threshold: number;
  weight_grams: number | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// Extended product with relations
export interface ProductWithDetails extends Product {
  category?: Category | null;
  images: ProductImage[];
  media?: ProductMedia[];
  variants: Variant[];
  primary_image?: string | null;
  total_inventory?: number;
  min_inventory?: number;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface Address {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default?: boolean;
}

export interface Profile {
  id: UUID;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  saved_addresses: Address[];
  preferences: Record<string, unknown>;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Admin {
  id: UUID;
  user_id: UUID;
  role: AdminRole;
  permissions: Record<string, boolean>;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface ProductSnapshot {
  id: UUID;
  name: string;
  sku: string | null;
  price: number;
  image_url: string | null;
  options: VariantOptions;
}

export interface OrderItem {
  id: UUID;
  order_id: UUID;
  product_id: UUID | null;
  variant_id: UUID | null;
  product_snapshot: ProductSnapshot;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: ISODateString;
}

export interface Order {
  id: UUID;
  order_number: string;
  user_id: UUID | null;
  guest_email: string | null;
  status: OrderStatus;
  shipping_address: Address;
  billing_address: Address | null;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: ISODateString;
  updated_at: ISODateString;
  paid_at: ISODateString | null;
  shipped_at: ISODateString | null;
  delivered_at: ISODateString | null;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  customer_name?: string;
  customer_email?: string;
  item_count?: number;
  total_quantity?: number;
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

export interface Review {
  id: UUID;
  product_id: UUID;
  user_id: UUID;
  order_id: UUID | null;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ReviewWithUser extends Review {
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

// ============================================================================
// DISCOUNT TYPES
// ============================================================================

export interface DiscountCode {
  id: UUID;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  starts_at: ISODateString | null;
  expires_at: ISODateString | null;
  is_active: boolean;
  created_at: ISODateString;
}

// ============================================================================
// CART TYPES
// ============================================================================

export interface CartItem {
  id: string; // Composite: `${productId}-${variantId}`
  product: ProductWithDetails;
  variant: Variant;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  discount_code: string | null;
  discount_amount: number;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
}

// ============================================================================
// CHECKOUT TYPES
// ============================================================================

export type CheckoutStep = 'cart' | 'information' | 'shipping' | 'payment' | 'confirmation';

export interface CheckoutState {
  step: CheckoutStep;
  email: string;
  shipping_address: Address | null;
  billing_address: Address | null;
  same_as_shipping: boolean;
  shipping_method: ShippingMethod | null;
  payment_intent_id: string | null;
  client_secret: string | null;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_days: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ProductFilters {
  category?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  tags?: string[];
  sort_by?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface AdminStats {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  total_customers: number;
  revenue_change: number;
  orders_change: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  base_price: number;
  compare_at_price: number | null;
  category_id: string;
  status: ProductStatus;
  featured: boolean;
  tags: string[];
  details: ProductDetails;
  seo_title: string;
  seo_description: string;
  variants: Omit<Variant, 'id' | 'product_id' | 'created_at' | 'updated_at'>[];
  images: File[];
}
